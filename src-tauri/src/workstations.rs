//! Workstations: the user's list of workstation roots, saved in the app config folder.
//! Only `workstations.json` in that folder is ever written; workstation folders are only checked, never changed.

// ── Imports ───────────────────────────────
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};

// ── Constants ─────────────────────────────
const FILE_NAME: &str = "workstations.json";
/// The file that makes a folder a workstation root.
const MARKER: &str = "projects.json";

// ── Types ─────────────────────────────────
/// One saved workstation.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Workstation {
    name: String,
    root: PathBuf,
}

/// The saved file: every workstation and which one is open.
#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Saved {
    workstations: Vec<Workstation>,
    open: Option<PathBuf>,
}

/// A workstation as the UI sees it.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub name: String,
    pub root: PathBuf,
    /// False when the folder is gone or no longer a workstation (an unplugged drive, a moved folder).
    pub available: bool,
}

/// Every workstation and which one is open, for the UI.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Listing {
    pub workstations: Vec<Entry>,
    pub open: Option<PathBuf>,
}

// ── Private helpers ───────────────────────
fn file(config_dir: &Path) -> PathBuf {
    config_dir.join(FILE_NAME)
}

// shortcut: compares paths as Windows does (case and slashes ignored); needs real normalizing for other OSes.
fn same_root(a: &Path, b: &Path) -> bool {
    let norm = |p: &Path| p.to_string_lossy().replace('/', "\\").trim_end_matches('\\').to_lowercase();
    norm(a) == norm(b)
}

fn load(config_dir: &Path) -> Result<Saved, String> {
    let path = file(config_dir);
    match fs::read_to_string(&path) {
        Ok(text) => serde_json::from_str(&text)
            .map_err(|e| format!("{} is damaged ({e}). Fix it or move it away.", path.display())),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(Saved::default()),
        Err(e) => Err(format!("Can't read {}: {e}", path.display())),
    }
}

// Writes a temp file and renames it over the old one, so a crash never leaves half a file.
fn save(config_dir: &Path, saved: &Saved) -> Result<Listing, String> {
    let path = file(config_dir);
    let temp = path.with_extension("json.tmp");
    let text = serde_json::to_string_pretty(saved).map_err(|e| e.to_string())?;
    fs::create_dir_all(config_dir)
        .and_then(|()| fs::write(&temp, text + "\n"))
        .and_then(|()| fs::rename(&temp, &path))
        .map_err(|e| format!("Can't save {}: {e}", path.display()))?;
    Ok(listing(saved))
}

fn listing(saved: &Saved) -> Listing {
    let workstations = saved
        .workstations
        .iter()
        .map(|w| Entry { name: w.name.clone(), root: w.root.clone(), available: is_workstation(&w.root) })
        .collect();
    Listing { workstations, open: saved.open.clone() }
}

fn find<'a>(saved: &'a Saved, root: &Path) -> Option<&'a Workstation> {
    saved.workstations.iter().find(|w| same_root(&w.root, root))
}

// Adds the root if it's new and returns the stored path (the first spelling wins).
fn insert(saved: &mut Saved, root: &Path) -> PathBuf {
    if let Some(existing) = find(saved, root) {
        return existing.root.clone();
    }
    let name = root.file_name().map_or_else(|| root.display().to_string(), |n| n.to_string_lossy().into_owned());
    saved.workstations.push(Workstation { name, root: root.to_path_buf() });
    root.to_path_buf()
}

// ── Public API ────────────────────────────
/// True when `root` holds a `projects.json`.
pub fn is_workstation(root: &Path) -> bool {
    root.join(MARKER).is_file()
}

/// The saved workstations, or an empty list on first run.
pub fn list(config_dir: &Path) -> Result<Listing, String> {
    Ok(listing(&load(config_dir)?))
}

/// Adds a workstation (if it isn't listed yet) and opens it.
pub fn add(config_dir: &Path, root: &Path) -> Result<Listing, String> {
    if !is_workstation(root) {
        return Err(format!("{} isn't a workstation: it has no projects.json.", root.display()));
    }
    let mut saved = load(config_dir)?;
    saved.open = Some(insert(&mut saved, root));
    save(config_dir, &saved)
}

/// Forgets a workstation (its folder is untouched). If it was open, the first one left opens.
pub fn remove(config_dir: &Path, root: &Path) -> Result<Listing, String> {
    let mut saved = load(config_dir)?;
    saved.workstations.retain(|w| !same_root(&w.root, root));
    if saved.open.as_deref().is_some_and(|open| same_root(open, root)) {
        saved.open = saved.workstations.first().map(|w| w.root.clone());
    }
    save(config_dir, &saved)
}

/// Makes a listed workstation the open one.
pub fn open(config_dir: &Path, root: &Path) -> Result<Listing, String> {
    let mut saved = load(config_dir)?;
    let stored = find(&saved, root).ok_or_else(|| format!("{} isn't in the list.", root.display()))?.root.clone();
    saved.open = Some(stored);
    save(config_dir, &saved)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    impl Temp {
        /// Makes `<temp>/<name>` a workstation root and returns it.
        fn workstation(&self, name: &str) -> PathBuf {
            self.file(&format!("{name}/{MARKER}"), "");
            self.0.join(name)
        }
    }

    fn roots(listing: &Listing) -> Vec<PathBuf> {
        listing.workstations.iter().map(|w| w.root.clone()).collect()
    }

    #[test]
    fn first_run_is_empty() {
        let temp = Temp::new();
        let listing = list(&temp.0.join("config")).unwrap();
        assert!(listing.workstations.is_empty());
        assert_eq!(listing.open, None);
    }

    #[test]
    fn add_rejects_a_plain_folder() {
        let temp = Temp::new();
        let plain = temp.0.join("plain");
        fs::create_dir_all(&plain).unwrap();
        assert!(add(&temp.0.join("config"), &plain).is_err());
    }

    #[test]
    fn add_opens_and_ignores_the_same_root_spelled_differently() {
        let temp = Temp::new();
        let config = temp.0.join("config");
        let home = temp.workstation("Home");
        let work = temp.workstation("Work");
        add(&config, &home).unwrap();
        add(&config, &work).unwrap();
        let again = PathBuf::from(format!("{}\\", home.to_string_lossy().to_uppercase()));
        let listing = add(&config, &again).unwrap();
        assert_eq!(roots(&listing), vec![home.clone(), work]);
        assert_eq!(listing.open, Some(home));
        assert_eq!(listing.workstations[0].name, "Home");
        assert!(listing.workstations[0].available);
    }

    #[test]
    fn remove_opens_the_first_left_and_keeps_the_folder() {
        let temp = Temp::new();
        let config = temp.0.join("config");
        let home = temp.workstation("home");
        let work = temp.workstation("work");
        add(&config, &home).unwrap();
        add(&config, &work).unwrap();
        let listing = remove(&config, &work).unwrap();
        assert_eq!(roots(&listing), vec![home.clone()]);
        assert_eq!(listing.open, Some(home));
        assert!(is_workstation(&work));
    }

    #[test]
    fn open_needs_a_listed_root() {
        let temp = Temp::new();
        let config = temp.0.join("config");
        let home = temp.workstation("home");
        let work = temp.workstation("work");
        add(&config, &home).unwrap();
        assert!(open(&config, &work).is_err());
        add(&config, &work).unwrap();
        assert_eq!(open(&config, &home).unwrap().open, Some(home));
    }

    #[test]
    fn a_missing_folder_is_listed_as_unavailable() {
        let temp = Temp::new();
        let config = temp.0.join("config");
        let home = temp.workstation("home");
        add(&config, &home).unwrap();
        fs::remove_file(home.join("projects.json")).unwrap();
        assert!(!list(&config).unwrap().workstations[0].available);
    }

    #[test]
    fn a_damaged_file_is_reported_and_left_alone() {
        let temp = Temp::new();
        let config = temp.0.join("config");
        fs::create_dir_all(&config).unwrap();
        fs::write(file(&config), "{ not json").unwrap();
        let home = temp.workstation("home");
        assert!(add(&config, &home).is_err());
        assert_eq!(fs::read_to_string(file(&config)).unwrap(), "{ not json");
    }
}
