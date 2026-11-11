//! Scan: merges the projects found on disk with the entries of the workstation's projects.json.
//! A folder with no entry is unregistered; an entry whose folder doesn't exist is missing.

// ── Imports ───────────────────────────────
mod layout;
mod registry;
mod stack;

pub use layout::affects_projects;
pub use registry::{Entry, add as register, set_tags};
use registry::same_path;
use serde::Serialize;
use std::path::{Component, Path, PathBuf};

// ── Constants ─────────────────────────────
/// A folder with one of these has its own docs or agent rules, so it's worth showing inside its project.
const IMPORTANT: [&str; 3] = ["README.md", "AGENTS.md", "CLAUDE.md"];

// ── Types ─────────────────────────────────
/// A folder inside a project worth showing on its own: a repo, or one with its own README, AGENTS.md or CLAUDE.md.
#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    /// From the workstation root, forward slashes, trailing slash.
    pub path: String,
    pub name: String,
    pub repo: bool,
}

/// A project as the UI sees it.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    /// From the workstation root, forward slashes, trailing slash.
    pub path: String,
    pub name: String,
    pub kind: String,
    pub archived: bool,
    pub stack: Vec<String>,
    pub owner: Option<String>,
    /// Empty for unregistered projects.
    pub status: String,
    pub description: String,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    /// False when `projects.json` lists it but the folder doesn't exist.
    pub on_disk: bool,
    /// False when the folder exists but `projects.json` has no entry for it.
    pub registered: bool,
    /// True when the project's folder is a git repo itself; a game home isn't (its repo is `game/`), nor is a suite.
    pub repo: bool,
    /// Important folders inside a project that isn't a repo itself (a game home's `game/` and `docs/`); folders that
    /// are projects of their own (a suite's repos) aren't repeated here.
    pub folders: Vec<Folder>,
}

/// Every project of a workstation, and why `projects.json` couldn't be read, if it couldn't.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Scan {
    pub projects: Vec<Project>,
    pub registry_error: Option<String>,
}

// ── Private helpers ───────────────────────
fn from_entry(entry: &Entry, on_disk: bool) -> Project {
    Project {
        path: entry.path.clone(),
        name: entry.name.clone(),
        kind: entry.kind.clone(),
        archived: entry.path.starts_with("archive/") || entry.status == "archived",
        stack: entry.stack.clone(),
        owner: entry.owner.clone(),
        status: entry.status.clone(),
        description: entry.description.clone(),
        tags: entry.tags.clone(),
        notes: entry.notes.clone(),
        on_disk,
        registered: true,
        repo: false,
        folders: Vec::new(),
    }
}

fn unregistered(found: &layout::Found) -> Project {
    let name = found.path.trim_end_matches('/').rsplit('/').next().unwrap_or(&found.path).to_string();
    Project {
        path: found.path.clone(),
        name,
        kind: found.kind.to_string(),
        archived: found.archived,
        stack: Vec::new(),
        owner: None,
        status: String::new(),
        description: String::new(),
        tags: Vec::new(),
        notes: None,
        on_disk: true,
        registered: false,
        repo: false,
        folders: Vec::new(),
    }
}

// The important folders one level inside a project that isn't a repo: repos, and folders with their own docs or rules.
// Hidden (`.claude/`) and support (`_sdk/`) folders, and folders that are projects themselves, are left out.
fn folders(root: &Path, project: &str, projects: &[String]) -> Vec<Folder> {
    let dir = root.join(project);
    let Ok(read) = std::fs::read_dir(&dir) else { return Vec::new() };
    if dir.join(".git").exists() {
        return Vec::new();
    }
    let mut folders: Vec<Folder> = read
        .flatten()
        .filter(|e| e.path().is_dir())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            let inner = e.path();
            let repo = inner.join(".git").exists();
            let important = repo || IMPORTANT.iter().any(|file| inner.join(file).is_file());
            let path = format!("{project}{name}/");
            let shown = important && !name.starts_with(['.', '_']) && !projects.iter().any(|p| same_path(p, &path));
            shown.then_some(Folder { path, name, repo })
        })
        .collect();
    folders.sort_by(|a, b| a.name.cmp(&b.name));
    folders
}

// ── Public API ────────────────────────────
/// Every project of the workstation at `root`, sorted by path. Never fails: a broken `projects.json` still lists the
/// folders on disk, with the error in `registry_error`.
pub fn scan(root: &Path) -> Scan {
    let found = layout::find_projects(root);
    let (entries, registry_error) = match registry::read(root) {
        Ok(entries) => (entries, None),
        Err(error) => (Vec::new(), Some(error)),
    };

    let mut projects: Vec<Project> = found
        .iter()
        .map(|f| entries.iter().find(|e| same_path(&e.path, &f.path)).map_or_else(|| unregistered(f), |e| from_entry(e, true)))
        .collect();
    // Entries the place rules don't cover (or whose folder is gone): on disk only if the folder exists.
    for entry in entries.iter().filter(|e| !found.iter().any(|f| same_path(&e.path, &f.path))) {
        projects.push(from_entry(entry, root.join(&entry.path).is_dir()));
    }
    projects.sort_by(|a, b| a.path.cmp(&b.path));
    let paths: Vec<String> = projects.iter().map(|p| p.path.clone()).collect();
    for project in projects.iter_mut().filter(|p| p.on_disk) {
        project.repo = root.join(&project.path).join(".git").exists();
        project.folders = folders(root, &project.path, &paths);
    }
    Scan { projects, registry_error }
}

/// The absolute folder of a project, refusing paths that leave the workstation or aren't folders.
pub fn folder(root: &Path, path: &str) -> Result<PathBuf, String> {
    let inside = Path::new(path).components().all(|c| matches!(c, Component::Normal(_) | Component::CurDir));
    let full = root.join(path);
    if !inside || !full.is_dir() {
        return Err(format!("{path} isn't a folder in this workstation."));
    }
    Ok(full)
}

/// A guess at a project's stack from the files in its folder, for the Register form.
pub fn guess_stack(root: &Path, path: &str) -> Result<Vec<String>, String> {
    Ok(stack::guess(&folder(root, path)?))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    fn flags(scan: &Scan) -> Vec<(&str, bool, bool)> {
        scan.projects.iter().map(|p| (p.path.as_str(), p.on_disk, p.registered)).collect()
    }

    #[test]
    fn merges_disk_and_registry_with_flags() {
        let temp = Temp::new();
        temp.dir("games/roblox/fish-dive");
        temp.dir("tools/rename");
        temp.dir("sandbox/kept");
        temp.file(
            "projects.json",
            r#"{ "version": 1, "projects": [
                { "name": "Fish Dive", "path": "Games/Roblox/Fish-Dive/", "kind": "game", "tags": ["roblox"] },
                { "name": "Gone", "path": "apps/web/gone/", "kind": "app" },
                { "name": "Kept", "path": "sandbox/kept/", "kind": "tool" }
            ] }"#,
        );
        let scan = scan(&temp.0);
        assert_eq!(scan.registry_error, None);
        assert_eq!(
            flags(&scan),
            vec![
                ("Games/Roblox/Fish-Dive/", true, true),
                ("apps/web/gone/", false, true),
                ("sandbox/kept/", true, true),
                ("tools/rename/", true, false),
            ]
        );
        assert_eq!(scan.projects[0].tags, vec!["roblox"]);
        assert_eq!(scan.projects[3].name, "rename");
    }

    #[test]
    fn homes_and_suites_list_their_important_folders() {
        let temp = Temp::new();
        temp.dir("games/godot/swamp/game/.git");
        temp.file("games/godot/swamp/wiki/AGENTS.md", "");
        temp.file("games/godot/swamp/docs/README.md", "");
        temp.dir("games/godot/swamp/builds");
        temp.file("games/godot/swamp/.claude/CLAUDE.md", "");
        temp.dir("frameworks/kit/kit-core/.git");
        temp.file("frameworks/kit/notes/README.md", "");
        temp.dir("tools/rename/.git");
        temp.file("tools/rename/docs/README.md", "");
        let scan = scan(&temp.0);
        let folders = |path: &str| -> Vec<(String, bool)> {
            let project = scan.projects.iter().find(|p| p.path == path).unwrap();
            project.folders.iter().map(|f| (f.path.clone(), f.repo)).collect()
        };
        assert_eq!(
            folders("games/godot/swamp/"),
            [
                ("games/godot/swamp/docs/".to_string(), false),
                ("games/godot/swamp/game/".to_string(), true),
                ("games/godot/swamp/wiki/".to_string(), false),
            ]
        );
        assert_eq!(folders("frameworks/kit/"), [("frameworks/kit/notes/".to_string(), false)], "repos are projects");
        assert!(folders("tools/rename/").is_empty(), "a repo's own folders aren't listed");
        let repo = |path: &str| scan.projects.iter().find(|p| p.path == path).unwrap().repo;
        assert!(repo("tools/rename/"));
        assert!(!repo("games/godot/swamp/"), "a game home's repo is game/, not the home");
    }

    #[test]
    fn a_broken_registry_still_lists_the_disk() {
        let temp = Temp::new();
        temp.dir("tools/rename");
        temp.file("projects.json", "{ nope");
        let scan = scan(&temp.0);
        assert!(scan.registry_error.is_some());
        assert_eq!(flags(&scan), vec![("tools/rename/", true, false)]);
    }

    #[test]
    fn folder_stays_inside_the_workstation() {
        let temp = Temp::new();
        temp.dir("tools/rename");
        temp.file("tools/readme.md", "");
        assert!(folder(&temp.0, "tools/rename/").is_ok());
        assert!(folder(&temp.0, "tools/readme.md").is_err());
        assert!(folder(&temp.0, "tools/missing/").is_err());
        assert!(folder(&temp.0, "../").is_err());
        assert!(folder(&temp.0, "C:/Windows/").is_err());
    }
}
