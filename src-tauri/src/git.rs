//! Git: a repo's branch, uncommitted changes, unpushed commits and remote, read with the `git` command, and a
//! fast-forward pull the user asks for (ADR-0018). The overview reads diffs and commits a page at a time, so a big
//! repo opens as fast as a small one. Nothing is reported when git isn't installed or a folder isn't a repo.

// ── Imports ───────────────────────────────
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;
use std::time::{Duration, Instant};

// ── Constants ─────────────────────────────
/// How many repos are read at the same time.
const PARALLEL: usize = 8;
/// Windows `CREATE_NO_WINDOW`: no console flashes for each git call.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;
/// A file's diff past this many lines is cut, so a generated file can't flood the panel.
const MAX_DIFF_LINES: usize = 400;
/// How long a pull waits for the remote to answer before saying it can't be reached.
const REACH_TIMEOUT: Duration = Duration::from_secs(8);

// ── Types ─────────────────────────────────
/// What git says about one repo.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub branch: String,
    /// Changed, added or untracked files.
    pub uncommitted: usize,
    /// Commits not on the upstream branch; None when the branch has no upstream.
    pub unpushed: Option<usize>,
    /// Commits on the upstream branch that aren't here, as of the last fetch (the app never fetches); None without one.
    pub behind: Option<usize>,
    /// The owner in the `origin` URL (`nyaridev` in github.com/nyaridev/prepkit); None without a remote.
    pub owner: Option<String>,
    /// The repo's name in the `origin` URL (`prepkit`); None without a remote.
    pub repo: Option<String>,
}

/// One commit in a repo's history.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    pub hash: String,
    pub short: String,
    pub subject: String,
    pub author: String,
    /// ISO 8601, with the author's offset.
    pub date: String,
    /// Not on the upstream branch (or, without one, on no remote at all).
    pub unpushed: bool,
}

/// One uncommitted file, as `git status --porcelain` shows it.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Change {
    /// The two status letters: ` M` changed, `A ` added, `??` untracked…
    pub code: String,
    pub path: String,
}

/// One uncommitted file's changes since the last commit.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
    pub path: String,
    /// Lines added and removed; None for untracked and binary files.
    pub added: Option<usize>,
    pub removed: Option<usize>,
    /// The file's hunks (`@@ … @@` and their lines), cut at `MAX_DIFF_LINES`; None when git has no text diff.
    pub diff: Option<String>,
}

/// A repo's overview: where it stands against its upstream, what isn't committed, and how many commits it has. Its
/// diffs and commits are read a page at a time (`diffs`, `commits`).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Overview {
    pub branch: String,
    /// `origin/main`; None when the branch tracks nothing.
    pub upstream: Option<String>,
    /// Commits behind the upstream as of the last fetch (the app never fetches); None without an upstream.
    pub behind: Option<usize>,
    /// Commits not on the upstream (or, without one, on no remote at all).
    pub unpushed: usize,
    pub changes: Vec<Change>,
    /// Commits on this branch, 0 before the first one.
    pub commits: usize,
}

// What `git status --porcelain=v2 --branch` says in one run: the branch, its upstream and how far apart they are, and
// the uncommitted files. One git run instead of five is what keeps the list's badges quick on Windows.
#[derive(Debug, Default, PartialEq)]
struct Porcelain {
    /// The branch, or the short commit of a detached HEAD.
    branch: String,
    /// None without an upstream, or when it's gone from the remote.
    upstream: Option<String>,
    /// Commits here and not on the upstream, and the other way round; None without one.
    ahead: Option<usize>,
    behind: Option<usize>,
    changes: Vec<Change>,
}

// ── Private helpers ───────────────────────
// git in `dir`, ready to run. It never prompts: there's no console to answer in.
fn command(dir: &Path, args: &[&str]) -> Command {
    let mut command = Command::new("git");
    // No prompts (there's no console to answer in), and no optional locks, so a status read never holds the index
    // while the user's own tools work in the repo.
    command.args(args).current_dir(dir).env("GIT_TERMINAL_PROMPT", "0").env("GIT_OPTIONAL_LOCKS", "0");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    command
}

const NO_GIT: &str = "git isn't installed, or isn't on the PATH.";

// Runs git in `dir`: its output, or what it printed on failure.
fn run(dir: &Path, args: &[&str]) -> Result<String, String> {
    let output = command(dir, args).output().map_err(|_| NO_GIT.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

// The output as it is, or None when git is missing or the command fails.
fn git_raw(dir: &Path, args: &[&str]) -> Option<String> {
    run(dir, args).ok()
}

// The same, trimmed.
fn git(dir: &Path, args: &[&str]) -> Option<String> {
    git_raw(dir, args).map(|out| out.trim().to_string())
}

// Stops `child` and everything it started. On Windows `git` is a launcher for the real one, which would otherwise keep
// running with its helpers; on Unix the child leads its own process group (`run_within`).
fn stop_tree(child: &mut Child) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = Command::new("taskkill")
            .args(["/T", "/F", "/PID", &child.id().to_string()])
            .creation_flags(CREATE_NO_WINDOW)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
    }
    #[cfg(unix)]
    {
        let _ = Command::new("kill").args(["-KILL", "--", &format!("-{}", child.id())]).status();
    }
    let _ = child.kill();
    let _ = child.wait();
}

// Runs git in `dir` for at most `limit`, its output thrown away: Ok when it succeeds, its reason when it fails, and
// Err(None) when it's still running at the limit (it's stopped then, so use it only for commands safe to stop).
fn run_within(dir: &Path, args: &[&str], limit: Duration) -> Result<(), Option<String>> {
    let mut command = command(dir, args);
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        command.process_group(0);
    }
    let mut child = command
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|_| Some(NO_GIT.to_string()))?;
    let started = Instant::now();
    loop {
        if let Some(status) = child.try_wait().map_err(|e| Some(e.to_string()))? {
            if status.success() {
                return Ok(());
            }
            let mut reason = String::new();
            if let Some(mut stderr) = child.stderr.take() {
                let _ = stderr.read_to_string(&mut reason);
            }
            return Err(Some(reason.trim().to_string()));
        }
        if started.elapsed() >= limit {
            stop_tree(&mut child);
            return Err(None);
        }
        thread::sleep(Duration::from_millis(50));
    }
}

// `git status --porcelain=v2 --branch` read: headers start with "# ", then one line per file. The path is the last
// field: after 8 others for a changed file, 9 for a renamed one (then a tab and the old path), 10 for a conflict.
fn parse_porcelain(text: &str) -> Porcelain {
    let mut out = Porcelain::default();
    let mut commit = String::new();
    for line in text.lines() {
        if let Some(header) = line.strip_prefix("# ") {
            let (key, value) = header.split_once(' ').unwrap_or((header, ""));
            match key {
                "branch.oid" => commit = value.to_string(),
                "branch.head" => out.branch = value.to_string(),
                "branch.upstream" => out.upstream = Some(value.to_string()),
                "branch.ab" => {
                    let mut counts = value.split(' ').map(|n| n.trim_start_matches(['+', '-']).parse().ok());
                    out.ahead = counts.next().flatten();
                    out.behind = counts.next().flatten();
                }
                _ => {}
            }
            continue;
        }
        let (code, path) = match line.split_once(' ') {
            Some(("1", rest)) => (rest.get(..2), rest.splitn(8, ' ').nth(7)),
            Some(("2", rest)) => (rest.get(..2), rest.splitn(9, ' ').nth(8).and_then(|p| p.split('\t').next())),
            Some(("u", rest)) => (rest.get(..2), rest.splitn(10, ' ').nth(9)),
            Some(("?", rest)) => (Some("??"), Some(rest)),
            _ => continue,
        };
        if let (Some(code), Some(path)) = (code, path) {
            // v2 marks an unchanged side with "."; the window reads v1's space.
            out.changes.push(Change { code: code.replace('.', " "), path: path.trim_matches('"').to_string() });
        }
    }
    // An upstream that's gone from the remote has no counts: treat it as none, as `@{u}` does.
    if out.ahead.is_none() {
        out.upstream = None;
    }
    if out.branch == "(detached)" {
        out.branch = commit.chars().take(7).collect();
    }
    out
}

// The repo's branch, upstream and uncommitted files in one git run, paths unquoted so they match what `diffs` names.
fn porcelain(repo: &Path) -> Option<Porcelain> {
    git_raw(repo, &["-c", "core.quotepath=false", "status", "--porcelain=v2", "--branch"]).map(|text| parse_porcelain(&text))
}

// The commits not pushed: those not on the upstream, or without one, on no remote at all.
fn unpushed_commits(repo: &Path) -> HashSet<String> {
    git(repo, &["rev-list", "@{u}..HEAD"])
        .or_else(|| git(repo, &["rev-list", "HEAD", "--not", "--remotes"]))
        .unwrap_or_default()
        .lines()
        .map(str::to_string)
        .collect()
}

// git's reason, one line, without its "fatal: " prefixes.
fn reason_of(reason: &str) -> String {
    let lines: Vec<&str> = reason.lines().map(|line| line.trim_start_matches("fatal: ").trim()).collect();
    if lines.is_empty() { "git couldn't pull this repo.".to_string() } else { lines.join(" ") }
}

// Whether the repo's remote answers within `limit`. `ls-remote` only reads, so stopping it early is safe.
fn reach(repo: &Path, limit: Duration) -> Result<(), String> {
    run_within(repo, &["ls-remote", "--quiet", "--heads"], limit).map_err(|reason| match reason {
        Some(reason) => reason_of(&reason),
        None => format!(
            "Couldn't reach the remote in {} seconds. Check the connection, then try again.",
            limit.as_secs()
        ),
    })
}

// `git diff --numstat` as path → (added, removed); "-" (a binary file) reads as None.
fn numstat(out: &str) -> HashMap<String, (Option<usize>, Option<usize>)> {
    out.lines()
        .filter_map(|line| {
            let [added, removed, path] = line.splitn(3, '\t').collect::<Vec<_>>()[..] else {
                return None;
            };
            Some((path.to_string(), (added.parse().ok(), removed.parse().ok())))
        })
        .collect()
}

// `git diff` output as path → that file's hunks, its header lines dropped and long ones cut.
fn split_patch(patch: &str) -> HashMap<String, String> {
    let mut files = HashMap::new();
    for part in patch.split("\ndiff --git ") {
        let lines: Vec<&str> = part.lines().collect();
        // git ends a path holding spaces with a tab on these lines.
        let named = |prefix: &str| lines.iter().find_map(|l| l.strip_prefix(prefix)).map(|p| p.trim_end_matches('\t'));
        let Some(path) = named("+++ b/").or_else(|| named("--- a/")) else { continue };
        let Some(start) = lines.iter().position(|l| l.starts_with("@@")) else { continue };
        let hunks = &lines[start..];
        let mut text = hunks.iter().take(MAX_DIFF_LINES).copied().collect::<Vec<_>>().join("\n");
        if hunks.len() > MAX_DIFF_LINES {
            text.push_str(&format!("\n… {} more lines", hunks.len() - MAX_DIFF_LINES));
        }
        files.insert(path.to_string(), text);
    }
    files
}

// ── Public API ────────────────────────────
/// The repo of a project folder: the folder itself, or `game/` in a game home. None for plain folders and suites.
pub fn repo_dir(project: &Path) -> Option<PathBuf> {
    [project.to_path_buf(), project.join("game")].into_iter().find(|dir| dir.join(".git").exists())
}

/// The owner and repo name of a remote URL: https://github.com/owner/repo, git@github.com:owner/repo.git,
/// ssh://host/owner/repo. The name is None when the URL stops at the owner.
pub fn remote_of(url: &str) -> Option<(String, Option<String>)> {
    let rest = url.split_once("://").map_or(url, |(_, rest)| rest);
    let path = match rest.split_once(':') {
        // scp-like `git@host:owner/repo` (a `host:port/` URL has digits before the slash instead).
        Some((_, after)) if !after.split('/').next().unwrap_or("").chars().all(|c| c.is_ascii_digit()) => after,
        _ => rest.split_once('/')?.1,
    };
    let mut parts = path.trim_start_matches('/').split('/');
    let owner = parts.next()?;
    let name = parts.next().map(|name| name.trim_end_matches(".git")).filter(|name| !name.is_empty());
    (!owner.is_empty() && path.contains('/')).then(|| (owner.to_string(), name.map(str::to_string)))
}

/// The web page of a remote URL: git@github.com:owner/repo.git and ssh://git@host/owner/repo become
/// https://host/owner/repo; an http(s) URL keeps its scheme and port. None for local paths and other schemes.
pub fn web_url_of(url: &str) -> Option<String> {
    let url = url.trim().trim_end_matches('/').trim_end_matches(".git");
    let (scheme, host, path) = match url.split_once("://") {
        Some((scheme @ ("http" | "https"), rest)) => {
            let (host, path) = rest.split_once('/')?;
            (scheme, host.rsplit('@').next()?, path)
        }
        // An ssh port isn't the web server's.
        Some(("ssh" | "git", rest)) => {
            let (host, path) = rest.split_once('/')?;
            ("https", host.rsplit('@').next()?.split(':').next()?, path)
        }
        Some(_) => return None,
        // scp-like `git@host:owner/repo`; a one-letter "host" is a Windows drive.
        None => {
            let (host, path) = url.split_once(':')?;
            if host.contains(['/', '\\']) || host.rsplit('@').next()?.len() < 2 {
                return None;
            }
            ("https", host.rsplit('@').next()?, path)
        }
    };
    let path = path.trim_start_matches('/');
    (!host.is_empty() && path.contains('/')).then(|| format!("{scheme}://{host}/{path}"))
}

/// The web page of the repo's `origin`, or None without one.
pub fn web_url(repo: &Path) -> Option<String> {
    git(repo, &["remote", "get-url", "origin"]).and_then(|url| web_url_of(&url))
}

/// Fast-forwards the repo to its upstream branch with `git pull --ff-only` and returns how many commits came in. Never
/// merges: git refuses when local changes would be overwritten or the branches have split, and its reason comes back.
/// It first checks the remote answers within `REACH_TIMEOUT`, so an unreachable one fails fast instead of hanging.
pub fn pull(repo: &Path) -> Result<usize, String> {
    pull_within(repo, REACH_TIMEOUT)
}

// `pull`, with the time the remote gets to answer.
fn pull_within(repo: &Path, limit: Duration) -> Result<usize, String> {
    git(repo, &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
        .ok_or("This branch doesn't track a remote branch, so there's nothing to pull from.")?;
    reach(repo, limit)?;
    let before = git(repo, &["rev-parse", "HEAD"]);
    run(repo, &["pull", "--ff-only", "--quiet"]).map_err(|reason| reason_of(&reason))?;
    let after = git(repo, &["rev-parse", "HEAD"]);
    Ok(match (before, after) {
        (Some(before), Some(after)) if before != after => {
            git(repo, &["rev-list", "--count", &format!("{before}..{after}")]).and_then(|n| n.parse().ok()).unwrap_or(1)
        }
        _ => 0,
    })
}

/// The status of one repo, or None when git can't read it.
pub fn status(repo: &Path) -> Option<Status> {
    let state = porcelain(repo)?;
    let (owner, name) = git(repo, &["remote", "get-url", "origin"]).and_then(|url| remote_of(&url)).unzip();
    Some(Status {
        branch: state.branch,
        uncommitted: state.changes.len(),
        unpushed: state.ahead,
        behind: state.behind,
        owner,
        repo: name.flatten(),
    })
}

/// A repo's overview, without diffs or commits, or None when git can't read it. Reads only: no fetch.
pub fn overview(repo: &Path) -> Option<Overview> {
    let state = porcelain(repo)?;
    let unpushed = match state.ahead {
        Some(ahead) => ahead,
        None => git(repo, &["rev-list", "--count", "HEAD", "--not", "--remotes"]).and_then(|n| n.parse().ok()).unwrap_or(0),
    };
    let commits = git(repo, &["rev-list", "--count", "HEAD"]).and_then(|n| n.parse().ok()).unwrap_or(0);
    Some(Overview {
        branch: state.branch,
        upstream: state.upstream,
        behind: state.behind,
        unpushed,
        changes: state.changes,
        commits,
    })
}

/// The diffs of these uncommitted files (paths as `overview` gives them), one per path, in the same order.
pub fn diffs(repo: &Path, paths: &[String]) -> Vec<FileDiff> {
    let mut args = vec![
        "--literal-pathspecs",
        "-c",
        "core.quotepath=false",
        "diff",
        "HEAD",
        "--no-renames",
        "--no-color",
        "--no-ext-diff",
        "--",
    ];
    args.extend(paths.iter().map(String::as_str));
    let counts = if paths.is_empty() { HashMap::new() } else {
        let mut numstat_args = args.clone();
        numstat_args.insert(8, "--numstat");
        numstat(&git_raw(repo, &numstat_args).unwrap_or_default())
    };
    let mut patches = if paths.is_empty() { HashMap::new() } else { split_patch(&git_raw(repo, &args).unwrap_or_default()) };
    paths
        .iter()
        .map(|path| {
            let (added, removed) = counts.get(path).copied().unwrap_or_default();
            FileDiff { path: path.clone(), added, removed, diff: patches.remove(path) }
        })
        .collect()
}

/// Up to `limit` commits of the branch, newest first, after skipping the newest `skip`.
pub fn commits(repo: &Path, skip: usize, limit: usize) -> Vec<Commit> {
    let unpushed = unpushed_commits(repo);
    // One commit per line, fields split by the unit separator (subjects can't hold it).
    let format = "--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s";
    let log = git(repo, &["log", &format!("--skip={skip}"), &format!("-n{limit}"), format]).unwrap_or_default();
    log
        .lines()
        .filter_map(|line| {
            let [hash, short, author, date, subject] = line.splitn(5, '\u{1f}').collect::<Vec<_>>()[..] else {
                return None;
            };
            Some(Commit {
                unpushed: unpushed.contains(hash),
                hash: hash.to_string(),
                short: short.to_string(),
                subject: subject.to_string(),
                author: author.to_string(),
                date: date.to_string(),
            })
        })
        .collect()
}

/// The status of every repo among `projects` (project path → folder), read a few at a time. Plain folders are left out.
pub fn statuses(projects: Vec<(String, PathBuf)>) -> HashMap<String, Status> {
    let repos: Vec<(String, PathBuf)> =
        projects.into_iter().filter_map(|(path, dir)| repo_dir(&dir).map(|repo| (path, repo))).collect();
    // Each worker takes the next repo when it's free, so one slow repo doesn't hold up a fixed share of the rest.
    let next = AtomicUsize::new(0);
    thread::scope(|scope| {
        let workers: Vec<_> = (0..PARALLEL.min(repos.len()))
            .map(|_| {
                scope.spawn(|| {
                    let mut found = Vec::new();
                    while let Some((path, repo)) = repos.get(next.fetch_add(1, Ordering::Relaxed)) {
                        found.extend(status(repo).map(|status| (path.clone(), status)));
                    }
                    found
                })
            })
            .collect();
        workers.into_iter().flat_map(|worker| worker.join().unwrap_or_default()).collect()
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    #[test]
    fn reads_the_owner_and_name_from_any_remote_form() {
        let remote = |owner: &str, name: &str| Some((owner.to_string(), Some(name.to_string())));
        assert_eq!(remote_of("https://github.com/nyaridev/prepkit.git"), remote("nyaridev", "prepkit"));
        assert_eq!(remote_of("git@github.com:nari-games/fish-dive.git"), remote("nari-games", "fish-dive"));
        assert_eq!(remote_of("ssh://git@github.com/ume-roblox/ume"), remote("ume-roblox", "ume"));
        assert_eq!(remote_of("https://git.example.com:8443/team/repo"), remote("team", "repo"));
        assert_eq!(remote_of("https://github.com/acme/"), Some(("acme".to_string(), None)));
        assert_eq!(remote_of("https://github.com/"), None);
        assert_eq!(remote_of("not a url"), None);
    }

    #[test]
    fn turns_any_remote_into_its_web_page() {
        let page = |url: &str| web_url_of(url);
        assert_eq!(page("https://github.com/nyaridev/prepkit.git").as_deref(), Some("https://github.com/nyaridev/prepkit"));
        assert_eq!(page("git@github.com:nari-games/fish-dive.git").as_deref(), Some("https://github.com/nari-games/fish-dive"));
        assert_eq!(page("ssh://git@github.com:22/ume-roblox/ume").as_deref(), Some("https://github.com/ume-roblox/ume"));
        assert_eq!(page("https://user@git.example.com:8443/team/repo/").as_deref(), Some("https://git.example.com:8443/team/repo"));
        assert_eq!(page("C:/repos/tool"), None, "a local path");
        assert_eq!(page("../tool.git"), None);
        assert_eq!(page("file:///srv/tool.git"), None);
    }

    #[test]
    fn finds_the_repo_of_a_game_home() {
        let temp = Temp::new();
        temp.dir("game-home/game/.git");
        temp.dir("tool/.git");
        temp.dir("plain");
        assert_eq!(repo_dir(&temp.0.join("game-home")), Some(temp.0.join("game-home/game")));
        assert_eq!(repo_dir(&temp.0.join("tool")), Some(temp.0.join("tool")));
        assert_eq!(repo_dir(&temp.0.join("plain")), None);
    }

    #[test]
    fn reads_a_real_repo() {
        let temp = Temp::new();
        if git(&temp.0, &["--version"]).is_none() {
            return; // git isn't installed here
        }
        let repo = temp.dir("tool");
        git(&repo, &["init", "-q", "-b", "main"]).unwrap();
        temp.file("tool/a.txt", "a");
        git(&repo, &["remote", "add", "origin", "https://github.com/acme/tool.git"]).unwrap();
        temp.dir("plain");

        let found = statuses(vec![("tool/".into(), repo.clone()), ("plain/".into(), temp.0.join("plain"))]);
        let expected = Status {
            branch: "main".into(),
            uncommitted: 1,
            unpushed: None,
            behind: None,
            owner: Some("acme".into()),
            repo: Some("tool".into()),
        };
        assert_eq!(found.get("tool/"), Some(&expected));
        assert_eq!(found.len(), 1, "plain folders have no status");
    }

    #[test]
    fn reads_porcelain_v2_in_one_go() {
        let change = |code: &str, path: &str| Change { code: code.into(), path: path.into() };
        let text = "# branch.oid 0123456789abcdef\n# branch.head main\n# branch.upstream origin/main\n# branch.ab +2 -3\n\
                    1 .M N... 100644 100644 100644 aaa bbb src/a file.rs\n\
                    2 R. N... 100644 100644 100644 aaa bbb R100 new name.rs\told name.rs\n\
                    u UU N... 100644 100644 100644 100644 aaa bbb ccc both.rs\n\
                    ? notes/\n";
        assert_eq!(
            parse_porcelain(text),
            Porcelain {
                branch: "main".into(),
                upstream: Some("origin/main".into()),
                ahead: Some(2),
                behind: Some(3),
                changes: vec![
                    change(" M", "src/a file.rs"),
                    change("R ", "new name.rs"),
                    change("UU", "both.rs"),
                    change("??", "notes/"),
                ],
            }
        );
        let detached = parse_porcelain("# branch.oid 0123456789abcdef\n# branch.head (detached)\n");
        assert_eq!((detached.branch.as_str(), detached.upstream), ("0123456", None));
        let gone = parse_porcelain("# branch.oid 01234567\n# branch.head main\n# branch.upstream origin/old\n");
        assert_eq!((gone.upstream, gone.ahead), (None, None), "an upstream gone from the remote counts as none");
    }

    #[test]
    fn splits_a_patch_by_file_and_cuts_long_ones() {
        let long: String = (0..MAX_DIFF_LINES + 5).map(|i| format!("+line {i}\n")).collect();
        let patch = format!(
            "diff --git a/a b c.txt b/a b c.txt\nindex 1..2 100644\n--- a/a b c.txt\t\n+++ b/a b c.txt\t\n@@ -1 +1 @@\n-old\n+new\n\
             diff --git a/gone.txt b/gone.txt\ndeleted file mode 100644\n--- a/gone.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-bye\n\
             diff --git a/big.txt b/big.txt\n--- /dev/null\n+++ b/big.txt\n@@ -0,0 +1,405 @@\n{long}\
             diff --git a/pic.png b/pic.png\nBinary files a/pic.png and b/pic.png differ\n"
        );
        let files = split_patch(&patch);
        assert_eq!(files["a b c.txt"], "@@ -1 +1 @@\n-old\n+new");
        assert_eq!(files["gone.txt"], "@@ -1 +0,0 @@\n-bye");
        assert!(files["big.txt"].ends_with("… 6 more lines"), "the @@ line and 405 lines, cut at the limit");
        assert!(!files.contains_key("pic.png"), "a binary file has no text diff");
        assert_eq!(numstat("2\t1\ta b.txt\n-\t-\tpic.png")["pic.png"], (None, None));
    }

    #[test]
    fn reads_history_and_marks_unpushed_commits() {
        let temp = Temp::new();
        if git(&temp.0, &["--version"]).is_none() {
            return; // git isn't installed here
        }
        let remote = temp.dir("remote.git");
        git(&remote, &["init", "-q", "--bare", "-b", "main"]).unwrap();
        let repo = temp.dir("tool");
        git(&repo, &["init", "-q", "-b", "main"]).unwrap();
        let commit = |file: &str, message: &str| {
            temp.file(&format!("tool/{file}"), message);
            git(&repo, &["add", file]).unwrap();
            git(&repo, &["-c", "user.name=Tester", "-c", "user.email=t@example.com", "commit", "-qm", message]).unwrap();
        };

        commit("a.txt", "First");
        assert!(commits(&repo, 0, 50)[0].unpushed, "no remote: nothing is pushed");

        git(&repo, &["remote", "add", "origin", &remote.to_string_lossy()]).unwrap();
        git(&repo, &["push", "-q", "-u", "origin", "main"]).unwrap();
        commit("b.txt", "Second | with a pipe");
        temp.file("tool/a.txt", "Changed\nAnd added");
        temp.file("tool/new.txt", "x");

        let overview = overview(&repo).unwrap();
        assert_eq!(overview.branch, "main");
        assert_eq!(overview.upstream.as_deref(), Some("origin/main"));
        assert_eq!(overview.behind, Some(0));
        assert_eq!((overview.commits, overview.unpushed), (2, 1));
        let change = |code: &str, path: &str| Change { code: code.into(), path: path.into() };
        assert_eq!(overview.changes, [change(" M", "a.txt"), change("??", "new.txt")]);

        // Only the files asked for, in that order; an untracked one has no diff.
        let [new, changed] = &diffs(&repo, &["new.txt".into(), "a.txt".into()])[..] else { panic!() };
        assert_eq!(*new, FileDiff { path: "new.txt".into(), added: None, removed: None, diff: None });
        assert_eq!((changed.path.as_str(), changed.added, changed.removed), ("a.txt", Some(2), Some(1)));
        let diff = changed.diff.as_deref().unwrap();
        assert!(diff.starts_with("@@") && diff.contains("-First") && diff.contains("+And added"), "{diff}");
        assert!(diffs(&repo, &[]).is_empty());

        let page = |skip, limit| -> Vec<(String, bool)> {
            commits(&repo, skip, limit).into_iter().map(|c| (c.subject, c.unpushed)).collect()
        };
        assert_eq!(page(0, 1), [("Second | with a pipe".to_string(), true)]);
        assert_eq!(page(1, 5), [("First".to_string(), false)], "the next page after the first");
        assert_eq!(commits(&repo, 0, 5)[0].author, "Tester");
    }

    #[test]
    fn pulls_by_fast_forward_only() {
        let temp = Temp::new();
        if git(&temp.0, &["--version"]).is_none() {
            return; // git isn't installed here
        }
        let remote = temp.dir("remote.git");
        git(&remote, &["init", "-q", "--bare", "-b", "main"]).unwrap();
        let commit = |dir: &str, file: &str| {
            temp.file(&format!("{dir}/{file}"), file);
            let repo = temp.0.join(dir);
            git(&repo, &["add", file]).unwrap();
            git(&repo, &["-c", "user.name=Tester", "-c", "user.email=t@example.com", "commit", "-qm", file]).unwrap();
        };

        let here = temp.dir("here");
        git(&here, &["init", "-q", "-b", "main"]).unwrap();
        assert!(pull(&here).is_err(), "no upstream: nothing to pull from");
        commit("here", "a.txt");
        git(&here, &["remote", "add", "origin", &remote.to_string_lossy()]).unwrap();
        git(&here, &["push", "-q", "-u", "origin", "main"]).unwrap();

        git(&temp.0, &["clone", "-q", &remote.to_string_lossy(), "there"]).unwrap();
        let there = temp.0.join("there");
        commit("there", "b.txt");
        commit("there", "c.txt");
        git(&there, &["push", "-q"]).unwrap();
        assert_eq!(pull(&here), Ok(2));
        assert_eq!(pull(&here), Ok(0), "already up to date");

        commit("there", "d.txt");
        git(&there, &["push", "-q"]).unwrap();
        commit("here", "e.txt");
        assert!(pull(&here).is_err(), "split branches are never merged");
        assert!(commits(&here, 0, 10).iter().all(|c| c.subject != "d.txt"));
    }

    #[test]
    fn a_remote_that_never_answers_fails_fast() {
        let temp = Temp::new();
        if git(&temp.0, &["--version"]).is_none() {
            return; // git isn't installed here
        }
        let here = temp.dir("here");
        git(&here, &["init", "-q", "-b", "main"]).unwrap();
        temp.file("here/a.txt", "a");
        git(&here, &["add", "a.txt"]).unwrap();
        git(&here, &["-c", "user.name=Tester", "-c", "user.email=t@example.com", "commit", "-qm", "a"]).unwrap();
        // A remote whose "server" waits on input forever, like a host that never answers.
        git(&here, &["config", "protocol.ext.allow", "always"]).unwrap();
        git(&here, &["remote", "add", "origin", "ext::git cat-file --batch"]).unwrap();
        git(&here, &["config", "branch.main.remote", "origin"]).unwrap();
        git(&here, &["config", "branch.main.merge", "refs/heads/main"]).unwrap();
        // As a clone has it from its last fetch.
        git(&here, &["update-ref", "refs/remotes/origin/main", "HEAD"]).unwrap();

        let started = Instant::now();
        let reason = pull_within(&here, Duration::from_secs(1)).unwrap_err();
        assert!(reason.starts_with("Couldn't reach the remote in 1 seconds"), "{reason}");
        assert!(started.elapsed() < Duration::from_secs(10), "stopped at the limit; this remote never answers on its own");
    }
}
