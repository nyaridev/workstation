//! Edited: when each project was last edited, as the newest change time of any file in its folder, skipping folders
//! of dependencies and generated files. Read only for "Sort by last edited", never during the scan.

// ── Imports ───────────────────────────────
use super::folder;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::thread;
use std::time::UNIX_EPOCH;

// ── Constants ─────────────────────────────
/// Folders of dependencies, builds and caches: what changes there isn't the user's editing.
const SKIP: [&str; 16] = [
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    "out",
    ".venv",
    "venv",
    "__pycache__",
    ".godot",
    ".import",
    "Library",
    "Temp",
    "obj",
    ".next",
    ".cache",
];
/// The most files and folders looked at in one project, so a huge one stays quick.
const MAX_ENTRIES: usize = 20_000;
/// How many projects are read at the same time.
const PARALLEL: usize = 8;

// ── Private helpers ───────────────────────
// The newest change time under `dir`, in Unix seconds. Links (and Windows junctions) aren't followed.
// shortcut: stops after MAX_ENTRIES entries, so a giant project may miss a newer file; walk more if that shows.
fn newest(dir: &Path) -> Option<u64> {
    let mut folders = vec![dir.to_path_buf()];
    let (mut seen, mut newest) = (0, None);
    while let Some(dir) = folders.pop() {
        let Ok(entries) = fs::read_dir(&dir) else { continue };
        for entry in entries.flatten() {
            seen += 1;
            if seen > MAX_ENTRIES {
                return newest;
            }
            let Ok(kind) = entry.file_type() else { continue };
            if kind.is_symlink() || (kind.is_dir() && SKIP.contains(&entry.file_name().to_string_lossy().as_ref())) {
                continue;
            }
            if kind.is_dir() {
                folders.push(entry.path());
                continue;
            }
            let changed = entry.metadata().and_then(|m| m.modified()).ok();
            newest = newest.max(changed.and_then(|t| t.duration_since(UNIX_EPOCH).ok()).map(|d| d.as_secs()));
        }
    }
    newest
}

// ── Public API ────────────────────────────
/// When each of these projects (paths from the workstation root) was last edited, in Unix seconds, read a few at a
/// time. Paths that aren't folders in the workstation, and empty folders, are left out.
pub fn last_edited(root: &Path, paths: Vec<String>) -> HashMap<String, u64> {
    let chunk = paths.len().div_ceil(PARALLEL).max(1);
    thread::scope(|scope| {
        let workers: Vec<_> = paths
            .chunks(chunk)
            .map(|part| {
                scope.spawn(move || {
                    part.iter()
                        .filter_map(|path| Some((path.clone(), newest(&folder(root, path).ok()?)?)))
                        .collect::<Vec<_>>()
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
    use std::fs::File;
    use std::time::{Duration, SystemTime};

    #[test]
    fn takes_the_newest_file_outside_dependency_folders() {
        let temp = Temp::new();
        let at = |path: &str, secs: u64| {
            temp.file(path, "x");
            let file = File::options().write(true).open(temp.0.join(path)).unwrap();
            file.set_modified(SystemTime::UNIX_EPOCH + Duration::from_secs(secs)).unwrap();
        };
        at("tool/README.md", 1_000);
        at("tool/src/deep/main.rs", 2_000);
        at("tool/node_modules/pkg/index.js", 9_000);
        at("tool/target/debug/tool.exe", 9_000);
        at("other/notes.md", 500);
        temp.dir("empty");

        let found = last_edited(&temp.0, vec!["tool/".into(), "other/".into(), "empty/".into(), "../out/".into()]);
        assert_eq!(found.get("tool/"), Some(&2_000), "node_modules and target don't count");
        assert_eq!(found.get("other/"), Some(&500));
        assert_eq!(found.len(), 2, "an empty folder and a path outside the workstation have no time");
    }
}
