# ADR-0007: Self-update from GitHub releases

**Status:** Superseded by ADR-0014
**Date:** 2026-11-08

## Context

Workstation ships as one portable `Workstation.exe` attached to each GitHub release of `nyaridev/workstation`. To
update, people had to notice a release and replace the exe by hand. The repo will be public; until it is, only someone
logged in to GitHub can read it. UmeSync (another of the owner's apps) updates itself, but from a private repo and
through an installer (`gh` downloads it, the installer replaces the app); Workstation has no installer.

## Decision

The app checks for and installs its own updates, in `src-tauri/src/update.rs`:

- **Check** on start, every 6 hours, and when the window comes back into focus (at most every 10 minutes): read the
  latest release of `nyaridev/workstation`. A stable `vX.Y.Z` above the running version shows as a `vX.Y.Z` button in
  the title bar. Pre-releases and drafts are never offered.
- **How it reads GitHub:** with `gh` when it's installed and logged in (`gh api`, `gh release download`: works while
  the repo is private, with the user's own login), else with Windows' own `curl.exe` against the public address. The
  app has no HTTP client of its own.
- **Install, only when clicked and confirmed:** download `Workstation.exe` into the app's config folder (`updates/`),
  check its SHA-256 against the digest GitHub publishes for the file, and refuse it when they differ or GitHub gives
  none. Then rename the running exe to `Workstation.old.exe`, copy the new one in its place, start it, and quit. If the
  copy fails, the old name comes back. The next start removes `Workstation.old.exe` and the downloads.
- **Where it can't install** (a development build, a folder it can't write to, no `gh` and no `curl`), it says why and
  offers the release page.

These are the app's only network calls, all to GitHub, all for its own updates.

## Options considered

- **Tauri's updater plugin:** made for installers (NSIS, MSI), not a portable exe; needs a signing key and signed
  builds, and a manifest the private repo can't serve without a token.
- **UmeSync's way (git tags, `gh` download, installer):** needs `gh` for everyone and an installer the app doesn't
  have.
- **A Rust HTTP client:** works without `curl`, but adds a dependency for what Windows 10 and 11 already ship.
- **A release-page link only:** no network code, but the person still replaces the exe by hand.

## Consequences

- **Easier:** one click to update; works before the repo goes public for anyone with `gh`.
- **Harder:** releases must attach the exe under the exact name `Workstation.exe` (the `release` skill). The exe isn't
  code-signed: trust rests on the GitHub repo and the published digest.
- **Later:** if the exe ever gets an installer or a signature, revisit (the updater plugin, or checking the signature).
- **Rules:** `overview.md` names `update.rs` as the only module that reaches the network.
