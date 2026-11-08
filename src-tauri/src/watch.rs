//! Watch: watches the open workstation and emits `projects-changed` (with its root) after changes settle.
//! One watcher at a time, kept in Tauri state; replacing it stops the old one.

// ── Imports ───────────────────────────────
use crate::scan;
use notify_debouncer_full::notify::event::ModifyKind;
use notify_debouncer_full::notify::{Config, EventKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{DebounceEventResult, Debouncer, NoCache, new_debouncer_opt};
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

// ── Constants ─────────────────────────────
/// How long changes must settle before the list rescans.
const SETTLE: Duration = Duration::from_millis(500);
/// The event the UI listens for; its payload is the workstation root.
pub const EVENT: &str = "projects-changed";

// ── Types ─────────────────────────────────
// No file-ID cache: on Windows the default one walks the whole workstation (every node_modules) at start.
type Running = Debouncer<RecommendedWatcher, NoCache>;

/// The running watcher, if any.
#[derive(Default)]
pub struct Watcher(Mutex<Option<Running>>);

// ── Private helpers ───────────────────────
// Watches `root` and calls `on_change` once per settled batch of changes that can alter the project list.
fn start(root: &Path, on_change: impl Fn() + Send + 'static) -> Result<Running, String> {
    let watched = root.to_path_buf();
    let handler = move |result: DebounceEventResult| {
        let Ok(events) = result else { return };
        let counts = events.iter().any(|event| {
            let structural =
                matches!(event.kind, EventKind::Create(_) | EventKind::Remove(_) | EventKind::Modify(ModifyKind::Name(_)));
            event.paths.iter().any(|path| scan::affects_projects(&watched, path, structural))
        });
        if counts {
            on_change();
        }
    };
    let mut debouncer = new_debouncer_opt(SETTLE, None, handler, NoCache, Config::default())
        .map_err(|e| format!("Can't watch for changes: {e}"))?;
    debouncer
        .watch(root, RecursiveMode::Recursive)
        .map_err(|e| format!("Can't watch {}: {e}", root.display()))?;
    Ok(debouncer)
}

// ── Public API ────────────────────────────
/// Watches `root` instead of the previous workstation; `None` stops watching.
pub fn follow(app: &AppHandle, root: Option<&Path>) -> Result<(), String> {
    let state = app.state::<Watcher>();
    let mut slot = state.0.lock().map_err(|e| e.to_string())?;
    *slot = None;
    let Some(root) = root else { return Ok(()) };

    let handle = app.clone();
    let payload = root.to_string_lossy().into_owned();
    // Nobody listening (the window is closing) is not an error worth reporting.
    *slot = Some(start(root, move || drop(handle.emit(EVENT, &payload)))?);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;
    use std::sync::mpsc;

    const WAIT: Duration = Duration::from_secs(3);

    #[test]
    fn reports_new_projects_but_not_work_inside_them() {
        let temp = Temp::new();
        temp.dir("games/roblox/fish-dive");
        let (sender, changes) = mpsc::channel();
        let _watcher = start(&temp.0, move || sender.send(()).unwrap()).unwrap();

        temp.file("games/roblox/fish-dive/game/src/main.lua", "print('hi')");
        temp.dir("games/roblox/fish-dive/node_modules/pkg");
        assert!(changes.recv_timeout(SETTLE * 3).is_err(), "work inside a project triggered a rescan");

        temp.dir("games/roblox/sky-race");
        assert!(changes.recv_timeout(WAIT).is_ok(), "a new game didn't trigger a rescan");

        temp.file("projects.json", "{}");
        assert!(changes.recv_timeout(WAIT).is_ok(), "editing projects.json didn't trigger a rescan");
    }
}
