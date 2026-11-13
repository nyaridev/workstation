//! Git: a repo's branch, uncommitted changes, unpushed commits and remote, read with the `git` command, and a
//! fast-forward pull the user asks for (ADR-0018). Nothing is reported when git isn't installed or a folder isn't a
//! repo; the list works without it.

// ── Imports ───────────────────────────────
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;

// ── Constants ─────────────────────────────
/// How many repos are read at the same time.
const PARALLEL: usize = 8;
/// Windows `CREATE_NO_WINDOW`: no console flashes for each git call.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;
/// A file's diff past this many lines is cut, so a generated file can't flood the panel.
const MAX_DIFF_LINES: usize = 400;

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
    /// Lines added and removed since the last commit; None for untracked and binary files.
    pub added: Option<usize>,
    pub removed: Option<usize>,
    /// The file's hunks (`@@ … @@` and their lines), cut at `MAX_DIFF_LINES`; None when git has no text diff.
    pub diff: Option<String>,
}

/// A repo's overview: where it stands against its upstream, what isn't committed, and its latest commits.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct History {
    pub branch: String,
    /// `origin/main`; None when the branch tracks nothing.
    pub upstream: Option<String>,
    /// Commits behind the upstream as of the last fetch (the app never fetches); None without an upstream.
    pub behind: Option<usize>,
    pub changes: Vec<Change>,
    /// Newest first, at most the limit asked for.
    pub commits: Vec<Commit>,
}

// ── Private helpers ───────────────────────
// Runs git in `dir`: its output, or what it printed on failure. It never prompts: there's no console to answer in.
fn run(dir: &Path, args: &[&str]) -> Result<String, String> {
    let mut command = Command::new("git");
    command.args(args).current_dir(dir).env("GIT_TERMINAL_PROMPT", "0");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command.output().map_err(|_| "git isn't installed, or isn't on the PATH.".to_string())?;
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
pub fn pull(repo: &Path) -> Result<usize, String> {
    let before = git(repo, &["rev-parse", "HEAD"]);
    run(repo, &["pull", "--ff-only", "--quiet"]).map_err(|reason| {
        let reason: Vec<&str> = reason.lines().map(|line| line.trim_start_matches("fatal: ").trim()).collect();
        if reason.is_empty() { "git couldn't pull this repo.".to_string() } else { reason.join(" ") }
    })?;
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
    // `symbolic-ref` works before the first commit; a detached HEAD falls back to its short hash.
    let branch = git(repo, &["symbolic-ref", "--short", "HEAD"]).or_else(|| git(repo, &["rev-parse", "--short", "HEAD"]))?;
    let uncommitted = git(repo, &["status", "--porcelain"])?.lines().count();
    let unpushed = git(repo, &["rev-list", "--count", "@{u}..HEAD"]).and_then(|n| n.parse().ok());
    let (owner, name) = git(repo, &["remote", "get-url", "origin"]).and_then(|url| remote_of(&url)).unzip();
    Some(Status { branch, uncommitted, unpushed, owner, repo: name.flatten() })
}

/// The overview of one repo with its latest `limit` commits, or None when git can't read it. Reads only: no fetch.
pub fn history(repo: &Path, limit: usize) -> Option<History> {
    let branch = git(repo, &["symbolic-ref", "--short", "HEAD"]).or_else(|| git(repo, &["rev-parse", "--short", "HEAD"]))?;
    let upstream = git(repo, &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
    let unpushed_args: &[&str] =
        if upstream.is_some() { &["rev-list", "@{u}..HEAD"] } else { &["rev-list", "HEAD", "--not", "--remotes"] };
    let unpushed: HashSet<String> = git(repo, unpushed_args).unwrap_or_default().lines().map(str::to_string).collect();
    let behind = upstream.as_ref().and_then(|_| git(repo, &["rev-list", "--count", "HEAD..@{u}"])?.parse().ok());

    // Paths unquoted everywhere, so the status and the diff name a file the same way.
    let status = git_raw(repo, &["-c", "core.quotepath=false", "status", "--porcelain"]).unwrap_or_default();
    let diff_args = ["-c", "core.quotepath=false", "diff", "HEAD", "--no-renames", "--no-color", "--no-ext-diff"];
    let counts = numstat(&git_raw(repo, &[&diff_args[..], &["--numstat"]].concat()).unwrap_or_default());
    let mut patches = split_patch(&git_raw(repo, &diff_args).unwrap_or_default());
    let changes = status
        .lines()
        .filter(|line| line.len() > 3)
        .map(|line| {
            let path = line[3..].trim_matches('"').to_string();
            let (added, removed) = counts.get(&path).copied().unwrap_or_default();
            Change { code: line[..2].to_string(), added, removed, diff: patches.remove(&path), path }
        })
        .collect();

    // One commit per line, fields split by the unit separator (subjects can't hold it).
    let log = git(repo, &["log", &format!("-n{limit}"), "--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s"]).unwrap_or_default();
    let commits = log
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
        .collect();
    Some(History { branch, upstream, behind, changes, commits })
}

/// The status of every repo among `projects` (project path → folder), read a few at a time. Plain folders are left out.
pub fn statuses(projects: Vec<(String, PathBuf)>) -> HashMap<String, Status> {
    let repos: Vec<(String, PathBuf)> =
        projects.into_iter().filter_map(|(path, dir)| repo_dir(&dir).map(|repo| (path, repo))).collect();
    let chunk = repos.len().div_ceil(PARALLEL).max(1);
    thread::scope(|scope| {
        let workers: Vec<_> = repos
            .chunks(chunk)
            .map(|part| scope.spawn(move || part.iter().filter_map(|(path, repo)| Some((path.clone(), status(repo)?))).collect::<Vec<_>>()))
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
            owner: Some("acme".into()),
            repo: Some("tool".into()),
        };
        assert_eq!(found.get("tool/"), Some(&expected));
        assert_eq!(found.len(), 1, "plain folders have no status");
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
        assert!(history(&repo, 50).unwrap().commits[0].unpushed, "no remote: nothing is pushed");

        git(&repo, &["remote", "add", "origin", &remote.to_string_lossy()]).unwrap();
        git(&repo, &["push", "-q", "-u", "origin", "main"]).unwrap();
        commit("b.txt", "Second | with a pipe");
        temp.file("tool/a.txt", "Changed\nAnd added");
        temp.file("tool/new.txt", "x");

        let history = history(&repo, 50).unwrap();
        assert_eq!(history.branch, "main");
        assert_eq!(history.upstream.as_deref(), Some("origin/main"));
        assert_eq!(history.behind, Some(0));
        let [changed, new] = &history.changes[..] else { panic!("{:?}", history.changes) };
        assert_eq!((changed.code.as_str(), changed.path.as_str()), (" M", "a.txt"));
        assert_eq!((changed.added, changed.removed), (Some(2), Some(1)));
        let diff = changed.diff.as_deref().unwrap();
        assert!(diff.starts_with("@@") && diff.contains("-First") && diff.contains("+And added"), "{diff}");
        assert_eq!(*new, Change { code: "??".into(), path: "new.txt".into(), added: None, removed: None, diff: None });
        let commits: Vec<(&str, &str, bool)> =
            history.commits.iter().map(|c| (c.subject.as_str(), c.author.as_str(), c.unpushed)).collect();
        assert_eq!(commits, [("Second | with a pipe", "Tester", true), ("First", "Tester", false)]);
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
        assert!(history(&here, 10).unwrap().commits.iter().all(|c| c.subject != "d.txt"));
    }
}
