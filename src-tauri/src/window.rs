//! Window: builds the main window with the frame the look picks (ADR-0009), so it never shows with the wrong one.

// ── Imports ───────────────────────────────
use crate::settings::Look;
use serde::Serialize;
use tauri::{App, WebviewUrl, WebviewWindowBuilder};

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

// ── Public API ────────────────────────────
/// Opens the main window with the frame `look` asks for, and returns that frame.
pub fn open(app: &App, look: &Look) -> tauri::Result<Frame> {
    let frame = if look.native_frame { Frame::Native } else { Frame::Custom };
    WebviewWindowBuilder::new(app, MAIN, WebviewUrl::default())
        .title("Workstation")
        .inner_size(1100.0, 720.0)
        .min_inner_size(760.0, 520.0)
        .center()
        .decorations(frame == Frame::Native)
        .build()?;
    Ok(frame)
}
