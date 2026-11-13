# ADR-0014: Updates through Tauri's signed updater

**Status:** Accepted
**Date:** 2026-11-13
**Supersedes:** ADR-0007

## Context

ADR-0007 updates the app by downloading `Workstation.exe` through `gh` or Windows' `curl.exe` and swapping the
running exe. It works only for a portable Windows exe; the app now ships installers for Windows, macOS and Linux
(ADR-0016). Scrappy updates through Tauri's updater plugin with signed installers, and shows a banner under the
header.

## Decision

- **Tauri's updater plugin** reads `latest.json` from the latest GitHub release
  (`https://github.com/nyaridev/workstation/releases/latest/download/latest.json`), downloads the installer it names,
  checks its signature against the public key in `tauri.conf.json`, and runs it (Windows: NSIS in passive mode,
  which restarts the app). `requireSignedVersion` is on.
- **The signing key** is made once with `pnpm tauri signer generate`, without a password. Its private half is the
  `TAURI_SIGNING_PRIVATE_KEY` GitHub secret and a file the owner keeps outside the repository. Only the release
  workflow signs (`tauri.updater.conf.json` adds `createUpdaterArtifacts`), so `build.bat` needs no key.
- **When it checks:** at start and every 6 hours while Settings → "Check for updates" is on (on by default, in
  `settings.json`), and on "Check now". A debug build never checks.
- **What the user sees:** the update banner (ADR-0012): both versions, the download's progress or the error, "Update
  and restart" and "Later" (hidden until the next start or a newer version). Settings → About has the same, with
  Check now. It installs only on a click.
- **Rust owns it:** `src-tauri/src/update.rs` keeps the status (`UpdateStatus`) and sends each change as the
  `update-changed` event. The window gets no updater permission; it calls commands.
- These are the app's only network calls, all to its own GitHub releases.

## Options considered

- **Keep ADR-0007 and add macOS and Linux swaps:** three install paths to keep working by hand, unsigned.
- **Check on window focus as well (ADR-0007):** Scrappy's start-and-every-6-hours has been enough.

## Consequences

- **Easier:** one way to update on every system, with signatures.
- **Harder:** losing the private key means old installs can't take new updates; keep the file safe.
- **Rules:** `.claude/rules/architecture/backend.md`, `.claude/rules/architecture/release.md`.
