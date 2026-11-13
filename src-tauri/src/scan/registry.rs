//! Registry: each project's `.workstation` file (format: `docs/workstation-file.md`), found by walking the workstation
//! a few levels deep. A project's path is where its file is, so the file has none. Reading is lenient, so one sloppy
//! file never hides the rest. Writing works on the raw JSON, so keys, order and anything the app doesn't know survive.

// ── Imports ───────────────────────────────
use super::layout::SKIP;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::fs;
use std::io::ErrorKind;
use std::path::{Component, Path};

// ── Constants ─────────────────────────────
/// A project's own file, in its main folder; at the workstation root it marks the workstation.
pub const FILE_NAME: &str = ".workstation";
/// How many folder levels below the root a project can sit. The deepest place is a suite repo in a group,
/// `frameworks/<suite>/<group>/<repo>/`; most are 2 or 3 (`games/<engine>/<game>/`). Under `archive/`, one more.
pub const MAX_DEPTH: usize = 4;
/// The allowed `kind` values, as `scan-projects.ps1` checks them.
const KINDS: [&str; 11] =
    ["game", "mod", "emulator", "app", "tool", "framework", "suite", "asset-pack", "research", "idea", "external"];
/// The allowed `status` values.
const STATUSES: [&str; 9] = [
    "concept",
    "planning",
    "researching",
    "prototyping",
    "in-development",
    "released",
    "maintained",
    "complete",
    "on-hold",
];

// ── Types ─────────────────────────────────
/// One project's `.workstation`, in the documented key order. Keys the app doesn't know are kept in `extra`.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    #[serde(default)]
    pub name: String,
    /// Where the file is, from the workstation root (`tools/rename/`); never written into the file.
    #[serde(default, skip_serializing)]
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

/// Every `.workstation` of a workstation: the ones read, and why the others couldn't be.
pub struct Files {
    pub entries: Vec<Entry>,
    /// (project path, reason) for each file that can't be read.
    pub broken: Vec<(String, String)>,
}

// ── Private helpers ───────────────────────
// The project folders below `rel` holding a `.workstation`, `depth` levels down at most. Support (`_meta/`) and
// skipped folders aren't looked into, nor are repos (a project's repo holds no other project) or links.
fn walk(root: &Path, rel: &str, depth: usize, out: &mut Vec<String>) {
    let Ok(read) = fs::read_dir(root.join(rel)) else { return };
    for entry in read.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if !entry.file_type().is_ok_and(|t| t.is_dir()) || name.starts_with('_') || SKIP.contains(&name.as_str()) {
            continue;
        }
        let path = format!("{rel}{name}/");
        let dir = entry.path();
        if dir.join(FILE_NAME).is_file() {
            out.push(path.clone());
        }
        let below = if rel.is_empty() && name == "archive" { depth } else { depth - 1 };
        if below > 0 && !dir.join(".git").exists() {
            walk(root, &path, below, out);
        }
    }
}

fn file_of(root: &Path, path: &str) -> std::path::PathBuf {
    root.join(path).join(FILE_NAME)
}

// One project's file as an entry, its path set from where it is.
fn read_one(root: &Path, path: &str) -> Result<Entry, String> {
    let text = fs::read_to_string(file_of(root, path)).map_err(|e| format!("can't be read: {e}"))?;
    let mut entry: Entry = serde_json::from_str(&text).map_err(|e| format!("can't be read: {e}"))?;
    entry.path = path.to_string();
    Ok(entry)
}

// Writes `value` as a project's file: through a temp file and a rename, so a crash never leaves half of one.
fn write(root: &Path, path: &str, value: &Value) -> Result<(), String> {
    let mut text = String::new();
    print(&mut text, value, 0);
    text.push('\n');
    let file = file_of(root, path);
    let temp = file.with_extension("tmp");
    fs::write(&temp, text)
        .and_then(|()| fs::rename(&temp, &file))
        .map_err(|e| format!("Can't save {path}{FILE_NAME}: {e}"))
}

// Pretty-prints like a hand-written file: two-space indent, lists of plain values on one line.
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

/// Every project's `.workstation` under `root`, sorted by path.
pub fn read(root: &Path) -> Files {
    let mut paths = Vec::new();
    walk(root, "", MAX_DEPTH, &mut paths);
    paths.sort();
    let mut files = Files { entries: Vec::new(), broken: Vec::new() };
    for path in paths {
        match read_one(root, &path) {
            Ok(entry) => files.entries.push(entry),
            Err(reason) => files.broken.push((path, reason)),
        }
    }
    files
}

/// Writes a `.workstation` into a project folder that has none.
pub fn add(root: &Path, mut entry: Entry) -> Result<(), String> {
    entry.path = normalize_path(&entry.path)?;
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
    if file_of(root, &entry.path).exists() {
        return Err(format!("{} already has a {FILE_NAME}.", entry.path));
    }
    let value = serde_json::to_value(&entry).map_err(|e| e.to_string())?;
    write(root, &entry.path, &value)
}

/// Replaces the tags in the `.workstation` of the project at `path`.
pub fn set_tags(root: &Path, path: &str, tags: Vec<String>) -> Result<(), String> {
    check_tags(&tags)?;
    let path = normalize_path(path)?;
    let text = match fs::read_to_string(file_of(root, &path)) {
        Ok(text) => text,
        Err(e) if e.kind() == ErrorKind::NotFound => return Err(format!("{path} has no {FILE_NAME}.")),
        Err(e) => return Err(format!("Can't read {path}{FILE_NAME}: {e}")),
    };
    let mut value: Value = serde_json::from_str(&text).map_err(|e| format!("{path}{FILE_NAME} can't be read: {e}"))?;
    let file = value.as_object_mut().ok_or_else(|| format!("{path}{FILE_NAME} isn't a JSON object."))?;
    file.insert("tags".to_string(), Value::from(tags));
    write(root, &path, &value)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    /// A file in the hand-written style, with a key the app doesn't know.
    const SAMPLE: &str = r#"{
  "name": "Fish Dive",
  "kind": "game",
  "stack": ["Roblox", "ume"],
  "owner": null,
  "status": "planning",
  "description": "Dive deeper, catch rarer fish.",
  "tags": ["roblox"],
  "color": "teal"
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
    fn finds_files_a_few_levels_deep_and_reads_them() {
        let temp = Temp::new();
        temp.file("games/roblox/fish-dive/.workstation", SAMPLE);
        temp.file("frameworks/ume/group/inner/.workstation", "{}");
        temp.file("archive/frameworks/ume/group/old/.workstation", "{}");
        temp.file("frameworks/ume/group/inner/deeper/.workstation", "{}");
        temp.file("tools/rename/.git/HEAD", "");
        temp.file("tools/rename/docs/.workstation", "{}");
        temp.file("_meta/templates/x/.workstation", "{}");
        temp.file("apps/web/site/node_modules/x/.workstation", "{}");
        temp.file("ideas/broken/.workstation", "{ nope");
        temp.file(".workstation", "{}");

        let files = read(&temp.0);
        let paths: Vec<&str> = files.entries.iter().map(|e| e.path.as_str()).collect();
        assert_eq!(paths, ["archive/frameworks/ume/group/old/", "frameworks/ume/group/inner/", "games/roblox/fish-dive/"]);
        assert_eq!(files.entries[2].name, "Fish Dive");
        assert_eq!(files.entries[2].owner, None);
        assert_eq!(files.entries[2].extra.get("color"), Some(&Value::from("teal")));
        assert_eq!(files.broken.len(), 1);
        assert_eq!(files.broken[0].0, "ideas/broken/");
        assert!(files.broken[0].1.contains("line 1"), "{}", files.broken[0].1);
    }

    #[test]
    fn a_write_keeps_the_file_byte_for_byte() {
        let temp = Temp::new();
        temp.file("games/roblox/fish-dive/.workstation", SAMPLE);
        set_tags(&temp.0, "games/roblox/fish-dive/", vec!["roblox".into()]).unwrap();
        assert_eq!(fs::read_to_string(temp.0.join("games/roblox/fish-dive/.workstation")).unwrap(), SAMPLE);
    }

    #[test]
    fn add_writes_the_file_in_key_order_without_a_path() {
        let temp = Temp::new();
        temp.dir("tools/rename");
        add(&temp.0, entry("tools\\rename")).unwrap();
        let text = fs::read_to_string(temp.0.join("tools/rename/.workstation")).unwrap();
        assert_eq!(
            text,
            "{\n  \"name\": \"Rename\",\n  \"kind\": \"tool\",\n  \"stack\": [\"Rust\"],\n  \"owner\": \"local\",\n  \
             \"status\": \"prototyping\",\n  \"description\": \"Renames files.\",\n  \"tags\": [\"cli\"]\n}\n"
        );
        assert_eq!(read(&temp.0).entries[0].path, "tools/rename/");
    }

    #[test]
    fn add_refuses_bad_entries() {
        let temp = Temp::new();
        temp.dir("tools/rename");
        temp.file("tools/zeta/.workstation", SAMPLE);
        assert!(add(&temp.0, entry("tools/missing/")).is_err(), "no folder");
        assert!(add(&temp.0, entry("../outside/")).is_err(), "outside the workstation");
        assert!(add(&temp.0, entry("Tools/Zeta/")).is_err(), "already has one");
        assert!(add(&temp.0, Entry { kind: "thing".into(), ..entry("tools/rename/") }).is_err(), "unknown kind");
        assert!(add(&temp.0, Entry { description: " ".into(), ..entry("tools/rename/") }).is_err(), "no description");
        assert!(add(&temp.0, Entry { tags: vec!["Co Op".into()], ..entry("tools/rename/") }).is_err(), "bad tag");
        assert!(!temp.0.join("tools/rename/.workstation").exists(), "nothing was written");
        assert_eq!(fs::read_to_string(temp.0.join("tools/zeta/.workstation")).unwrap(), SAMPLE);
    }

    #[test]
    fn set_tags_needs_a_file() {
        let temp = Temp::new();
        temp.file("tools/zeta/.workstation", SAMPLE);
        set_tags(&temp.0, "TOOLS/ZETA", vec!["co-op".into(), "web".into()]).unwrap();
        assert_eq!(read(&temp.0).entries[0].tags, vec!["co-op", "web"]);
        assert!(set_tags(&temp.0, "tools/none/", vec![]).is_err());
    }
}
