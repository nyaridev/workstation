---
paths:
  - ".github/**"
  - "src-tauri/tauri*.json"
  - "src-tauri/windows/**"
  - "src-tauri/icons/**"
  - "build.bat"
---

# Builds and releases

- Releases are installers built by `.github/workflows/release.yml` from a `v*` tag, into a draft GitHub release;
  publishing the draft makes it the update (ADR-0014, ADR-0016). No portable exe.
- `tauri.conf.json` is for development: bundling off, no installer hooks. `tauri.release.conf.json` turns bundling on
  (NSIS per user, app and dmg, AppImage and deb) and adds `windows/hooks.nsh`. `tauri.updater.conf.json` adds the
  updater's artifacts and is used only by the release workflow, so local builds need no signing key.
- The updater's public key lives in `tauri.conf.json` (`plugins.updater.pubkey`). The private key is never in the
  repository: it's the `TAURI_SIGNING_PRIVATE_KEY` secret and a file the owner keeps.
- `check.yml` runs `pnpm build` and `pnpm check` on Windows, macOS and Linux. A change that only one system needs
  still has to pass on the other two.
- The installer's hooks only hand choices to the app (a registry value it takes once, ADR-0015); the app owns the
  start entry.
- Icons: change `assets/brand/icon.svg`, then `pnpm tauri icon assets/brand/icon.svg`.
- Creating secrets, pushing tags and publishing releases wait for the owner's yes.
