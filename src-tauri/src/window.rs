//! Window: builds the main window with the frame the look picks (ADR-0009), so it never shows with the wrong one, and
//! brings it forward from the tray or a second start (ADR-0015).

// ── Imports ───────────────────────────────
use crate::settings::Look;
use serde::Serialize;
use tauri::{App, AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

// ── Constants ─────────────────────────────
const MAIN: &str = "main";

// ── Types ─────────────────────────────────
/// How the window is framed, so the header knows what to draw.
#[derive(Clone, Copy, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Frame {
    /// No system frame: the header is the title bar and draws its own window buttons.
    Custom,
    /// The system's own title bar over a plain header.
    Native,
}

/// How the window first shows.
pub enum Shown {
    Normal,
    Minimized,
    /// Only the tray icon shows.
    Hidden,
}

// ── Public API ────────────────────────────
/// Opens the main window with the frame `look` asks for, shown as `shown` says, and returns that frame.
pub fn open(app: &App, look: &Look, shown: Shown) -> tauri::Result<Frame> {
    let frame = if look.native_frame { Frame::Native } else { Frame::Custom };
    let window = WebviewWindowBuilder::new(app, MAIN, WebviewUrl::default())
        .title("Workstation")
        .inner_size(1100.0, 720.0)
        .min_inner_size(760.0, 520.0)
        .center()
        .decorations(frame == Frame::Native)
        .visible(!matches!(shown, Shown::Hidden))
        .build()?;
    if matches!(shown, Shown::Minimized) {
        window.minimize()?;
    }
    Ok(frame)
}

/// Shows the main window in front: restored, unminimized and focused.
pub fn bring_forward(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN) {
        // Each step is best effort: a window that can't unminimize still gets focus.
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}
