# ADR-0001: Tauri app with the logic in Rust

**Status:** Accepted
**Date:** 2026-11-08

## Context

Workstation oversees a WORKSTATION folder: it lists every project, compares them with `PROJECTS.md` and updates live.
It's for its author first, then for anyone who downloads it, so it must be a light Windows app that runs without
Node or Rust installed. Its work is mostly file-system work: walking folders, reading a Markdown table, watching for
changes, running `git`. The sister app PrepKit already ships as a portable Tauri exe with a Rust core.

## Decision

- **Shell:** Tauri 2, built with `--no-bundle` into one portable `Workstation.exe` (`build.bat`). No installer for now.
- **Rust owns every disk read and write.** The React UI only shows state and calls commands; it never reads files.
- **One crate** (`src-tauri/`). The logic modules (`workstations`, `scan/`, `git`, `kit`) never `use tauri`; only
  `lib.rs`, `commands.rs` and `watch.rs` (which emits events) touch it. That keeps the logic testable with
  `cargo test` and lets it move into a `crates/` core when a CLI is wanted.
- **UI:** React 19, Vite, TypeScript, Tailwind 4, Biome, Vitest (the house stack). `src/lib/backend.ts` wraps every
  `invoke` and `listen`, with fake data when there's no Tauri, so `pnpm dev` works in a browser.
- **Dev port** 4420.

## Options considered

- **Hono server + browser UI (Shiori, BlomboUI):** a server process for a single-window app, and no native folder
  picker or watcher without extra work.
- **Cargo workspace with `crates/workstation-core` now (PrepKit):** worth it only once a CLI exists. The "no `tauri` in
  logic modules" rule keeps that move cheap.
- **Electron:** a much bigger exe for the same result.

## Consequences

- **Easier:** a small exe others can just run; logic tested without a window; the UI built in a browser.
- **Harder:** building from source needs Rust; every new capability needs a command in Rust plus a wrapper in
  `backend.ts`.
- **Later:** a CLI for agents (`workstation scan --json`) moves the logic modules into `crates/` and adds a binary; a
  tray icon goes in `lib.rs`.
- **Rules:** `.claude/rules/architecture/overview.md`, `.claude/rules/architecture/backend.md`.
