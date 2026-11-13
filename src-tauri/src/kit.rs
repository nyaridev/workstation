//! Kit: the starter workstation built into the exe, and setting one up in a folder.
//! Files are stored under neutral names so they don't act on this repo (`.claude` as `dot-claude`, `CLAUDE.md` as
//! `CLAUDE.kit.md`); setup writes them under their real names and never overwrites a file that exists.

// ── Imports ───────────────────────────────
use include_dir::{Dir, DirEntry, include_dir};
use serde::Serialize;
use std::fs;
use std::path::Path;

// ── Constants ─────────────────────────────
static KIT: Dir = include_dir!("$CARGO_MANIFEST_DIR/../kit");
/// The `.workstation` format lives once, in this repo's docs, and ships inside the kit.
const REGISTRY_DOC: (&str, &str) = ("_meta/docs/workstation-file.md", include_str!("../../docs/workstation-file.md"));

// ── Types ─────────────────────────────────
/// What a setup wrote and what it left alone, as paths from the workstation root.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Setup {
    pub written: Vec<String>,
    pub skipped: Vec<String>,
}

// ── Private helpers ───────────────────────
// The real name of a stored kit path: `dot-claude/rules` → `.claude/rules`, `CLAUDE.kit.md` → `CLAUDE.md`.
fn real_name(stored: &str) -> String {
    stored
        .split('/')
        .map(|part| match part {
            "CLAUDE.kit.md" => "CLAUDE.md".to_string(),
            "AGENTS.kit.md" => "AGENTS.md".to_string(),
            _ => part.strip_prefix("dot-").map_or_else(|| part.to_string(), |rest| format!(".{rest}")),
        })
        .collect::<Vec<_>>()
        .join("/")
}

// Every file of the kit as (stored path, contents), the registry doc included.
fn files() -> Vec<(String, &'static [u8])> {
    fn walk(dir: &'static Dir<'static>, out: &mut Vec<(String, &'static [u8])>) {
        for entry in dir.entries() {
            match entry {
                DirEntry::Dir(sub) => walk(sub, out),
                DirEntry::File(file) => {
                    out.push((file.path().to_string_lossy().replace('\\', "/"), file.contents()));
                }
            }
        }
    }
    let mut out = Vec::new();
    walk(&KIT, &mut out);
    out.push((REGISTRY_DOC.0.to_string(), REGISTRY_DOC.1.as_bytes()));
    out
}

// ── Public API ────────────────────────────
/// Writes the starter workstation into `root` (an existing folder), skipping every file that's already there.
pub fn setup(root: &Path) -> Result<Setup, String> {
    if !root.is_dir() {
        return Err(format!("{} isn't a folder.", root.display()));
    }
    let mut report = Setup { written: Vec::new(), skipped: Vec::new() };
    for (stored, contents) in files() {
        let rel = real_name(&stored);
        let target = root.join(&rel);
        if target.exists() {
            report.skipped.push(rel);
            continue;
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Can't create {}: {e}", parent.display()))?;
        }
        fs::write(&target, contents).map_err(|e| format!("Can't write {rel}: {e}"))?;
        report.written.push(rel);
    }
    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    #[test]
    fn maps_stored_names_back() {
        assert_eq!(real_name("dot-claude/rules/safety.md"), ".claude/rules/safety.md");
        assert_eq!(real_name("games/roblox/CLAUDE.kit.md"), "games/roblox/CLAUDE.md");
        assert_eq!(real_name("_meta/templates/mod/dot-gitignore"), "_meta/templates/mod/.gitignore");
        assert_eq!(real_name("dot-workstation"), ".workstation");
    }

    #[test]
    fn the_kit_is_safe_to_ship() {
        for (stored, contents) in files() {
            let name = stored.rsplit('/').next().unwrap();
            assert!(!name.starts_with('.') && name != "CLAUDE.md" && name != "AGENTS.md", "{stored} is stored under its real name");
            let text = String::from_utf8_lossy(contents);
            for personal in ["A:/", "A:\\", "//a/", "nyaridev", "nari-games"] {
                assert!(!text.contains(personal), "{stored} mentions {personal}");
            }
        }
    }

    #[test]
    fn sets_up_a_folder_without_overwriting() {
        let temp = Temp::new();
        temp.file("AGENTS.md", "mine");
        let first = setup(&temp.0).unwrap();
        assert!(first.skipped == ["AGENTS.md"], "{:?}", first.skipped);
        for rel in [".workstation", "CLAUDE.md", ".claude/rules/registry.md", "_meta/docs/workstation-file.md", "games/CLAUDE.md"] {
            assert!(temp.0.join(rel).is_file(), "{rel} wasn't written");
        }
        assert_eq!(fs::read_to_string(temp.0.join("AGENTS.md")).unwrap(), "mine");
        assert!(crate::workstations::is_workstation(&temp.0));

        let again = setup(&temp.0).unwrap();
        assert!(again.written.is_empty(), "a second setup wrote {:?}", again.written);
        assert!(setup(&temp.0.join("missing")).is_err());
    }
}
