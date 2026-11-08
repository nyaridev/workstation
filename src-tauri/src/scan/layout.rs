//! Layout: the place rules that say where projects live, the same as the workstation's `scan-projects.ps1`.
//! A change to `PLACES` goes into that script and the kit too (`.claude/rules/architecture/backend.md`).

// ── Imports ───────────────────────────────
use super::registry::FILE_NAME as REGISTRY_FILE;
use std::fs;
use std::path::Path;

// ── Constants ─────────────────────────────
/// How far below a suite folder its repos can sit (`frameworks/ume/<group>/<repo>/`).
const SUITE_DEPTH: usize = 2;
/// Folders never looked into: dependencies, build output and caches.
const SKIP: [&str; 10] = ["node_modules", ".venv", "venv", "__pycache__", ".godot", "target", ".git", "Library", "Temp", "obj"];

/// Where projects live: `depth` folder levels below `base` (`games/<engine>/<game>/` is depth 2).
const PLACES: [Place; 10] = [
    Place { base: "games", depth: 2, kind: "game" },
    Place { base: "mods", depth: 1, kind: "mod" },
    Place { base: "emulators", depth: 1, kind: "emulator" },
    Place { base: "apps", depth: 2, kind: "app" },
    Place { base: "tools", depth: 1, kind: "tool" },
    Place { base: "frameworks", depth: 1, kind: "framework" },
    Place { base: "assets/packs", depth: 1, kind: "asset-pack" },
    Place { base: "ideas", depth: 1, kind: "idea" },
    Place { base: "research", depth: 1, kind: "research" },
    Place { base: "external", depth: 2, kind: "external" },
];

// ── Types ─────────────────────────────────
struct Place {
    base: &'static str,
    depth: usize,
    kind: &'static str,
}

/// A project folder found on disk.
#[derive(Debug, Clone, PartialEq)]
pub struct Found {
    /// From the workstation root, forward slashes, trailing slash: `games/roblox/fish-dive/`.
    pub path: String,
    pub kind: &'static str,
    /// True under `archive/`.
    pub archived: bool,
}

// ── Private helpers ───────────────────────
fn is_repo(dir: &Path) -> bool {
    dir.join(".git").exists()
}

// The visible sub-folders of `dir`, sorted; missing folders have none.
fn children(dir: &Path, skip_hidden: bool) -> Vec<String> {
    let Ok(entries) = fs::read_dir(dir) else { return Vec::new() };
    let mut names: Vec<String> = entries
        .filter_map(Result::ok)
        .filter(|e| e.path().is_dir())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|name| !SKIP.contains(&name.as_str()) && !(skip_hidden && name.starts_with('.')))
        .collect();
    names.sort();
    names
}

// Relative folder paths `depth` levels below `rel` (which ends with a slash).
fn walk(root: &Path, rel: &str, depth: usize) -> Vec<String> {
    let names = children(&root.join(rel), true);
    if depth == 1 {
        return names.into_iter().map(|name| format!("{rel}{name}/")).collect();
    }
    names.iter().flat_map(|name| walk(root, &format!("{rel}{name}/"), depth - 1)).collect()
}

// Repos inside a suite: its children, and their children when a child isn't a repo (Find-Repos depth 1).
fn suite_repos(root: &Path, suite: &str) -> Vec<String> {
    let mut repos = Vec::new();
    for name in children(&root.join(suite), false) {
        let rel = format!("{suite}{name}/");
        if is_repo(&root.join(&rel)) {
            repos.push(rel);
            continue;
        }
        for inner in children(&root.join(&rel), false) {
            let inner_rel = format!("{rel}{inner}/");
            if is_repo(&root.join(&inner_rel)) {
                repos.push(inner_rel);
            }
        }
    }
    repos
}

// Every project under `prefix` ("" for the root, "archive/" for the archive).
fn find_in(root: &Path, prefix: &str, archived: bool, out: &mut Vec<Found>) {
    for place in &PLACES {
        for path in walk(root, &format!("{prefix}{}/", place.base), place.depth) {
            // A framework folder that isn't a repo is a suite of repos.
            if place.base == "frameworks" && !is_repo(&root.join(&path)) {
                for repo in suite_repos(root, &path) {
                    out.push(Found { path: repo, kind: "framework", archived });
                }
                out.push(Found { path, kind: "suite", archived });
                continue;
            }
            out.push(Found { path, kind: place.kind, archived });
        }
    }
}

// ── Public API ────────────────────────────
/// Every project folder in the workstation at `root`, archived ones included, sorted by path.
/// Sandbox experiments aren't projects and aren't listed.
pub fn find_projects(root: &Path) -> Vec<Found> {
    let mut found = Vec::new();
    find_in(root, "", false, &mut found);
    find_in(root, "archive/", true, &mut found);
    found.sort_by(|a, b| a.path.cmp(&b.path));
    found
}

/// True when a change at `changed` (anywhere under `root`) can add, remove or reshape a project, or touches
/// `projects.json`. `structural` is true for a create, delete or rename; plain edits only count for `projects.json`
/// (Windows also reports a folder as edited when something inside it changes). Changes inside project folders
/// (code, assets) and in skipped folders are ignored.
pub fn affects_projects(root: &Path, changed: &Path, structural: bool) -> bool {
    let Ok(rel) = changed.strip_prefix(root) else { return false };
    let mut parts: Vec<String> = rel.components().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect();
    if parts.len() == 1 && parts[0] == REGISTRY_FILE {
        return true;
    }
    if !structural {
        return false;
    }
    // A new or removed `.git` turns a folder into a repo or back (suites); anything inside skipped folders is noise.
    if parts[..parts.len().saturating_sub(1)].iter().any(|p| SKIP.contains(&p.as_str())) {
        return false;
    }
    if parts.first().is_some_and(|p| p == "archive") {
        parts.remove(0);
    }
    let last_is_git = parts.last().is_some_and(|p| p == ".git");
    PLACES.iter().any(|place| {
        let base: Vec<&str> = place.base.split('/').collect();
        let shared = base.len().min(parts.len());
        if base[..shared] != parts[..shared].iter().map(String::as_str).collect::<Vec<_>>()[..] {
            return false;
        }
        let suite = if place.base == "frameworks" { SUITE_DEPTH } else { 0 };
        parts.len() <= base.len() + place.depth + suite + usize::from(last_is_git)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn changes_that_can_alter_the_list() {
        let root = Path::new("/ws");
        let yes = |rel: &str| affects_projects(root, &root.join(rel), true);
        assert!(affects_projects(root, &root.join("projects.json"), false), "an edit of projects.json counts");
        assert!(!affects_projects(root, &root.join("games/roblox/fish-dive"), false), "a folder edit doesn't");
        for rel in [
            "projects.json",
            "games",
            "games/roblox/fish-dive",
            "assets",
            "assets/packs/hats",
            "frameworks/ume/group/inner",
            "frameworks/ume/group/inner/.git",
            "archive/apps/web/old-site",
            "tools/rename/.git",
        ] {
            assert!(yes(rel), "{rel} should count");
        }
        for rel in [
            "games/roblox/fish-dive/game/src/main.lua",
            "apps/desktop/prepkit/package.json",
            "apps/desktop/prepkit/node_modules",
            "tools/rename/.git/index",
            "games/roblox/node_modules/x",
            "sandbox/test",
            "_meta/scripts/scan.ps1",
            "assets/library/sfx",
            "archive/projects.json",
        ] {
            assert!(!yes(rel), "{rel} should be ignored");
        }
        assert!(!affects_projects(root, Path::new("/elsewhere/games"), true));
    }
    use crate::test_support::Temp;

    #[test]
    fn finds_every_place_and_skips_the_rest() {
        let temp = Temp::new();
        for dir in [
            "games/roblox/fish-dive/game",
            "games/godot/swamp/node_modules/x",
            "mods/minecraft/.hidden",
            "mods/minecraft/my-pack",
            "emulators/nostale/_game",
            "apps/desktop/prepkit/src",
            "apps/web/.cache",
            "tools/rename",
            "frameworks/agent-kit",
            "frameworks/ume/.github-private",
            "frameworks/ume/ume-gui",
            "frameworks/ume/docs/notes",
            "frameworks/ume/group/inner",
            "assets/packs/hats",
            "assets/library/sfx",
            "ideas/mining",
            "research/2026-10-loops",
            "external/someone/repo",
            "sandbox/test",
            "archive/apps/web/old-site",
            "archive/games/roblox/obby",
        ] {
            temp.dir(dir);
        }
        for repo in ["frameworks/agent-kit", "frameworks/ume/.github-private", "frameworks/ume/ume-gui", "frameworks/ume/group/inner"] {
            temp.dir(&format!("{repo}/.git"));
        }

        let found: Vec<(String, &str, bool)> =
            find_projects(&temp.0).into_iter().map(|f| (f.path, f.kind, f.archived)).collect();
        let expected = [
            ("apps/desktop/prepkit/", "app", false),
            ("archive/apps/web/old-site/", "app", true),
            ("archive/games/roblox/obby/", "game", true),
            ("assets/packs/hats/", "asset-pack", false),
            ("emulators/nostale/", "emulator", false),
            ("external/someone/repo/", "external", false),
            ("frameworks/agent-kit/", "framework", false),
            ("frameworks/ume/", "suite", false),
            ("frameworks/ume/.github-private/", "framework", false),
            ("frameworks/ume/group/inner/", "framework", false),
            ("frameworks/ume/ume-gui/", "framework", false),
            ("games/godot/swamp/", "game", false),
            ("games/roblox/fish-dive/", "game", false),
            ("ideas/mining/", "idea", false),
            ("mods/minecraft/", "mod", false),
            ("research/2026-10-loops/", "research", false),
            ("tools/rename/", "tool", false),
        ];
        let expected: Vec<(String, &str, bool)> = expected.iter().map(|(p, k, a)| (p.to_string(), *k, *a)).collect();
        assert_eq!(found, expected);
    }

    #[test]
    fn an_empty_folder_has_no_projects() {
        let temp = Temp::new();
        assert!(find_projects(&temp.0).is_empty());
    }
}
