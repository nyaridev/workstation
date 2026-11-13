# ADR-0009: Rust builds the window, and a setting picks its frame

**Status:** Accepted
**Date:** 2026-11-12

## Context

M8 made the window frameless with `decorations: false` in `tauri.conf.json`. There is no way back to the system title
bar when the custom one misbehaves on a machine (a remote desktop, a scaled screen), and the app keeps no settings of
its own. Scrappy, the owner's other desktop app, builds its window in Rust and lets Settings → "Use the system title
bar" turn the frame back on (Scrappy's ADR-0011). The owner wants Workstation's window to behave the same way, with
Scrappy's background effect, which also needs a setting.

## Decision

- **Rust builds the main window** in `src-tauri/src/window.rs`, with the frame picked before it first shows. The
  window leaves `tauri.conf.json`.
- **Two frames:** `custom` (no system frame: the header is the title bar and draws minimize, maximize/restore and
  close) and `native` (the system's own title bar over a plain header). Workstation ships for Windows only, so there
  is no macOS `overlay`. `AppInfo.frame`, from the `app_info` command, tells the header which one it got.
- **Settings live in Rust:** `src-tauri/src/settings.rs` reads and writes `settings.json` in the app config folder,
  next to `workstations.json`. The first group is the look: `nativeFrame` (off) and `liquidBackground` (on). A
  missing or unreadable file gives the defaults; a write goes to a temp file renamed over the old one.
- **The frame applies on the next start:** the window is built once. The Settings view says so beside the switch.
- **Window permissions** stay as M8 set them: `start-dragging`, `internal-toggle-maximize`, `minimize`,
  `toggle-maximize`, `close`.

## Options considered

- **Keep `tauri.conf.json`:** the native fallback would have to put the frame back after start, with a flicker.
- **Settings in `workstations.json`:** one file for two jobs; the list's loader would have to keep keys it doesn't own.
- **Settings in the browser's `localStorage`:** Rust builds the window before the page loads, so it can't read them.

## Consequences

- **Easier:** the header and the frame always agree, because both follow `AppInfo.frame`. A new setting is a field in
  `settings.rs` and a row in the Settings view.
- **Harder:** switching the frame needs a restart. Hovering maximize doesn't open Windows 11 snap layouts.
- **Later:** a theme or accent setting is a field in the look group, passed to `IroRoot`; a macOS build adds
  `overlay` to `window.rs`, as Scrappy does.
- **Rules:** `.claude/rules/architecture/backend.md`, `.claude/rules/architecture/frontend.md`.
