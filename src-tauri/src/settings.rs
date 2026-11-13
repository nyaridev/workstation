//! Settings: the app's own settings (the look) as `settings.json` in the app config folder (ADR-0009).
//! Missing fields take their defaults, so older files still load; an unreadable file gives the defaults.

// ── Imports ───────────────────────────────
use serde::{Deserialize, Serialize};
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::Temp;

    #[test]
    fn defaults_when_missing_or_unreadable() {
        let temp = Temp::new();
        assert_eq!(load(&temp.0), Settings::default());
        assert!(load(&temp.0).look.liquid_background);
        temp.file(FILE_NAME, "{ not json");
        assert_eq!(load(&temp.0), Settings::default());
    }

    #[test]
    fn missing_fields_take_their_defaults() {
        let temp = Temp::new();
        temp.file(FILE_NAME, r#"{ "look": { "nativeFrame": true } }"#);
        assert_eq!(load(&temp.0).look, Look { native_frame: true, liquid_background: true });
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
}
