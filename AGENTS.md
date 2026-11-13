# AGENTS.md — Workstation

Guide for AI agents (Claude Code, Cursor, Codex…) working in this repo. In Claude Code, the workspace and category
rules load from the `CLAUDE.md` files above this folder; this file covers only what's specific here.

## What this is

A desktop app (Tauri 2 + Rust + React, with iro-ui) that oversees one or more WORKSTATION folders: it lists every project in them,
compares them with each workstation's `projects.json` (format and entry template: `docs/projects-json.md`), sorts
them by tags, and watches for projects being added, moved or removed. The built app also carries a starter kit that
sets up a new WORKSTATION. Public: github.com/nyaridev/workstation.

Stage: M17 done, not released. The window draws its own title bar and works like Scrappy's, closes to the tray and
can start with the system; installers for Windows, macOS and Linux come from GitHub Actions (ADR-0016). The app lists
a workstation's projects with search, tag, status and "has changes" filters, flags, git badges and "Open folder";
rescans on its own when projects or `projects.json` change; registers unregistered projects and edits tags; sets up
new workstations from the built-in kit (`kit/`). Now: M18 verifies and releases v1.0.0. In `pnpm dev`, `?update`
fakes a newer release, `?empty` shows the first-run screen, `?broken` an unreadable `projects.json` and `?mac` the
macOS frame.

If the user wants a workstation set up rather than the app built ("set up this workstation for me"), don't install
Node or Rust: ask which they mean, recommend the kit, and set it up with `setup-kit.ps1` (`README.md` → "The folder
layout, or the app?"). `setup-kit.ps1` and `kit.rs` write the same files: change both together.
The new workstation's GitHub owners are the user's own, never this repo's `nyaridev`.

## Commands

| Command         | What                                                                                |
| --------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`      | The UI alone in a browser at http://localhost:4420                                  |
| `start-dev.bat` | The real app with hot reload                                                        |
| `pnpm check`    | Size and boundary checks + `tsc` + Biome + Vitest + `cargo test`; must pass before a task is done |
| `build.bat`     | The Windows installer in `release\`; every system's installers come from a `v*` tag |

Before a release, go through `docs/manual-check.md` in the real window: it covers what the tests can't. Releases follow
`.claude/skills/release/SKILL.md` (`/release <version>`): the app updates itself from them (ADR-0014).

## Architecture

Rust does every disk read and write; React only shows what Rust sends it. Read `docs/adr/README.md` first: it has
the layout, the module table and the current milestone's steps.

| Rules                                             | Applies to                   |
| ------------------------------------------------- | ---------------------------- |
| `.claude/rules/architecture/overview.md`          | everything                   |
| `.claude/rules/architecture/code-organization.md` | `src/**`, `src-tauri/src/**` |
| `.claude/rules/architecture/backend.md`           | `src-tauri/**`               |
| `.claude/rules/architecture/frontend.md`          | `src/**`, `index.html`, `vite.config.ts` |
| `.claude/rules/architecture/release.md`           | `.github/**`, `src-tauri/tauri*.json`, `src-tauri/windows/**`, `build.bat` |
