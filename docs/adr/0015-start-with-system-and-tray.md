# ADR-0015: Start with the system, close to the tray, one copy at a time

**Status:** Accepted
**Date:** 2026-11-13

## Context

Workstation watches workstations for changes, which is most useful while it runs in the background. The owner wants it
to start with Windows (from Settings and from the installer) and to keep running in the tray when its window is closed,
as Scrappy does (Scrappy's ADR-0036, ADR-0038, ADR-0041).

## Decision

- **Start with the system:** a "Start with Windows" switch in Settings → App ("Open at login" on macOS and Linux), saved
  as `startWithSystem` in `settings.json`, off by default. Tauri's autostart plugin does it (the per-user Run key, a
  LaunchAgent, an autostart entry), called from Rust when the setting is saved. Started by the system, the app passes
  `--minimized` and starts hidden in the tray (or minimized when close-to-tray is off). At start, a release build turns
  the entry back on when the setting says so and the system lost it; it never turns it off at start, and debug builds
  leave it alone.
- **The installer's choice:** the Windows installer's Welcome page has "Start Workstation with Windows", checked
  (`src-tauri/windows/hooks.nsh`). It only writes `StartWithSystem` (1 or 0) under `HKCU\Software\com.nyaridev.workstation`;
  the app takes it once at start, saves it as the setting, applies it, and deletes the value. Updates install passively
  and skip the page. Uninstalling removes the start entry.
- **Close to the tray:** a tray icon while the app runs (Tauri's `tray-icon` feature), whose click shows the window and
  whose menu has "Open Workstation" and "Quit Workstation". "Close to tray" in Settings → App, saved as `closeToTray`,
  on by default: closing the window hides it; off, closing quits. Read at each close, so a change applies at once.
- **One copy:** Tauri's single-instance plugin, registered first; a second start brings the window back.
- **Rust owns all of it:** `src-tauri/src/tray.rs` (tray and close), `src-tauri/src/start.rs` (the start entry and the
  installer's choice, with tests for the choice). The window gets no new permissions.

## Options considered

- **Write the Run key ourselves:** Windows only; the plugin covers all three systems.
- **Tray off by default:** closing would quit, but the watcher is the reason to keep it running.

## Consequences

- **Easier:** the app can watch workstations all day without a window open.
- **Harder:** closing no longer quits by default; "Quit Workstation" in the tray does.
- **Rules:** `.claude/rules/architecture/backend.md`, `.claude/rules/architecture/release.md`.
