//! Update: finds the newest Workstation release on GitHub, downloads its exe, checks its SHA-256 and swaps it for the
//! running one (ADR-0007). Reads GitHub through `gh` when it's logged in, else Windows' `curl.exe`: no HTTP client.

// ── Imports ───────────────────────────────
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

// ── Constants ─────────────────────────────
const REPO: &str = "nyaridev/workstation";
/// The release file the app installs; a release without it is never offered.
const ASSET: &str = "Workstation.exe";
const LATEST_API: &str = "https://api.github.com/repos/nyaridev/workstation/releases/latest";
/// Every release page of this app starts with this.
pub const RELEASE_PAGES: &str = "https://github.com/nyaridev/workstation/releases/";
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

// ── Types ─────────────────────────────────
/// A release of the app.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Release {
    /// `0.2.0`, without the `v`.
    pub version: String,
    /// The release's page on GitHub.
    pub page: String,
    #[serde(skip)]
    url: String,
    /// The SHA-256 GitHub publishes for the exe, in lowercase hex; None when it gives none.
    #[serde(skip)]
    sha256: Option<String>,
}

// How the app reaches GitHub.
enum Tool {
    Gh(PathBuf),
    Curl,
}

// ── Private helpers ───────────────────────
fn command(program: &Path) -> Command {
    let mut command = Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}

// Runs a command: its output, or what it printed on failure.
fn run(mut command: Command) -> Result<String, String> {
    let program = command.get_program().to_string_lossy().into_owned();
    let output = command.output().map_err(|e| format!("Couldn't run {program}: {e}"))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        Err(format!("{program} failed: {}", String::from_utf8_lossy(&output.stderr).trim()))
    }
}

// `gh` when it's installed and logged in: on PATH, or where its installer puts it (a PATH set before the install
// doesn't have it yet).
fn gh() -> Option<PathBuf> {
    let installed = std::env::var_os("ProgramFiles").map(|p| PathBuf::from(p).join("GitHub CLI").join("gh.exe"));
    [Some(PathBuf::from("gh")), installed].into_iter().flatten().find(|gh| {
        let mut status = command(gh);
        status.args(["auth", "status"]);
        status.output().is_ok_and(|o| o.status.success())
    })
}

fn tool() -> Tool {
    gh().map_or(Tool::Curl, Tool::Gh)
}

// `v1.2.3` or `1.2.3` as numbers; None for anything else, pre-releases (`1.2.3-beta`) included.
fn version(tag: &str) -> Option<[u64; 3]> {
    let mut parts = tag.strip_prefix('v').unwrap_or(tag).split('.');
    let numbers = [parts.next()?.parse().ok()?, parts.next()?.parse().ok()?, parts.next()?.parse().ok()?];
    parts.next().is_none().then_some(numbers)
}

fn is_newer(candidate: &str, current: &str) -> bool {
    matches!((version(candidate), version(current)), (Some(a), Some(b)) if a > b)
}

// A release as GitHub's API describes it; None when it isn't a stable version or has no Workstation.exe.
fn parse_release(json: &str) -> Result<Option<Release>, String> {
    let value: Value = serde_json::from_str(json).map_err(|e| format!("GitHub's answer can't be read: {e}"))?;
    let tag = value["tag_name"].as_str().unwrap_or("");
    let asset = value["assets"].as_array().and_then(|assets| assets.iter().find(|a| a["name"] == ASSET));
    let (Some(asset), Some(_)) = (asset, version(tag)) else {
        return Ok(None);
    };
    Ok(Some(Release {
        version: tag.trim_start_matches('v').to_string(),
        page: value["html_url"].as_str().unwrap_or("").to_string(),
        url: asset["browser_download_url"].as_str().unwrap_or("").to_string(),
        sha256: asset["digest"].as_str().and_then(|d| d.strip_prefix("sha256:")).map(str::to_lowercase),
    }))
}

// The latest published release (drafts and pre-releases never are); None when there's none yet, or the repo is
// private and `gh` isn't logged in.
fn latest(tool: &Tool) -> Result<Option<Release>, String> {
    match tool {
        Tool::Gh(gh) => {
            let mut api = command(gh);
            api.args(["api", &format!("repos/{REPO}/releases/latest")]);
            match run(api) {
                Ok(json) => parse_release(&json),
                Err(e) if e.contains("HTTP 404") => Ok(None),
                Err(e) => Err(e),
            }
        }
        Tool::Curl => {
            let mut get = command(Path::new("curl.exe"));
            get.args(["-sS", "--max-time", "30", "-H", "Accept: application/vnd.github+json"]);
            get.args(["-H", "User-Agent: Workstation-app", "-w", "\n%{http_code}", LATEST_API]);
            let output = run(get)?;
            let (body, code) = output.trim_end().rsplit_once('\n').unwrap_or(("", output.trim()));
            match code {
                "200" => parse_release(body),
                "404" => Ok(None),
                other => Err(format!("GitHub answered HTTP {other}.")),
            }
        }
    }
}

// Checks a download against the digest GitHub published; a file that doesn't match is removed.
fn verify(file: &Path, expected: Option<&str>) -> Result<(), String> {
    let expected = expected.ok_or("GitHub published no checksum for this release, so it isn't installed.")?;
    let bytes = fs::read(file).map_err(|e| format!("Can't read the download: {e}"))?;
    if format!("{:x}", Sha256::digest(&bytes)) == expected {
        return Ok(());
    }
    let _ = fs::remove_file(file);
    Err("The download doesn't match GitHub's checksum, so it isn't installed.".to_string())
}

fn download(tool: &Tool, release: &Release, dir: &Path) -> Result<PathBuf, String> {
    fs::create_dir_all(dir).map_err(|e| format!("Can't make {}: {e}", dir.display()))?;
    let file = dir.join(format!("Workstation-{}.exe", release.version));
    let mut get = match tool {
        Tool::Gh(gh) => {
            let mut get = command(gh);
            let tag = format!("v{}", release.version);
            get.args(["release", "download", &tag, "-R", REPO, "-p", ASSET, "--clobber", "-O"]).arg(&file);
            get
        }
        Tool::Curl => {
            let mut get = command(Path::new("curl.exe"));
            get.args(["-fsSL", "--max-time", "600", "-o"]).arg(&file).arg(&release.url);
            get
        }
    };
    get.current_dir(dir);
    run(get)?;
    verify(&file, release.sha256.as_deref())?;
    Ok(file)
}

fn old_copy(exe: &Path) -> PathBuf {
    exe.with_extension("old.exe")
}

// Puts `new` where `exe` is. Windows lets a running exe be renamed, not overwritten: the running one becomes
// `<name>.old.exe`, and comes back if the copy fails.
fn swap(exe: &Path, new: &Path) -> Result<(), String> {
    let old = old_copy(exe);
    let _ = fs::remove_file(&old);
    fs::rename(exe, &old).map_err(|e| format!("Can't replace {}: {e}", exe.display()))?;
    if let Err(e) = fs::copy(new, exe) {
        let _ = fs::remove_file(exe);
        let _ = fs::rename(&old, exe);
        return Err(format!("Can't put the new version in place: {e}"));
    }
    Ok(())
}

// ── Public API ────────────────────────────
/// The newest release when it's newer than `current` and has the exe; None when the app is up to date.
pub fn check(current: &str) -> Result<Option<Release>, String> {
    Ok(latest(&tool())?.filter(|release| is_newer(&release.version, current)))
}

/// Downloads `version` (if it's still the newest release) into `dir`, checks it, swaps it in for `exe` and starts it.
/// The caller quits right after.
pub fn install(version: &str, current: &str, exe: &Path, dir: &Path) -> Result<(), String> {
    let tool = tool();
    let release = latest(&tool)?
        .filter(|release| release.version == version && is_newer(version, current))
        .ok_or_else(|| format!("{version} is no longer the newest release; check again."))?;
    let file = download(&tool, &release, dir)?;
    swap(exe, &file)?;
    Command::new(exe).spawn().map_err(|e| format!("The new version is in place but didn't start: {e}"))?;
    Ok(())
}

/// Removes what an update left behind: the old exe beside `exe`, and the downloads in `dir`. Anything still in use
/// stays until the next start.
pub fn clean_up(exe: &Path, dir: &Path) {
    let _ = fs::remove_file(old_copy(exe));
    let _ = fs::remove_dir_all(dir);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    const HELLO_SHA256: &str = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

    fn release_json(tag: &str, asset: &str) -> String {
        format!(
            r#"{{ "tag_name": "{tag}", "html_url": "https://github.com/nyaridev/workstation/releases/tag/{tag}",
                "assets": [{{ "name": "{asset}", "browser_download_url": "https://example.com/{asset}",
                "digest": "sha256:{}" }}] }}"#,
            HELLO_SHA256.to_uppercase()
        )
    }

    #[test]
    fn compares_stable_versions_only() {
        assert!(is_newer("v0.2.0", "0.1.0"));
        assert!(is_newer("0.10.0", "0.9.9"));
        assert!(!is_newer("0.1.0", "0.1.0"));
        assert!(!is_newer("v0.0.9", "0.1.0"));
        assert!(!is_newer("v1.0.0-beta", "0.1.0"));
        assert!(!is_newer("v1.0", "0.1.0"));
    }

    #[test]
    fn reads_a_release_with_the_exe() {
        let release = parse_release(&release_json("v0.2.0", "Workstation.exe")).unwrap().unwrap();
        assert_eq!(release.version, "0.2.0");
        assert!(release.page.starts_with(RELEASE_PAGES));
        assert_eq!(release.url, "https://example.com/Workstation.exe");
        assert_eq!(release.sha256.as_deref(), Some(HELLO_SHA256));
        assert_eq!(parse_release(&release_json("v0.2.0", "Other.zip")).unwrap(), None, "no exe");
        assert_eq!(parse_release(&release_json("nightly", "Workstation.exe")).unwrap(), None, "not a version");
        assert!(parse_release("{ nope").is_err());
    }

    #[test]
    fn verify_needs_the_published_checksum() {
        let temp = Temp::new();
        temp.file("a.exe", "hello");
        assert!(verify(&temp.0.join("a.exe"), Some(HELLO_SHA256)).is_ok());
        assert!(verify(&temp.0.join("a.exe"), None).is_err(), "no checksum");
        assert!(verify(&temp.0.join("a.exe"), Some("00")).is_err(), "wrong checksum");
        assert!(!temp.0.join("a.exe").exists(), "a download that doesn't match is removed");
    }

    #[test]
    fn swap_keeps_the_old_exe_and_restores_it_on_failure() {
        let temp = Temp::new();
        temp.file("app/Workstation.exe", "old");
        temp.file("updates/Workstation-0.2.0.exe", "new");
        let exe = temp.0.join("app/Workstation.exe");
        swap(&exe, &temp.0.join("updates/Workstation-0.2.0.exe")).unwrap();
        assert_eq!(fs::read_to_string(&exe).unwrap(), "new");
        assert_eq!(fs::read_to_string(temp.0.join("app/Workstation.old.exe")).unwrap(), "old");

        assert!(swap(&exe, &temp.0.join("updates/missing.exe")).is_err());
        assert_eq!(fs::read_to_string(&exe).unwrap(), "new", "the running exe is back under its name");

        clean_up(&exe, &temp.0.join("updates"));
        assert!(!temp.0.join("app/Workstation.old.exe").exists());
        assert!(!temp.0.join("updates").exists());
        assert!(exe.exists());
    }

    #[test]
    #[ignore = "reads the real GitHub repo"]
    fn reads_the_real_latest_release() {
        assert!(latest(&tool()).is_ok());
    }
}
