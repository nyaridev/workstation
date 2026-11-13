//! Start: starting Workstation, minimized, when the user signs in, through Tauri's autostart plugin (ADR-0015). The
//! preference wins: saving it turns the system's entry on or off, and a release build puts back an entry an upgrade
//! removed. The Windows installer's box sets the preference once, at the next start. Debug builds leave the system and
//! the installer's choice alone, so a dev run never points the entry at `target/debug`.

// ── Imports ───────────────────────────────
use crate::settings::{self, Preferences};
use std::path::Path;
use tauri::plugin::TauriPlugin;
use tauri::{AppHandle, Runtime};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

// ── Constants ─────────────────────────────
/// The argument the system starts Workstation with: open minimized.
pub const MINIMIZED: &str = "--minimized";
/// Where the installer leaves its choice (`windows/hooks.nsh`).
#[cfg(windows)]
const INSTALLER_CHOICE: (&str, &str) = ("Software\\com.nyaridev.workstation", "StartWithSystem");

// ── Types ─────────────────────────────────
/// What to do with the start entry at start.
#[derive(Debug, PartialEq)]
struct Plan {
    /// Whether the entry should be on.
    on: bool,
    /// The installer chose: save `on` as the preference.
    save: bool,
    /// Make the entry match `on`.
    sync: bool,
}

// ── Private helpers ───────────────────────
/// The installer's choice wins once; otherwise only an entry the preference wants is put back, never removed.
fn plan(preference: bool, installer: Option<bool>) -> Plan {
    match installer {
        Some(on) => Plan { on, save: true, sync: true },
        None => Plan { on: preference, save: false, sync: preference },
    }
}

/// The installer's "Start Workstation with Windows" box, when an install left it since the last start: read once, then
/// removed. Always `None` on macOS and Linux.
fn take_installer_choice() -> Option<bool> {
    #[cfg(windows)]
    {
        use winreg::RegKey;
        use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
        let user = RegKey::predef(HKEY_CURRENT_USER);
        let key = user.open_subkey_with_flags(INSTALLER_CHOICE.0, KEY_READ | KEY_WRITE).ok()?;
        let chosen: u32 = key.get_value(INSTALLER_CHOICE.1).ok()?;
        let _ = key.delete_value(INSTALLER_CHOICE.1);
        Some(chosen != 0)
    }
    #[cfg(not(windows))]
    None
}

// ── Public API ────────────────────────────
/// The plugin, starting Workstation with `MINIMIZED`.
pub fn plugin<R: Runtime>() -> TauriPlugin<R> {
    tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec![MINIMIZED]))
}

/// This run was started by the system at sign-in.
pub fn started_minimized() -> bool {
    std::env::args().any(|arg| arg == MINIMIZED)
}

/// Makes the system's entry match `on`.
pub fn sync<R: Runtime>(app: &AppHandle<R>, on: bool) -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Ok(());
    }
    let launcher = app.autolaunch();
    let result = match (on, launcher.is_enabled().unwrap_or(!on)) {
        (true, false) => launcher.enable(),
        (false, true) => launcher.disable(),
        _ => Ok(()),
    };
    let what = if cfg!(windows) { "start with Windows" } else { "open at login" };
    result.map_err(|error| format!("Couldn't change {what}: {error}"))
}

/// At start: takes the installer's box into the preference when an install left one, and makes the entry match it;
/// otherwise turns the entry back on when the preference wants it but the system lost it.
pub fn restore<R: Runtime>(app: &AppHandle<R>, config_dir: &Path) {
    if cfg!(debug_assertions) {
        return;
    }
    let preferences = settings::load(config_dir).preferences;
    let plan = plan(preferences.start_with_system, take_installer_choice());
    if plan.save {
        let _ = settings::set_preferences(config_dir, Preferences { start_with_system: plan.on, ..preferences });
    }
    if plan.sync {
        let _ = sync(app, plan.on);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_installer_choice_wins_once() {
        assert_eq!(plan(false, Some(true)), Plan { on: true, save: true, sync: true });
        assert_eq!(plan(true, Some(false)), Plan { on: false, save: true, sync: true });
    }

    #[test]
    fn without_it_only_a_wanted_entry_is_put_back() {
        assert_eq!(plan(true, None), Plan { on: true, save: false, sync: true });
        assert_eq!(plan(false, None), Plan { on: false, save: false, sync: false });
    }
}
