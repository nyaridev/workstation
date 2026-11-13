# ADR-0016: Installers for Windows, macOS and Linux, built by GitHub Actions

**Status:** Accepted
**Date:** 2026-11-13
**Supersedes:** ADR-0001's "portable `Workstation.exe`, no installer" (the rest of ADR-0001 stands)

## Context

ADR-0001 built one portable `Workstation.exe` with `build.bat`, for Windows only. The owner wants the app on Windows,
macOS and Linux, built and checked automatically, as Scrappy is (Scrappy's ADR-0014). Starting with the system and the
updater (ADR-0014, ADR-0015) also want a real install.

## Decision

- **Installers:** NSIS for Windows (per user), an app and disk image for macOS (universal), an AppImage and a `.deb`
  for Linux. `src-tauri/tauri.release.conf.json` turns bundling on; `tauri.conf.json` keeps it off for development.
  The portable exe is gone.
- **GitHub Actions:**
  - `.github/workflows/check.yml`: `pnpm build` and `pnpm check` on Windows, macOS and Linux for every push to `main`
    and every pull request.
  - `.github/workflows/release.yml`: a `v*` tag builds the signed installers and `latest.json` with `tauri-action` into
    a draft release; publishing the draft makes it the update (ADR-0014).
- **`build.bat`** builds the Windows installer into `release\` for a local try; releases come from the workflow.
- **The code works on all three:** paths compare by each system's rules (ignoring case on Windows and macOS, not on
  Linux; `\` and `/` alike on Windows only); macOS gets Scrappy's `overlay` frame (its own window buttons over the
  header's left end); `git` runs without a console window only on Windows. `src-tauri/icons/` holds every platform's
  icons, made by `pnpm tauri icon assets/brand/icon.svg`.
- **Out of scope:** the kit's contents and `setup-kit.ps1` stay Windows-flavored for now.

## Options considered

- **Keep the portable exe beside the installers:** a second Windows build the updater can't update.
- **Build on the owner's PC only:** no macOS or Linux builds without their machines.

## Consequences

- **Easier:** a tag makes every system's installers; each push is checked on all three.
- **Harder:** releases wait on CI (about 15 minutes); macOS builds are unsigned by Apple, so the first open needs
  right-click → Open.
- **Later:** Apple signing and notarization when there's a developer account.
- **Rules:** `.claude/rules/architecture/release.md`.
