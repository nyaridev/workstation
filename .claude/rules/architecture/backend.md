---
paths:
  - "src-tauri/**"
---

# Rust backend

- Logic modules (`workstations.rs`, `settings.rs`, `scan/`, `git.rs`, `kit.rs`) never `use tauri`. They take plain
  paths and return `Result<T, String>` or their own error type. Only `lib.rs`, `commands.rs`, `watch.rs`, `window.rs`,
  `update.rs`, `tray.rs` and `start.rs` touch Tauri.
- Tauri plugins (updater, autostart, single-instance) are called from Rust; the window gets no plugin permissions for
  them, only commands. The single-instance plugin is registered first.
- Code that differs per system uses `cfg(target_os = ...)` or `cfg(windows)`, and compiles on Windows, macOS and Linux
  (CI checks all three, ADR-0016). Compare paths with `workstations.rs`'s per-system rule, never by hand.
- The main window is built in `window.rs` with the frame `settings.rs`'s look picks (ADR-0009): `custom` is
  `decorations(false)`, `native` the system frame. Windows come from Rust, never from `tauri.conf.json`.
- `settings.rs` keeps `settings.json` in the app config folder: missing or unreadable gives the defaults, unknown keys
  are dropped, writes go to a temp file renamed over the old one. Every field has a default (`#[serde(default)]`).
- Commands in `commands.rs` stay thin: parse arguments, call one logic function, return its result. No file work in a
  command.
- Every struct the UI sees derives `serde::Serialize` with `#[serde(rename_all = "camelCase")]` and has a matching
  type in `src/lib/types.ts`.
- Run `git` through `std::process::Command` with `CREATE_NO_WINDOW` on Windows, so no console flashes, and
  `GIT_TERMINAL_PROMPT=0`, so git never waits for a password in a console nobody sees, and `GIT_OPTIONAL_LOCKS=0`, so
  reads never lock the index. Each git run costs ~30 ms on Windows: a repo's status is one
  `git status --porcelain=v2 --branch` plus its remote, never a run per number. `git.rs` only reads, except
  `pull`: `git pull --ff-only`, run only from the Pull button, after a `git ls-remote` that must answer within 8 s
  (ADR-0018). Never merge, rebase, reset or check out. The git overview reads in pages (`overview`, then `diffs` and
  `commits` for what's shown), so it never waits on every diff and commit.
- Paths that cross to the UI are relative to the workstation root, with forward slashes and a trailing slash
  (`games/roblox/fish-dive/`), the same form as `projects.json`.
- Tests build fake workstations in a temp folder (`std::env::temp_dir()` plus a unique name) and clean them up.
- `projects.json` follows `docs/projects-json.md`. Writes go through `scan/registry.rs` only: sorted by `path`,
  two-space indent, documented key order, unknown keys kept (`#[serde(flatten)]` map), written to a temp file and
  renamed over the original. Never remove an entry.
- A `projects.json` that doesn't parse is reported with its line and column; never overwrite it.

## How to add a registry field

1. Add the key to `docs/projects-json.md` (Fields table and both templates).
2. Add the field to the entry struct in `scan/registry.rs`, in the documented key order, with a test.
3. Add it to `src/lib/types.ts` and show it in `src/features/projects/`.
4. If agents must fill it, update the workstation's `.claude/rules/registry.md` and `kit/`.

## How to add a command

1. Write the logic as a public function in its logic module, with a test.
2. Add a `#[tauri::command]` in `commands.rs` that calls it, and register it in `lib.rs`'s `generate_handler!`.
3. Add a wrapper in `src/lib/backend.ts` (with fake data for the browser) and its types in `src/lib/types.ts`.
4. If it needs a new plugin permission, add it to `capabilities/default.json`.

## How to add a project kind

1. Add a row to the place table in `scan/layout.rs` (the folder pattern, kind and shape).
2. Add a folder for it to the fake workstation in `scan/`'s test and the expected result.
3. Make the same change in the workstation's `_meta/scripts/scan-projects.ps1` and in `kit/`.
4. If the UI groups by it, add its label in `src/features/projects/`.
