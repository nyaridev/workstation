//! Registry: reads and writes the workstation's projects.json (format: `docs/projects-json.md`).
//! Reading needs only `path` per entry, so one sloppy entry never hides the rest. Writing works on the raw JSON, so
//! keys, order and anything the app doesn't know survive; it never removes an entry.

// ── Imports ───────────────────────────────
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::io::ErrorKind;
use std::path::{Component, Path};

// ── Constants ─────────────────────────────
pub const FILE_NAME: &str = "projects.json";
/// The allowed `kind` values, as `scan-projects.ps1` checks them.
const KINDS: [&str; 11] =
    ["game", "mod", "emulator", "app", "tool", "framework", "suite", "asset-pack", "research", "idea", "external"];
/// The allowed `status` values. Archived projects have no entry, so no `archived` status.
const STATUSES: [&str; 5] = ["planning", "prototyping", "in-development", "released", "on-hold"];

// ── Types ─────────────────────────────────
/// One `projects.json` entry, in the documented key order. Keys the app doesn't know are kept in `extra`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    #[serde(default)]
    pub name: String,
    pub path: String,
    #[serde(default)]
    pub kind: String,
    #[serde(default)]
    pub stack: Vec<String>,
    #[serde(default)]
    pub owner: Option<String>,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Deserialize)]
struct File {
    #[serde(default)]
    projects: Vec<Entry>,
}

// ── Private helpers ───────────────────────
fn load_text(root: &Path) -> Result<String, String> {
    match fs::read_to_string(root.join(FILE_NAME)) {
        Ok(text) => Ok(text),
        Err(e) if e.kind() == ErrorKind::NotFound => Err(format!("This workstation has no {FILE_NAME}.")),
        Err(e) => Err(format!("Can't read {FILE_NAME}: {e}")),
    }
}

// Reads the file as raw JSON, applies `change` to its `projects` array, and writes it back.
fn edit(root: &Path, change: impl FnOnce(&mut Vec<Value>) -> Result<(), String>) -> Result<(), String> {
    let mut file: Value =
        serde_json::from_str(&load_text(root)?).map_err(|e| format!("{FILE_NAME} can't be read: {e}"))?;
    let projects = file
        .get_mut("projects")
        .and_then(Value::as_array_mut)
        .ok_or_else(|| format!("{FILE_NAME} has no \"projects\" list."))?;
    change(projects)?;

    let mut text = String::new();
    print(&mut text, &file, 0);
    text.push('\n');
    // A temp file and a rename, so a crash never leaves half a registry.
    let path = root.join(FILE_NAME);
    let temp = path.with_extension("json.tmp");
    fs::write(&temp, text)
        .and_then(|()| fs::rename(&temp, &path))
        .map_err(|e| format!("Can't save {FILE_NAME}: {e}"))
}

// Pretty-prints like the hand-written file: two-space indent, lists of plain values on one line.
fn print(out: &mut String, value: &Value, indent: usize) {
    let pad = |out: &mut String, n: usize| out.push_str(&" ".repeat(n));
    match value {
        Value::Object(map) if !map.is_empty() => {
            out.push_str("{\n");
            for (i, (key, item)) in map.iter().enumerate() {
                pad(out, indent + 2);
                out.push_str(&Value::from(key.as_str()).to_string());
                out.push_str(": ");
                print(out, item, indent + 2);
                out.push_str(if i + 1 < map.len() { ",\n" } else { "\n" });
            }
            pad(out, indent);
            out.push('}');
        }
        Value::Array(items) if items.iter().any(|item| item.is_object() || item.is_array()) => {
            out.push_str("[\n");
            for (i, item) in items.iter().enumerate() {
                pad(out, indent + 2);
                print(out, item, indent + 2);
                out.push_str(if i + 1 < items.len() { ",\n" } else { "\n" });
            }
            pad(out, indent);
            out.push(']');
        }
        Value::Array(items) => {
            let inline: Vec<String> = items.iter().map(Value::to_string).collect();
            out.push_str(&format!("[{}]", inline.join(", ")));
        }
        other => out.push_str(&other.to_string()),
    }
}

fn path_of(entry: &Value) -> &str {
    entry.get("path").and_then(Value::as_str).unwrap_or("")
}

fn is_tag(tag: &str) -> bool {
    !tag.is_empty()
        && tag.split('-').all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit()))
}

fn check_tags(tags: &[String]) -> Result<(), String> {
    match tags.iter().find(|tag| !is_tag(tag)) {
        Some(bad) => Err(format!("\"{bad}\" isn't a tag: use lowercase letters, digits and dashes (co-op).")),
        None => Ok(()),
    }
}

// The documented form of a project path: forward slashes, a trailing slash, nothing that leaves the workstation.
fn normalize_path(path: &str) -> Result<String, String> {
    let path = path.trim().replace('\\', "/");
    let inside = !path.is_empty() && Path::new(&path).components().all(|c| matches!(c, Component::Normal(_)));
    if !inside {
        return Err(format!("\"{path}\" isn't a project path inside the workstation."));
    }
    Ok(format!("{}/", path.trim_end_matches('/')))
}

// ── Public API ────────────────────────────
// shortcut: compares as Windows does (case and slashes ignored); fine until the app runs on another OS.
/// True when two project paths name the same folder.
pub fn same_path(a: &str, b: &str) -> bool {
    let norm = |p: &str| p.replace('\\', "/").trim_end_matches('/').to_lowercase();
    norm(a) == norm(b)
}

/// The entries of `<root>/projects.json`. The error names the line and column of a syntax error.
pub fn read(root: &Path) -> Result<Vec<Entry>, String> {
    let file: File = serde_json::from_str(&load_text(root)?).map_err(|e| format!("{FILE_NAME} can't be read: {e}"))?;
    Ok(file.projects)
}

/// Adds an entry for a project folder that has none, at its place by path.
pub fn add(root: &Path, mut entry: Entry) -> Result<(), String> {
    entry.path = normalize_path(&entry.path)?;
    if same_path(entry.path.split('/').next().unwrap_or(""), "archive") {
        return Err("Archived projects aren't registered in projects.json.".to_string());
    }
    entry.name = entry.name.trim().to_string();
    entry.description = entry.description.trim().to_string();
    if entry.name.is_empty() || entry.description.is_empty() {
        return Err("A project needs a name and a one-sentence description.".to_string());
    }
    if !KINDS.contains(&entry.kind.as_str()) || !STATUSES.contains(&entry.status.as_str()) {
        return Err(format!("Unknown kind \"{}\" or status \"{}\".", entry.kind, entry.status));
    }
    check_tags(&entry.tags)?;
    if !root.join(&entry.path).is_dir() {
        return Err(format!("{} isn't a folder in this workstation.", entry.path));
    }
    let value = serde_json::to_value(&entry).map_err(|e| e.to_string())?;
    edit(root, |projects| {
        if projects.iter().any(|p| same_path(path_of(p), &entry.path)) {
            return Err(format!("{} is already in {FILE_NAME}.", entry.path));
        }
        let at = projects.iter().position(|p| path_of(p) > entry.path.as_str()).unwrap_or(projects.len());
        projects.insert(at, value);
        Ok(())
    })
}

/// Replaces the tags of the entry at `path`.
pub fn set_tags(root: &Path, path: &str, tags: Vec<String>) -> Result<(), String> {
    check_tags(&tags)?;
    edit(root, |projects| {
        let entry = projects
            .iter_mut()
            .find(|p| same_path(path_of(p), path))
            .and_then(Value::as_object_mut)
            .ok_or_else(|| format!("{path} isn't in {FILE_NAME}."))?;
        entry.insert("tags".to_string(), Value::from(tags));
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    /// A registry in the hand-written style, with keys the app doesn't know.
    const SAMPLE: &str = r#"{
  "version": 1,
  "projects": [
    {
      "name": "Fish Dive",
      "path": "games/roblox/fish-dive/",
      "kind": "game",
      "stack": ["Roblox", "ume"],
      "owner": null,
      "status": "planning",
      "description": "Dive deeper, catch rarer fish.",
      "tags": ["roblox"],
      "color": "teal"
    },
    {
      "name": "Świat",
      "path": "tools/zeta/",
      "kind": "tool",
      "stack": [],
      "owner": "local",
      "status": "prototyping",
      "description": "Last one.",
      "tags": []
    }
  ],
  "comment": "kept"
}
"#;

    fn entry(path: &str) -> Entry {
        Entry {
            name: "Rename".into(),
            path: path.into(),
            kind: "tool".into(),
            stack: vec!["Rust".into()],
            owner: Some("local".into()),
            status: "prototyping".into(),
            description: "Renames files.".into(),
            tags: vec!["cli".into()],
            ..Entry::default()
        }
    }

    #[test]
    fn reads_entries_and_keeps_unknown_keys() {
        let temp = Temp::new();
        temp.file(FILE_NAME, SAMPLE);
        let entries = read(&temp.0).unwrap();
        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].name, "Fish Dive");
        assert_eq!(entries[0].owner, None);
        assert_eq!(entries[0].extra.get("color"), Some(&Value::from("teal")));
    }

    #[test]
    fn a_syntax_error_names_its_line() {
        let temp = Temp::new();
        temp.file(FILE_NAME, "{\n  \"projects\": [\n    { \"path\": \"a/\" },,\n  ]\n}");
        let error = read(&temp.0).unwrap_err();
        assert!(error.contains("line 3"), "{error}");
    }

    #[test]
    fn a_missing_file_says_so() {
        let temp = Temp::new();
        assert!(read(&temp.0).unwrap_err().contains("no projects.json"));
    }

    #[test]
    fn a_write_keeps_the_file_byte_for_byte() {
        let temp = Temp::new();
        temp.file(FILE_NAME, SAMPLE);
        set_tags(&temp.0, "games/roblox/fish-dive/", vec!["roblox".into()]).unwrap();
        assert_eq!(fs::read_to_string(temp.0.join(FILE_NAME)).unwrap(), SAMPLE);
    }

    #[test]
    fn add_inserts_by_path_in_key_order() {
        let temp = Temp::new();
        temp.file(FILE_NAME, SAMPLE);
        temp.dir("tools/rename");
        add(&temp.0, entry("tools\\rename")).unwrap();

        let text = fs::read_to_string(temp.0.join(FILE_NAME)).unwrap();
        let paths: Vec<String> = read(&temp.0).unwrap().into_iter().map(|e| e.path).collect();
        assert_eq!(paths, ["games/roblox/fish-dive/", "tools/rename/", "tools/zeta/"]);
        assert!(text.contains(
            "      \"name\": \"Rename\",\n      \"path\": \"tools/rename/\",\n      \"kind\": \"tool\",\n      \"stack\": [\"Rust\"],"
        ));
        assert!(!text.contains("\"notes\""), "an empty note isn't written");
        assert!(text.ends_with("  \"comment\": \"kept\"\n}\n"));
    }

    #[test]
    fn add_refuses_bad_entries() {
        let temp = Temp::new();
        temp.file(FILE_NAME, SAMPLE);
        temp.dir("tools/rename");
        temp.dir("archive/tools/old");
        assert!(add(&temp.0, entry("tools/missing/")).is_err(), "no folder");
        assert!(add(&temp.0, entry("Archive/tools/old/")).is_err(), "archived");
        assert!(add(&temp.0, Entry { status: "archived".into(), ..entry("tools/rename/") }).is_err(), "archived status");
        assert!(add(&temp.0, entry("../outside/")).is_err(), "outside the workstation");
        assert!(add(&temp.0, entry("Tools/Zeta/")).is_err(), "already listed");
        assert!(add(&temp.0, Entry { kind: "thing".into(), ..entry("tools/rename/") }).is_err(), "unknown kind");
        assert!(add(&temp.0, Entry { description: " ".into(), ..entry("tools/rename/") }).is_err(), "no description");
        assert!(add(&temp.0, Entry { tags: vec!["Co Op".into()], ..entry("tools/rename/") }).is_err(), "bad tag");
        assert_eq!(fs::read_to_string(temp.0.join(FILE_NAME)).unwrap(), SAMPLE, "nothing was written");
    }

    #[test]
    fn set_tags_changes_only_that_entry() {
        let temp = Temp::new();
        temp.file(FILE_NAME, SAMPLE);
        set_tags(&temp.0, "TOOLS/ZETA", vec!["co-op".into(), "web".into()]).unwrap();
        let entries = read(&temp.0).unwrap();
        assert_eq!(entries[1].tags, vec!["co-op", "web"]);
        assert_eq!(entries[0].tags, vec!["roblox"]);
        assert!(set_tags(&temp.0, "tools/none/", vec![]).is_err());
    }
}
