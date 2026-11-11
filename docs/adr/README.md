# Architecture

Workstation is a desktop app that oversees WORKSTATION folders. Rust does every disk read and write; React only shows
what Rust sends it; a workstation is just a root folder the app remembers, and its `projects.json` is the registry
(format: [`docs/projects-json.md`](../projects-json.md)).

## Shape

```
src-tauri/src/
├─ lib.rs              Tauri setup: plugins, commands, startup
├─ commands.rs         thin commands the UI calls
├─ workstations.rs     the user's list of workstations (add, remove, switch)
├─ scan/               layout.rs (place rules, change filter), registry.rs (read/write projects.json),
│                      stack.rs (stack guess), mod.rs (merge)
├─ watch.rs            debounced watcher → `projects-changed`
├─ git.rs              branch, uncommitted, unpushed, remote owner (the `git` command, 8 repos at a time); one
│                      repo's history (commits, unpushed, uncommitted files). Reads only, never fetches
├─ kit.rs              the embedded starter kit and "set up here" (never overwrites)
├─ update.rs           the app's own updates: check, download, SHA-256, swap the exe (gh or curl.exe)
└─ test_support.rs     temp folders for tests (test builds only)
src/
├─ app/                the window, its title bar, first-run screen, workstation switcher and status banner
├─ features/projects/  project list: filter.ts (filters, nesting, grouping), fields.ts (kinds, statuses, tags), the
│                      list, row (opens to inner projects and FolderRows), filters and TagPicker, Register form,
│                      tag editor and tag input, useProjects
├─ features/history/   a repo's git overview sheet (commits, unpushed, uncommitted files), format.ts
├─ lib/                backend.ts (every invoke/listen), fakeProjects.ts (browser data), types.ts
└─ styles.css          layout only, with iro-ui's tokens (every control is an iro-ui component, ADR-0008)
kit/                   the starter workstation (stored as dot-* and *.kit.md), embedded at build time
scripts/               check-size.mjs
assets/brand/          the README's banners, dark and light
```

## Modules

| Module | Owns | May depend on |
| --- | --- | --- |
| `workstations.rs` | the list file in the app config folder | nothing in the app |
| `scan/` | finding projects, reading and writing `projects.json` | nothing in the app |
| `git.rs` | running `git` for status | nothing in the app |
| `kit.rs` | copying the embedded kit | nothing in the app |
| `update.rs` | the app's own updates from GitHub releases | nothing in the app |
| `watch.rs` | the file watcher and its event | `scan/`, `tauri` |
| `commands.rs`, `lib.rs` | the Tauri surface | every module above, `tauri` |
| `src/lib/` | talking to Rust | `@tauri-apps/api` |
| `src/features/`, `src/app/` | the UI | `src/lib/` |

## Decisions

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-tauri-app-with-rust-core.md) | Tauri app with the logic in Rust | Accepted (UI styling replaced by 0008) |
| [0002](0002-projects-from-disk-and-registry.md) | Projects come from the disk, PROJECTS.md stays the registry | Superseded by 0004 |
| [0003](0003-workstations-and-starter-kit.md) | Several workstations per user, and a starter kit in the exe | Accepted (partly replaced by 0004, 0005) |
| [0004](0004-projects-json-registry.md) | projects.json is the registry | Accepted (marker replaced by 0005, archiving by 0006) |
| [0005](0005-workstations-added-by-hand.md) | Workstations are added by hand and recognized by projects.json | Accepted |
| [0006](0006-archived-projects-leave-the-registry.md) | Archived projects leave projects.json | Accepted |
| [0007](0007-self-update-from-github-releases.md) | Self-update from GitHub releases | Accepted |
| [0008](0008-ui-from-iro-ui.md) | The UI is built from iro-ui | Accepted |

## Milestones

| Milestone | Goal | Status |
| --- | --- | --- |
| M0 | Scaffold, ADRs, rules, size check | done |
| M1 | Workstations: saved list, add, switch, remove, switcher | done |
| M2 | Project list: scan + `projects.json`, grouped list, tag and text filters, flags, open folder | done |
| M3 | Live updates: the watcher | done |
| M4 | Registry writes: the Register button and the tag editor | done |
| M5 | Git status per repo | done |
| M6 | Starter kit and first-run setup | done |
| M7 | Release prep: app icon, README, manual check list, release build | done |
| M8 | Custom title bar | done (real window: `docs/manual-check.md` → 2) |
| M9 | Self-update from GitHub releases | done (real install: `docs/manual-check.md` → 8, after the first release) |
| M10 | Verify and polish, then release | next |

### M8: Custom title bar

1. A frameless main window (`decorations: false`); the window permissions for minimize, maximize, close and dragging.
2. `src/app/TitleBar.tsx`: the mark and name, the workstation switcher and path, a drag area (double-click
   maximizes), a slot for M9's update button, then minimize, maximize/restore and close.
3. The title bar on every screen: loading, first run, and the open workstation.
4. A title bar section in `docs/manual-check.md`.

### M9: Self-update from GitHub releases

ADR-0007. `update.rs` checks the latest release (on start, every 6 hours, on focus at most every 10 minutes) with
`gh` when it's logged in, else `curl.exe`; downloads `Workstation.exe`, checks GitHub's SHA-256, swaps the running exe
and restarts. The title bar's `UpdateChip` offers it; the `release` skill makes releases it can install.

### M10: Verify and polish, then release

1. The owner goes through `docs/manual-check.md` in the real window; fix what it turns up.
2. The owner reviews `kit/` (what it says about Roblox with Rojo, ideas without game-forge, the owners placeholders)
   and the parts left out (ADRs, the migration map, ume).
3. `LICENSE`, chosen by the owner (MIT like PrepKit, or PolyForm Noncommercial like Shiori).
4. With the owner's yes: push, make the repo public, and attach `release\Workstation.exe` to a GitHub release.

### Later

- Editing the other fields of an entry (name, status, description, notes) in the app: today only tags.
- Read the workstation's place rules from a file instead of `scan/layout.rs` if the layout ever differs between
  workstations.
- The kit is a hand-kept generic copy of the author's workspace rules (ADR-0003): when those rules change, update
  `kit/` too.
- "Update this workstation's rules from a newer kit": a compare-and-copy-missing pass in `kit.rs`.

## Rules

In `.claude/rules/architecture/`:

- `overview.md`: the direction, the module table, where new things go. Always loaded.
- `code-organization.md`: file size, section order and dividers for `src/**` and `src-tauri/src/**`.
- `backend.md`: Rust rules and the "How to add" recipes, for `src-tauri/**`.
