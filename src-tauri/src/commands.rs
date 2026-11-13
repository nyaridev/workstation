//! Commands: the thin Tauri commands the UI calls; each one calls a single logic function.
//! Sync commands run on the main thread one at a time, so load-change-save never races.

// ── Imports ───────────────────────────────
use crate::git;
use crate::kit;
use crate::scan::{self, Entry, Scan};
use crate::settings::{self, Look, Settings};
use crate::update::{self, Release};
use crate::watch;
use crate::window::Frame;
use crate::workstations::{self, Listing};
use serde::Serialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_opener::OpenerExt;

// ── Constants ─────────────────────────────
/// The running app's version (kept equal in Cargo.toml, tauri.conf.json and package.json by the `release` skill).
const VERSION: &str = env!("CARGO_PKG_VERSION");
/// How many commits the git overview shows.
const HISTORY_LIMIT: usize = 200;

// ── Types ─────────────────────────────────
/// The running version, and the newest release when it's newer.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheck {
    current: &'static str,
    latest: Option<Release>,
}

/// The running version, and the frame the window got at start.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    version: &'static str,
    frame: Frame,
}

/// The result of setting up a workstation: the updated list, and how many kit files were written or already there.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupResult {
    listing: Listing,
    written: usize,
    skipped: usize,
}

// ── Private helpers ───────────────────────
/// The app config folder, where the workstation list and settings live.
pub fn config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_config_dir().map_err(|e| format!("No config folder: {e}"))
}

/// Where downloaded updates wait until the next start removes them.
pub fn updates_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(config_dir(app)?.join("updates"))
}

// Points the watcher at the open workstation (if it's reachable) after the list was read or changed.
// A watcher that can't start only stops live updates, so the list is returned either way.
fn follow_open(app: &AppHandle, listing: Listing) -> Listing {
    let open = listing.workstations.iter().find(|w| w.available && Some(&w.root) == listing.open.as_ref());
    let _ = watch::follow(app, open.map(|w| w.root.as_path()));
    listing
}

// ── App ───────────────────────────────────
/// The running version and the window's frame.
#[tauri::command]
pub fn app_info(frame: State<Frame>) -> AppInfo {
    AppInfo { version: VERSION, frame: *frame }
}

/// The saved settings, or the defaults.
#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<Settings, String> {
    Ok(settings::load(&config_dir(&app)?))
}

/// Saves a new look and returns the settings; the frame applies at the next start.
#[tauri::command]
pub fn set_look(app: AppHandle, look: Look) -> Result<Settings, String> {
    settings::set_look(&config_dir(&app)?, look)
}

// ── Workstations ──────────────────────────
/// The saved workstations and which one is open; starts watching the open one.
#[tauri::command]
pub fn list_workstations(app: AppHandle) -> Result<Listing, String> {
    Ok(follow_open(&app, workstations::list(&config_dir(&app)?)?))
}

/// Adds a workstation root and opens it.
#[tauri::command]
pub fn add_workstation(app: AppHandle, root: String) -> Result<Listing, String> {
    Ok(follow_open(&app, workstations::add(&config_dir(&app)?, Path::new(&root))?))
}

/// Writes the starter kit into a folder (never overwriting a file), then adds it as a workstation and opens it.
#[tauri::command]
pub fn setup_workstation(app: AppHandle, root: String) -> Result<SetupResult, String> {
    let report = kit::setup(Path::new(&root))?;
    let listing = follow_open(&app, workstations::add(&config_dir(&app)?, Path::new(&root))?);
    Ok(SetupResult { listing, written: report.written.len(), skipped: report.skipped.len() })
}

/// Forgets a workstation; its folder is untouched.
#[tauri::command]
pub fn remove_workstation(app: AppHandle, root: String) -> Result<Listing, String> {
    Ok(follow_open(&app, workstations::remove(&config_dir(&app)?, Path::new(&root))?))
}

/// Switches to another listed workstation.
#[tauri::command]
pub fn open_workstation(app: AppHandle, root: String) -> Result<Listing, String> {
    Ok(follow_open(&app, workstations::open(&config_dir(&app)?, Path::new(&root))?))
}

// ── Projects ──────────────────────────────
/// Every project of the workstation at `root`, merged from the disk and `projects.json`.
#[tauri::command]
pub fn scan_workstation(root: String) -> Scan {
    scan::scan(Path::new(&root))
}

/// Git status of every repo among `paths` (project paths in the workstation at `root`). Runs off the main thread,
/// since it starts a few git processes per repo.
#[tauri::command]
pub async fn git_status(root: String, paths: Vec<String>) -> Result<HashMap<String, git::Status>, String> {
    let root = PathBuf::from(root);
    let folders = paths.into_iter().filter_map(|path| Some((path.clone(), scan::folder(&root, &path).ok()?))).collect();
    tauri::async_runtime::spawn_blocking(move || git::statuses(folders)).await.map_err(|e| e.to_string())
}

/// The git overview of the repo at `path` (a project, or a repo folder inside one): branch, upstream, uncommitted
/// files and the latest commits. Reads only; runs off the main thread.
#[tauri::command]
pub async fn git_history(root: String, path: String) -> Result<git::History, String> {
    let folder = scan::folder(Path::new(&root), &path)?;
    tauri::async_runtime::spawn_blocking(move || {
        let repo = git::repo_dir(&folder).ok_or("This folder isn't a git repo.")?;
        git::history(&repo, HISTORY_LIMIT).ok_or_else(|| "git couldn't read this repo. Is git installed?".to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

/// A guess at a project's stack from its files, for the Register form.
#[tauri::command]
pub fn guess_stack(root: String, path: String) -> Result<Vec<String>, String> {
    scan::guess_stack(Path::new(&root), &path)
}

/// Adds a `projects.json` entry for an unregistered project; the watcher's rescan shows it.
#[tauri::command]
pub fn register_project(root: String, entry: Entry) -> Result<(), String> {
    scan::register(Path::new(&root), entry)
}

/// Replaces a project's tags in `projects.json`.
#[tauri::command]
pub fn set_tags(root: String, path: String, tags: Vec<String>) -> Result<(), String> {
    scan::set_tags(Path::new(&root), &path, tags)
}

/// Opens a project folder in the file explorer. Only folders inside the workstation are opened.
#[tauri::command]
pub fn open_folder(app: AppHandle, root: String, path: String) -> Result<(), String> {
    let folder = scan::folder(Path::new(&root), &path)?;
    app.opener().open_path(folder.to_string_lossy(), None::<&str>).map_err(|e| e.to_string())
}

// ── Updates ───────────────────────────────
/// The running version and the newest release when it's newer. Runs off the main thread: it asks GitHub.
#[tauri::command]
pub async fn check_update() -> Result<UpdateCheck, String> {
    let latest = tauri::async_runtime::spawn_blocking(|| update::check(VERSION)).await.map_err(|e| e.to_string())??;
    Ok(UpdateCheck { current: VERSION, latest })
}

/// Installs `version` in place of the running exe, starts it and quits. A development build only says it can't.
#[tauri::command]
pub async fn install_update(app: AppHandle, version: String) -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Err("This is a development build, so it doesn't replace itself.".to_string());
    }
    let exe = std::env::current_exe().map_err(|e| format!("Can't find the running exe: {e}"))?;
    let dir = updates_dir(&app)?;
    tauri::async_runtime::spawn_blocking(move || update::install(&version, VERSION, &exe, &dir))
        .await
        .map_err(|e| e.to_string())??;
    app.exit(0);
    Ok(())
}

/// Opens one of this app's release pages in the browser; any other address is refused.
#[tauri::command]
pub fn open_release_page(app: AppHandle, url: String) -> Result<(), String> {
    if !url.starts_with(update::RELEASE_PAGES) {
        return Err(format!("{url} isn't a Workstation release page."));
    }
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}
