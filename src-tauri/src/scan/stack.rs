//! Stack: guesses what a project is built with from marker files, to prefill the Register form.
//! A game home keeps its code in `game/`, so that folder is looked at too. It's a guess; the user edits it.

// ── Imports ───────────────────────────────
use serde_json::Value;
use std::fs;
use std::path::Path;

// ── Constants ─────────────────────────────
/// Files whose presence names a stack item.
const MARKERS: [(&str, &str); 7] = [
    ("project.godot", "Godot"),
    ("default.project.json", "Roblox"),
    ("ume.yaml", "ume"),
    ("Cargo.toml", "Rust"),
    ("src-tauri", "Tauri"),
    ("pyproject.toml", "Python"),
    ("uv.lock", "uv"),
];
/// `package.json` dependencies worth naming.
const PACKAGES: [(&str, &str); 7] = [
    ("@tauri-apps/api", "Tauri"),
    ("react", "React"),
    ("svelte", "Svelte"),
    ("vue", "Vue"),
    ("hono", "Hono"),
    ("electron", "Electron"),
    ("vite", "Vite"),
];

// ── Private helpers ───────────────────────
fn add(stack: &mut Vec<String>, item: &str) {
    if !stack.iter().any(|s| s == item) {
        stack.push(item.to_string());
    }
}

// What a Node project's package.json says: TypeScript or JS, then its notable dependencies.
fn node(dir: &Path, stack: &mut Vec<String>) {
    let Ok(text) = fs::read_to_string(dir.join("package.json")) else { return };
    add(stack, if dir.join("tsconfig.json").exists() { "TypeScript" } else { "JS" });
    let Ok(json) = serde_json::from_str::<Value>(&text) else { return };
    let has = |name: &str| {
        ["dependencies", "devDependencies"].iter().any(|key| json.get(key).and_then(|deps| deps.get(name)).is_some())
    };
    for (package, item) in PACKAGES {
        if has(package) {
            add(stack, item);
        }
    }
}

fn look(dir: &Path, stack: &mut Vec<String>) {
    for (marker, item) in MARKERS {
        if dir.join(marker).exists() {
            add(stack, item);
        }
    }
    node(dir, stack);
}

// ── Public API ────────────────────────────
/// The stack items found in `dir` and its `game/` folder, without repeats.
pub fn guess(dir: &Path) -> Vec<String> {
    let mut stack = Vec::new();
    look(dir, &mut stack);
    look(&dir.join("game"), &mut stack);
    stack
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    #[test]
    fn reads_markers_and_package_json() {
        let temp = Temp::new();
        temp.file("app/package.json", r#"{ "dependencies": { "react": "19" }, "devDependencies": { "vite": "8" } }"#);
        temp.file("app/tsconfig.json", "{}");
        temp.dir("app/src-tauri");
        assert_eq!(guess(&temp.0.join("app")), ["Tauri", "TypeScript", "React", "Vite"]);

        temp.file("game-home/game/default.project.json", "{}");
        temp.file("game-home/game/ume.yaml", "");
        assert_eq!(guess(&temp.0.join("game-home")), ["Roblox", "ume"]);

        temp.dir("empty");
        assert!(guess(&temp.0.join("empty")).is_empty());
    }
}
