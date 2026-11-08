//! Git: a repo's branch, uncommitted changes, unpushed commits and remote owner, read with the `git` command.
//! Nothing is reported when git isn't installed or a folder isn't a repo; the list works without it.

// ── Imports ───────────────────────────────
use serde::Serialize;
use std::collections::HashMap;
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

// ── Private helpers ───────────────────────
// Runs git in `dir` and returns its trimmed output, or None when git is missing or the command fails.
fn git(dir: &Path, args: &[&str]) -> Option<String> {
    let mut command = Command::new("git");
    command.args(args).current_dir(dir);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let output = command.output().ok()?;
    output.status.success().then(|| String::from_utf8_lossy(&output.stdout).trim().to_string())
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
}
