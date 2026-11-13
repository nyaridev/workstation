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
    /// No system frame: the header is the title bar and draws its own window buttons (Windows, Linux).
    Custom,
    /// The system's window buttons over the header's left end; the header is the title bar (macOS).
    Overlay,
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

// ── Private helpers ───────────────────────
/// The frame for `os`: the system's own when the look asks for it, else overlay on macOS and custom elsewhere.
fn frame_for(os: &str, native_frame: bool) -> Frame {
    match (native_frame, os) {
        (true, _) => Frame::Native,
        (false, "macos") => Frame::Overlay,
        _ => Frame::Custom,
    }
}

// ── Public API ────────────────────────────
/// Opens the main window with the frame `look` asks for, shown as `shown` says, and returns that frame.
pub fn open(app: &App, look: &Look, shown: Shown) -> tauri::Result<Frame> {
    let frame = frame_for(std::env::consts::OS, look.native_frame);
    let builder = WebviewWindowBuilder::new(app, MAIN, WebviewUrl::default())
        .title("Workstation")
        .inner_size(1200.0, 780.0)
        .min_inner_size(820.0, 560.0)
        .center()
        .decorations(frame != Frame::Custom)
        .visible(!matches!(shown, Shown::Hidden));
    #[cfg(target_os = "macos")]
    let builder = match frame {
        Frame::Overlay => builder.title_bar_style(tauri::TitleBarStyle::Overlay).hidden_title(true),
        _ => builder,
    };
    let window = builder.build()?;
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picks_the_frame_per_system() {
        assert_eq!(frame_for("windows", false), Frame::Custom);
        assert_eq!(frame_for("linux", false), Frame::Custom);
        assert_eq!(frame_for("macos", false), Frame::Overlay);
        for os in ["windows", "linux", "macos"] {
            assert_eq!(frame_for(os, true), Frame::Native, "the system title bar wins everywhere");
        }
    }
}
