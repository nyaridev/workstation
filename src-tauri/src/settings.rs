//! Settings: the app's own settings (the look, how the app behaves: updates, starting and closing, and each
//! workstation's list filters) as `settings.json` in the app config folder (ADR-0009, ADR-0014, ADR-0015).
//! Missing fields take their defaults, so older files still load; an unreadable file gives the defaults.

// ── Imports ───────────────────────────────
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

// ── Constants ─────────────────────────────
const FILE_NAME: &str = "settings.json";
const TEMP_NAME: &str = "settings.json.tmp";

// ── Types ─────────────────────────────────
/// Everything the app remembers besides the workstation list.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub look: Look,
    pub preferences: Preferences,
    /// Each workstation's list filters by its root, kept as the window sends them; the window checks them on load.
    pub filters: Map<String, Value>,
    /// The width in px the user dragged each side panel to ("history", "milestones"); absent means the default.
    pub panel_widths: BTreeMap<String, u32>,
}

/// How the window looks.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Look {
    /// The system's own title bar instead of the app's; applies at the next start.
    pub native_frame: bool,
    /// iro-ui's flowing liquid behind the window; the glows stay when it's off.
    pub liquid_background: bool,
}

impl Default for Look {
    fn default() -> Self {
        Self { native_frame: false, liquid_background: true }
    }
}

/// How the app behaves.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Preferences {
    /// Look for a newer release at start and every 6 hours (ADR-0014).
    pub check_for_updates: bool,
    /// Start, minimized, when the user signs in (ADR-0015).
    pub start_with_system: bool,
    /// Closing the window hides it in the tray; Quit is in the tray icon's menu.
    pub close_to_tray: bool,
}

impl Default for Preferences {
    fn default() -> Self {
        Self { check_for_updates: true, start_with_system: false, close_to_tray: true }
    }
}

// ── Private helpers ───────────────────────
// Writes a temp file and renames it over the old one, so a crash never leaves half a file.
fn save(config_dir: &Path, settings: &Settings) -> Result<(), String> {
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    let (path, temp) = (config_dir.join(FILE_NAME), config_dir.join(TEMP_NAME));
    fs::create_dir_all(config_dir)
        .and_then(|()| fs::write(&temp, text + "\n"))
        .and_then(|()| fs::rename(&temp, &path))
        .map_err(|e| format!("Can't save {}: {e}", path.display()))
}

// ── Public API ────────────────────────────
/// The saved settings, or the defaults when there are none yet or the file can't be read.
pub fn load(config_dir: &Path) -> Settings {
    fs::read_to_string(config_dir.join(FILE_NAME))
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

/// Saves a new look and returns the settings.
pub fn set_look(config_dir: &Path, look: Look) -> Result<Settings, String> {
    let settings = Settings { look, ..load(config_dir) };
    save(config_dir, &settings)?;
    Ok(settings)
}

/// Saves new preferences and returns the settings.
pub fn set_preferences(config_dir: &Path, preferences: Preferences) -> Result<Settings, String> {
    let settings = Settings { preferences, ..load(config_dir) };
    save(config_dir, &settings)?;
    Ok(settings)
}

/// Saves one workstation's list filters.
pub fn set_filters(config_dir: &Path, root: &str, filters: Value) -> Result<(), String> {
    let mut settings = load(config_dir);
    settings.filters.insert(root.to_string(), filters);
    save(config_dir, &settings)
}

/// Saves a side panel's width, or forgets it (back to the default) with None.
pub fn set_panel_width(config_dir: &Path, panel: &str, width: Option<u32>) -> Result<(), String> {
    let mut settings = load(config_dir);
    match width {
        Some(width) => settings.panel_widths.insert(panel.to_string(), width),
        None => settings.panel_widths.remove(panel),
    };
    save(config_dir, &settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    #[test]
    fn defaults_when_missing_or_unreadable() {
        let temp = Temp::new();
        assert_eq!(load(&temp.0), Settings::default());
        assert!(load(&temp.0).look.liquid_background);
        let preferences = load(&temp.0).preferences;
        assert!(preferences.check_for_updates, "updates are checked unless turned off");
        assert!(!preferences.start_with_system, "starting with the system is the user's choice");
        assert!(preferences.close_to_tray);
        temp.file(FILE_NAME, "{ not json");
        assert_eq!(load(&temp.0), Settings::default());
    }

    #[test]
    fn missing_fields_take_their_defaults() {
        let temp = Temp::new();
        temp.file(FILE_NAME, r#"{ "look": { "nativeFrame": true } }"#);
        assert_eq!(load(&temp.0).look, Look { native_frame: true, liquid_background: true });
        temp.file(FILE_NAME, r#"{ "preferences": { "checkForUpdates": false } }"#);
        let preferences = load(&temp.0).preferences;
        assert!(!preferences.check_for_updates && !preferences.start_with_system && preferences.close_to_tray);
    }

    #[test]
    fn set_look_saves_and_reloads() {
        let temp = Temp::new();
        let dir = temp.0.join("config");
        let look = Look { native_frame: true, liquid_background: false };
        assert_eq!(set_look(&dir, look.clone()).unwrap().look, look);
        assert_eq!(load(&dir).look, look);
        assert!(!dir.join(TEMP_NAME).exists());
    }

    #[test]
    fn filters_are_kept_per_workstation() {
        let temp = Temp::new();
        let look = Look { native_frame: true, liquid_background: false };
        set_look(&temp.0, look.clone()).unwrap();
        set_filters(&temp.0, "D:/one", serde_json::json!({ "sort": "edited", "tags": ["game"] })).unwrap();
        set_filters(&temp.0, "D:/two", serde_json::json!({ "sort": "name" })).unwrap();
        set_filters(&temp.0, "D:/one", serde_json::json!({ "sort": "name" })).unwrap();
        let saved = load(&temp.0);
        assert_eq!(saved.filters["D:/one"], serde_json::json!({ "sort": "name" }), "the newest replaces the old");
        assert_eq!(saved.filters["D:/two"], serde_json::json!({ "sort": "name" }));
        assert_eq!(saved.look, look, "the rest stays");
    }

    #[test]
    fn panel_widths_are_saved_and_forgotten() {
        let temp = Temp::new();
        set_panel_width(&temp.0, "history", Some(640)).unwrap();
        set_panel_width(&temp.0, "milestones", Some(480)).unwrap();
        set_panel_width(&temp.0, "history", None).unwrap();
        assert_eq!(load(&temp.0).panel_widths, BTreeMap::from([("milestones".to_string(), 480)]));
    }

    #[test]
    fn set_preferences_keeps_the_look() {
        let temp = Temp::new();
        let look = Look { native_frame: true, liquid_background: false };
        set_look(&temp.0, look.clone()).unwrap();
        let preferences = Preferences { check_for_updates: false, start_with_system: true, close_to_tray: false };
        let saved = set_preferences(&temp.0, preferences.clone()).unwrap();
        assert_eq!(saved, load(&temp.0));
        assert_eq!(saved.look, look);
        assert_eq!(saved.preferences, preferences);
    }
}
