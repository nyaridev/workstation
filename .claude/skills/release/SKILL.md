---
name: release
description: Cut a new Workstation release. Bumps the version, drafts the release notes, runs the checks, builds Workstation.exe, commits "Release <version>" and tags it; pushes and publishes the GitHub release (the exe its only file, which the app's updater downloads) only when the user asks. Use when asked for a new version or release.
argument-hint: <version, e.g. 0.2.0>
---

# Release

Cut Workstation $ARGUMENTS. With no version given, ask for one: minor for new or changed behaviour, patch for fixes.
The app updates itself from these releases (ADR-0007), so their shape matters.

1. **Version**, the same in all three places (`Cargo.lock` follows on the next build):
   - `package.json` (`version`),
   - `src-tauri/Cargo.toml` (`[package] version`: the version the app reports and compares),
   - `src-tauri/tauri.conf.json` (`version`).
2. **Release notes.** Draft them in the scratchpad from `git log v<previous>..HEAD` (the whole log for the first
   release): one sentence on what the version brings, a plain `-` bullet per change a user notices, then
   `Download Workstation.exe and run it; nothing to install. A running copy offers the update in its title bar.` Show
   them to the user.
3. **Checks.** `pnpm check`. Ask the user to go through the sections of `docs/manual-check.md` that the release
   changes, in the built exe.
4. **Build.** `build.bat` makes `release\Workstation.exe`. Close a running Workstation first.
5. **Commit and tag.** Commit only the release's files as `Release <version>`, with a body listing what it brings.
   Tag it: `git tag -a v<version> -m "Workstation <version>"`. No AI attribution.
6. **Push and publish, only when the user asks:**
   - `git push origin main`, then `git push origin v<version>`.
   - `gh release create v<version> release/Workstation.exe -R nyaridev/workstation --verify-tag --title v<version> --notes-file <notes> --latest`.
     Keep the file name exactly `Workstation.exe` and make it the only file. Never mark it a pre-release: the updater
     only offers the latest stable release.
   - `gh release view v<version> -R nyaridev/workstation --json assets --jq ".assets[].digest"` shows a
     `sha256:` digest. The updater refuses a release without one.
   - Until the exe is uploaded, running copies see no update (a release without `Workstation.exe` isn't offered).
