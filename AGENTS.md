# AGENTS.md — Workstation

Guide for AI agents (Claude Code, Cursor, Codex…) working in this repo. In Claude Code, the workspace and category
rules load from the `CLAUDE.md` files above this folder; this file covers only what's specific here.

## What this is

A desktop app (Tauri 2 + Rust + React) that oversees one or more WORKSTATION folders: it lists every project in them,
compares them with each workstation's `projects.json` (format and entry template: `docs/projects-json.md`), sorts
them by tags, and watches for projects being added, moved or removed. The built app also carries a starter kit that
sets up a new WORKSTATION. Public later: github.com/nyaridev/workstation.

Stage: M8 done, not released. The window draws its own title bar (no Windows frame). The app lists a workstation's projects with search, tag, status and "has changes"
filters, flags, git badges and "Open folder"; rescans on its own when projects or `projects.json` change; registers
unregistered projects and edits tags; sets up new workstations from the built-in kit (`kit/`). Next: M9 (self-update),
then M10 (verify, polish, release). In `pnpm dev`, `?empty` shows the first-run screen and `?broken` an unreadable `projects.json`.

## Commands

| Command         | What                                                                                |
| --------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`      | The UI alone in a browser at http://localhost:4420                                  |
| `start-dev.bat` | The real app with hot reload                                                        |
| `pnpm check`    | Size check + `tsc` + Biome + Vitest + `cargo test`; must pass before a task is done |
| `build.bat`     | Portable `release\Workstation.exe`                                                  |

Before a release, go through `docs/manual-check.md` in the real window: it covers what the tests can't.

## Architecture

Rust does every disk read and write; React only shows what Rust sends it. Read `docs/adr/README.md` first: it has
the layout, the module table and the current milestone's steps.

| Rules                                             | Applies to                   |
| ------------------------------------------------- | ---------------------------- |
| `.claude/rules/architecture/overview.md`          | everything                   |
| `.claude/rules/architecture/code-organization.md` | `src/**`, `src-tauri/src/**` |
| `.claude/rules/architecture/backend.md`           | `src-tauri/**`               |
