//! Tray: Workstation's icon while it runs, with a menu to open or quit it, and closing the window into it while
//! "Close to tray" is on (ADR-0015).

// ── Imports ───────────────────────────────
use crate::{commands, settings, window};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, AppHandle, Manager, Window, WindowEvent};

// ── Constants ─────────────────────────────
const OPEN: &str = "open";
const QUIT: &str = "quit";

// ── Public API ────────────────────────────
/// Whether closing the window hides it instead of quitting; read each time, so a change in Settings applies at once.
pub fn closes_to_tray(app: &AppHandle) -> bool {
    commands::config_dir(app).map_or(true, |dir| settings::load(&dir).preferences.close_to_tray)
}

/// Adds the tray icon: a click shows the window, and its menu opens or quits Workstation.
pub fn add(app: &App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, OPEN, "Open Workstation", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, QUIT, "Quit Workstation", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &quit])?;
    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("Workstation")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            OPEN => window::bring_forward(app),
            QUIT => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                window::bring_forward(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}

/// Hides the window when it's closed while "Close to tray" is on; Workstation keeps running.
pub fn on_window_event(window: &Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event
        && closes_to_tray(window.app_handle())
    {
        api.prevent_close();
        let _ = window.hide();
    }
}
