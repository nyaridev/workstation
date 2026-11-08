# AGENTS.md — Workstation

Guide for AI agents (Claude Code, Cursor, Codex…) working in this repo. In Claude Code, the workspace and category
rules load from the `CLAUDE.md` files above this folder; this file covers only what's specific here.

## What this is

A desktop app (Tauri 2 + Rust + React) that oversees one or more WORKSTATION folders: it lists every project in them,
compares them with each workstation's `PROJECTS.md`, and watches for projects being added, moved or removed. The
built app also carries a starter kit that sets up a new WORKSTATION. Public later: github.com/nyaridev/workstation.

Stage: M0 (scaffold). The app opens a placeholder window; nothing is scanned yet.

## Commands

| Command         | What                                               |
| --------------- | -------------------------------------------------- |
| `pnpm dev`      | The UI alone in a browser at http://localhost:4420 |
| `start-dev.bat` | The real app with hot reload                       |
| `pnpm check`    | `tsc` + Biome + Vitest + `cargo test`              |
| `build.bat`     | Portable `release\Workstation.exe`                 |

## Layout

| Path         | What                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| `src-tauri/` | The Rust side: Tauri setup in `src/lib.rs`, window config in `tauri.conf.json` |
| `src/`       | The React UI                                                                   |

## Rules

1. **No paths to anyone's PC** in code, config or docs. A workstation's root is found or picked at run time.
2. **Never delete or move anything** inside a workstation. The app reads the disk; its only write is adding rows to
   `PROJECTS.md` (from M2), and the kit setup never overwrites existing files.
