//! Update: the app's own updates from GitHub releases through Tauri's updater plugin (ADR-0014). It checks after start
//! and every 6 hours while "Check for updates" is on, and when the user asks; installing runs only on the user's click,
//! checks the signature, and restarts the app. Each change reaches the window as `update-changed`. Debug builds never
//! check.

// ── Imports ───────────────────────────────
use crate::{commands, settings};
use serde::Serialize;
use std::sync::{Mutex, PoisonError};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::{Update, UpdaterExt};

// ── Constants ─────────────────────────────
const EVERY: Duration = Duration::from_secs(6 * 60 * 60);
/// The first check waits for the window to settle.
const FIRST_AFTER: Duration = Duration::from_secs(10);
const EVENT: &str = "update-changed";

// ── Types ─────────────────────────────────
/// What the updater is doing.
#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum UpdateStep {
    Checking,
    Downloading,
    Installing,
}

/// The running version and what GitHub has; the window shows it.
#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    pub current: String,
    /// A newer version, once a check found one.
    pub latest: Option<String>,
    pub step: Option<UpdateStep>,
    /// How much of the update has downloaded, 0 to 1, while it does.
    pub progress: Option<f64>,
    /// Why the last check or install failed.
    pub error: Option<String>,
    /// This build can update itself: a release build. A debug build never checks.
    pub can_update: bool,
    /// When the last check finished, in Unix seconds.
    pub checked_at: Option<i64>,
}

/// What the updater knows: its status, and the update a check found.
pub struct Updates {
    status: Mutex<UpdateStatus>,
    found: Mutex<Option<Update>>,
}

impl Default for Updates {
    fn default() -> Self {
        let status = UpdateStatus {
            current: env!("CARGO_PKG_VERSION").into(),
            latest: None,
            step: None,
            progress: None,
            error: None,
            can_update: !cfg!(debug_assertions),
            checked_at: None,
        };
        Self { status: Mutex::new(status), found: Mutex::new(None) }
    }
}

impl Updates {
    /// The status now.
    pub fn status(&self) -> UpdateStatus {
        self.status.lock().unwrap_or_else(PoisonError::into_inner).clone()
    }
}

// ── Private helpers ───────────────────────
/// Changes the status and tells the window.
fn change(app: &AppHandle, edit: impl FnOnce(&mut UpdateStatus)) {
    let updates = app.state::<Updates>();
    let status = {
        let mut status = updates.status.lock().unwrap_or_else(PoisonError::into_inner);
        edit(&mut status);
        status.clone()
    };
    let _ = app.emit(EVENT, status);
}

async fn ask_github(app: &AppHandle) -> Result<Option<Update>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    updater.check().await.map_err(|e| e.to_string())
}

fn now() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map_or(0, |elapsed| elapsed.as_secs() as i64)
}

fn checks_on(app: &AppHandle) -> bool {
    commands::config_dir(app).is_ok_and(|dir| settings::load(&dir).preferences.check_for_updates)
}

// ── Public API ────────────────────────────
/// Looks for a newer release, unless this build can't update or the updater is busy.
pub async fn check(app: &AppHandle) -> UpdateStatus {
    let status = app.state::<Updates>().status();
    if !status.can_update || status.step.is_some() {
        return status;
    }
    change(app, |status| {
        status.step = Some(UpdateStep::Checking);
        status.error = None;
    });
    let result = ask_github(app).await;
    let latest = result.as_ref().ok().and_then(|found| found.as_ref().map(|update| update.version.clone()));
    if let Ok(found) = &result {
        *app.state::<Updates>().found.lock().unwrap_or_else(PoisonError::into_inner) = found.clone();
    }
    change(app, |status| {
        status.step = None;
        status.checked_at = Some(now());
        match result {
            Ok(_) => status.latest = latest,
            Err(error) => status.error = Some(format!("Couldn't check for updates: {error}")),
        }
    });
    app.state::<Updates>().status()
}

/// Downloads the update a check found, checks its signature and installs it, then starts the new version. On
/// Windows the installer closes the app itself.
pub async fn install(app: &AppHandle) -> Result<(), String> {
    let update = app.state::<Updates>().found.lock().unwrap_or_else(PoisonError::into_inner).clone();
    let update = update.ok_or("Check for updates first.")?;
    change(app, |status| {
        status.step = Some(UpdateStep::Downloading);
        status.progress = Some(0.0);
        status.error = None;
    });
    let (mut done, mut shown) = (0u64, 0u8);
    let result = update
        .download_and_install(
            |chunk, total| {
                done += chunk as u64;
                // One report per percent: chunks come by the thousand.
                let percent = total.map_or(0, |total| (done * 100 / total.max(1)).min(100) as u8);
                if percent > shown {
                    shown = percent;
                    change(app, |status| status.progress = Some(f64::from(percent) / 100.0));
                }
            },
            || change(app, |status| status.step = Some(UpdateStep::Installing)),
        )
        .await;
    match result {
        Ok(()) => app.restart(),
        Err(error) => {
            let message = format!("Couldn't update: {error}");
            change(app, |status| {
                status.step = None;
                status.progress = None;
                status.error = Some(message.clone());
            });
            Err(message)
        }
    }
}

/// Checks after start and every 6 hours while "Check for updates" is on.
pub fn start_checks(app: AppHandle) {
    if cfg!(debug_assertions) {
        return;
    }
    std::thread::spawn(move || {
        std::thread::sleep(FIRST_AFTER);
        loop {
            if checks_on(&app) {
                tauri::async_runtime::block_on(check(&app));
            }
            std::thread::sleep(EVERY);
        }
    });
}
