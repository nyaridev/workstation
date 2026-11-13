//! Scan: the workstation's projects: every folder with a `.workstation` file, and every folder where the place rules
//! say a project lives. One of those without a file is unregistered.

// ── Imports ───────────────────────────────
mod edited;
mod layout;
mod registry;
mod stack;

pub use edited::last_edited;
pub use layout::affects_projects;
pub use registry::{Entry, FILE_NAME, add as register, set_tags};
use registry::same_path;
use serde::Serialize;
use serde_json::Value;
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

/// One step of a project's plan, from its file's `milestones`.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Milestone {
    pub name: String,
    pub done: bool,
    /// The plan it belongs to when a project has several ("Server", "Rewrite"); None for a project's single plan.
    pub track: Option<String>,
    /// A short line on what it covers; None without one.
    pub description: Option<String>,
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
    /// False when the folder has no `.workstation`.
    pub registered: bool,
    /// True when the project's folder is a git repo itself; a game home isn't (its repo is `game/`), nor is a suite.
    pub repo: bool,
    /// Important folders inside a project that isn't a repo itself (a game home's `game/` and `docs/`); folders that
    /// are projects of their own (a suite's repos) aren't repeated here.
    pub folders: Vec<Folder>,
    /// Its plan in order; the first not done is the one being worked on. Empty when it has none.
    pub milestones: Vec<Milestone>,
}

/// Every project of a workstation, and a line for each `.workstation` that couldn't be read.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Scan {
    pub projects: Vec<Project>,
    pub errors: Vec<String>,
}

// ── Private helpers ───────────────────────
// A file's `milestones`, read leniently: an item without a name is skipped and a missing `done` is false, so one
// badly written milestone never stops the file from loading.
fn milestones_of(entry: &Entry) -> Vec<Milestone> {
    let Some(Value::Array(items)) = entry.extra.get("milestones") else { return Vec::new() };
    items
        .iter()
        .filter_map(|item| {
            let name = item.get("name")?.as_str()?.trim();
            let done = item.get("done").and_then(Value::as_bool).unwrap_or(false);
            let text = |key: &str| {
                item.get(key).and_then(Value::as_str).map(str::trim).filter(|t| !t.is_empty()).map(str::to_string)
            };
            (!name.is_empty()).then(|| Milestone {
                name: name.to_string(),
                done,
                track: text("track"),
                description: text("description"),
            })
        })
        .collect()
}

fn from_entry(entry: &Entry) -> Project {
    Project {
        path: entry.path.clone(),
        name: entry.name.clone(),
        kind: entry.kind.clone(),
        archived: entry.path.starts_with("archive/"),
        stack: entry.stack.clone(),
        owner: entry.owner.clone(),
        status: entry.status.clone(),
        description: entry.description.clone(),
        tags: entry.tags.clone(),
        notes: entry.notes.clone(),
        registered: true,
        repo: false,
        folders: Vec::new(),
        milestones: milestones_of(entry),
    }
}

fn folder_name(path: &str) -> String {
    path.trim_end_matches('/').rsplit('/').next().unwrap_or(path).to_string()
}

fn unregistered(found: &layout::Found) -> Project {
    Project {
        path: found.path.clone(),
        name: folder_name(&found.path),
        kind: found.kind.to_string(),
        archived: found.archived,
        stack: Vec::new(),
        owner: None,
        status: String::new(),
        description: String::new(),
        tags: Vec::new(),
        notes: None,
        registered: false,
        repo: false,
        folders: Vec::new(),
        milestones: Vec::new(),
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
/// Every project of the workstation at `root`, sorted by path. Never fails: a `.workstation` that can't be read
/// still counts as its folder's file (so it isn't flagged as missing), with the reason in `errors`.
pub fn scan(root: &Path) -> Scan {
    let found = layout::find_projects(root);
    let files = registry::read(root);
    let mut projects: Vec<Project> = files.entries.iter().map(from_entry).collect();
    for (path, _) in &files.broken {
        let kind = found.iter().find(|f| same_path(&f.path, path)).map(|f| f.kind.to_string()).unwrap_or_default();
        projects.push(from_entry(&Entry { path: path.clone(), name: folder_name(path), kind, ..Entry::default() }));
    }
    let missing: Vec<Project> =
        found.iter().filter(|f| !projects.iter().any(|p| same_path(&p.path, &f.path))).map(unregistered).collect();
    projects.extend(missing);
    projects.sort_by(|a, b| a.path.cmp(&b.path));
    let paths: Vec<String> = projects.iter().map(|p| p.path.clone()).collect();
    for project in &mut projects {
        project.repo = root.join(&project.path).join(".git").exists();
        project.folders = folders(root, &project.path, &paths);
    }
    let errors = files.broken.into_iter().map(|(path, reason)| format!("{path}{FILE_NAME} {reason}")).collect();
    Scan { projects, errors }
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

    fn flags(scan: &Scan) -> Vec<(&str, bool)> {
        scan.projects.iter().map(|p| (p.path.as_str(), p.registered)).collect()
    }

    #[test]
    fn merges_files_and_places_with_flags() {
        let temp = Temp::new();
        temp.file("games/roblox/fish-dive/.workstation", r#"{ "name": "Fish Dive", "kind": "game", "tags": ["roblox"] }"#);
        temp.dir("tools/rename");
        temp.file("sandbox/kept/.workstation", r#"{ "name": "Kept", "kind": "tool" }"#);
        let scan = scan(&temp.0);
        assert!(scan.errors.is_empty());
        assert_eq!(flags(&scan), vec![("games/roblox/fish-dive/", true), ("sandbox/kept/", true), ("tools/rename/", false)]);
        assert_eq!(scan.projects[0].tags, vec!["roblox"]);
        assert_eq!(scan.projects[2].name, "rename");
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
    fn reads_milestones_and_skips_bad_ones() {
        let temp = Temp::new();
        temp.file(
            "tools/rename/.workstation",
            r#"{ "name": "Rename", "kind": "tool", "milestones": [
                    { "name": "M1 Scaffold", "done": true, "description": " Repo, rules and CI. " },
                    { "name": "M2 Batch rename", "track": " CLI ", "description": "" },
                    { "done": true },
                    "M3 as a bare string",
                    { "name": "  ", "done": false }
                ] }"#,
        );
        let scan = scan(&temp.0);
        assert!(scan.errors.is_empty());
        let milestone = |name: &str, done, track: Option<&str>, description: Option<&str>| Milestone {
            name: name.into(),
            done,
            track: track.map(Into::into),
            description: description.map(Into::into),
        };
        assert_eq!(
            scan.projects[0].milestones,
            [
                milestone("M1 Scaffold", true, None, Some("Repo, rules and CI.")),
                milestone("M2 Batch rename", false, Some("CLI"), None),
            ]
        );
    }

    #[test]
    fn a_broken_file_is_reported_and_still_counts() {
        let temp = Temp::new();
        temp.file("tools/rename/.workstation", "{ nope");
        temp.dir("tools/zeta");
        let scan = scan(&temp.0);
        assert_eq!(scan.errors.len(), 1);
        assert!(scan.errors[0].starts_with("tools/rename/.workstation can't be read"), "{}", scan.errors[0]);
        assert_eq!(flags(&scan), vec![("tools/rename/", true), ("tools/zeta/", false)]);
        assert_eq!((scan.projects[0].name.as_str(), scan.projects[0].kind.as_str()), ("rename", "tool"));
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
