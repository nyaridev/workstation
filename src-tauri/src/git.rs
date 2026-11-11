//! Git: a repo's branch, uncommitted changes, unpushed commits and remote owner, read with the `git` command.
//! Nothing is reported when git isn't installed or a folder isn't a repo; the list works without it.

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
// Runs git in `dir` and returns its output as it is, or None when git is missing or the command fails.
fn git_raw(dir: &Path, args: &[&str]) -> Option<String> {
    let mut command = Command::new("git");
    command.args(args).current_dir(dir);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command.output().ok()?;
    output.status.success().then(|| String::from_utf8_lossy(&output.stdout).into_owned())
}

// The same, trimmed.
fn git(dir: &Path, args: &[&str]) -> Option<String> {
    git_raw(dir, args).map(|out| out.trim().to_string())
}

// ── Public API ────────────────────────────
/// The repo of a project folder: the folder itself, or `game/` in a game home. None for plain folders and suites.
pub fn repo_dir(project: &Path) -> Option<PathBuf> {
    [project.to_path_buf(), project.join("game")].into_iter().find(|dir| dir.join(".git").exists())
}

/// The owner part of a remote URL: https://github.com/owner/repo, git@github.com:owner/repo.git, ssh://host/owner/repo.
pub fn owner_of(url: &str) -> Option<String> {
    let rest = url.split_once("://").map_or(url, |(_, rest)| rest);
    let path = match rest.split_once(':') {
        // scp-like `git@host:owner/repo` (a `host:port/` URL has digits before the slash instead).
        Some((_, after)) if !after.split('/').next().unwrap_or("").chars().all(|c| c.is_ascii_digit()) => after,
        _ => rest.split_once('/')?.1,
    };
    let owner = path.trim_start_matches('/').split('/').next()?;
    (!owner.is_empty() && path.contains('/')).then(|| owner.to_string())
}

/// The status of one repo, or None when git can't read it.
pub fn status(repo: &Path) -> Option<Status> {
    // `symbolic-ref` works before the first commit; a detached HEAD falls back to its short hash.
    let branch = git(repo, &["symbolic-ref", "--short", "HEAD"]).or_else(|| git(repo, &["rev-parse", "--short", "HEAD"]))?;
    let uncommitted = git(repo, &["status", "--porcelain"])?.lines().count();
    let unpushed = git(repo, &["rev-list", "--count", "@{u}..HEAD"]).and_then(|n| n.parse().ok());
    let owner = git(repo, &["remote", "get-url", "origin"]).and_then(|url| owner_of(&url));
    Some(Status { branch, uncommitted, unpushed, owner })
}

/// The overview of one repo with its latest `limit` commits, or None when git can't read it. Reads only: no fetch.
pub fn history(repo: &Path, limit: usize) -> Option<History> {
    let branch = git(repo, &["symbolic-ref", "--short", "HEAD"]).or_else(|| git(repo, &["rev-parse", "--short", "HEAD"]))?;
    let upstream = git(repo, &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
    let unpushed_args: &[&str] =
        if upstream.is_some() { &["rev-list", "@{u}..HEAD"] } else { &["rev-list", "HEAD", "--not", "--remotes"] };
    let unpushed: HashSet<String> = git(repo, unpushed_args).unwrap_or_default().lines().map(str::to_string).collect();
    let behind = upstream.as_ref().and_then(|_| git(repo, &["rev-list", "--count", "HEAD..@{u}"])?.parse().ok());

    let status = git_raw(repo, &["status", "--porcelain"]).unwrap_or_default();
    let changes = status
        .lines()
        .filter(|line| line.len() > 3)
        .map(|line| Change { code: line[..2].to_string(), path: line[3..].trim_matches('"').to_string() })
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
    fn reads_the_owner_from_any_remote_form() {
        assert_eq!(owner_of("https://github.com/nyaridev/prepkit.git").as_deref(), Some("nyaridev"));
        assert_eq!(owner_of("git@github.com:nari-games/fish-dive.git").as_deref(), Some("nari-games"));
        assert_eq!(owner_of("ssh://git@github.com/ume-roblox/ume").as_deref(), Some("ume-roblox"));
        assert_eq!(owner_of("https://git.example.com:8443/team/repo").as_deref(), Some("team"));
        assert_eq!(owner_of("https://github.com/"), None);
        assert_eq!(owner_of("not a url"), None);
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
        let expected = Status { branch: "main".into(), uncommitted: 1, unpushed: None, owner: Some("acme".into()) };
        assert_eq!(found.get("tool/"), Some(&expected));
        assert_eq!(found.len(), 1, "plain folders have no status");
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
        temp.file("tool/new.txt", "x");

        let history = history(&repo, 50).unwrap();
        assert_eq!(history.branch, "main");
        assert_eq!(history.upstream.as_deref(), Some("origin/main"));
        assert_eq!(history.behind, Some(0));
        assert_eq!(history.changes, [Change { code: "??".into(), path: "new.txt".into() }]);
        let commits: Vec<(&str, &str, bool)> =
            history.commits.iter().map(|c| (c.subject.as_str(), c.author.as_str(), c.unpushed)).collect();
        assert_eq!(commits, [("Second | with a pipe", "Tester", true), ("First", "Tester", false)]);
    }
}
