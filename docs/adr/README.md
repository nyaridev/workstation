# Architecture

Workstation is a desktop app that oversees WORKSTATION folders. Rust does every disk read and write; React only shows
what Rust sends it, in an iro-ui window that works like Scrappy's; a workstation is just a root folder the app
remembers, and its `projects.json` is the registry (format: [`docs/projects-json.md`](../projects-json.md)).

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
├─ settings.rs         the app's settings in settings.json: the look (native title bar, liquid background)
├─ window.rs           builds the main window with the frame the settings pick
└─ test_support.rs     temp folders for tests (test builds only)
src/
├─ app/                the window: header (the title bar), views.ts, window controls, backdrop, settings context,
│                      first-run screen, workstation switcher, update chip, status banner
├─ features/projects/  ProjectsView and the project list: filter.ts (filters, nesting, grouping), fields.ts (kinds,
│                      statuses, tags), the list, row (opens to inner projects and FolderRows), filters and
│                      TagPicker, Register form, tag editor and tag input, useProjects
├─ features/history/   a repo's git overview sheet (commits, unpushed, uncommitted files), format.ts
├─ features/settings/  the Settings view: the look switches and the version
├─ lib/                backend.ts (every invoke/listen), fakeProjects.ts (browser data), types.ts
└─ styles.css          layout only, with iro-ui's tokens (every control is an iro-ui component, ADR-0008, ADR-0010)
kit/                   the starter workstation (stored as dot-* and *.kit.md), embedded at build time
scripts/               check-size.mjs, check-boundaries.mjs
assets/brand/          icon.svg (the app icon and header mark), the README's banners, dark and light
```

## Modules

| Module | Owns | May depend on |
| --- | --- | --- |
| `workstations.rs` | the list file in the app config folder | nothing in the app |
| `scan/` | finding projects, reading and writing `projects.json` | nothing in the app |
| `git.rs` | running `git` for status | nothing in the app |
| `kit.rs` | copying the embedded kit | nothing in the app |
| `update.rs` | the app's own updates from GitHub releases | nothing in the app |
| `settings.rs` | the app's settings | nothing in the app |
| `window.rs` | building the main window with its frame | `settings.rs`, `tauri` |
| `watch.rs` | the file watcher and its event | `scan/`, `tauri` |
| `commands.rs`, `lib.rs` | the Tauri surface | every module above, `tauri` |
| `src/lib/` | talking to Rust | `@tauri-apps/*` |
| `src/app/` | the header, views list, backdrop and settings context | `src/lib/`, `iro-ui` |
| `src/features/<view>/` | one view each | `src/lib/`, `iro-ui` |

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
| [0008](0008-ui-from-iro-ui.md) | The UI is built from iro-ui | Accepted (extended by 0010) |
| [0009](0009-window-built-in-rust-with-a-frame-setting.md) | Rust builds the window, and a setting picks its frame | Accepted |
| [0010](0010-scrappy-window-shell.md) | The window's shell works like Scrappy's | Accepted (rows: 0011) |
| [0011](0011-project-rows-from-iro-ui-list-item.md) | Project rows are iro-ui's ListItem, stretched; the Tags filter stays | Accepted |

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
| M10 | Window and settings in Rust, the liquid backdrop (ADR-0009) | done (real window: the owner checks the frame and the liquid) |
| M11 | Scrappy's header, views and the Settings view (ADR-0010) | done (real window: `docs/manual-check.md` → 2) |
| M12 | Every control from iro-ui: rows, tooltips, context menus (ADR-0010, ADR-0011; iro-ui v1.3.0) | done |
| M13 | Verify and polish, then release | next |

### M13: Verify and polish, then release

1. The owner goes through `docs/manual-check.md` in the real window; fix what it turns up.
2. The owner reviews `kit/` (what it says about Roblox with Rojo, ideas without game-forge, the owners placeholders)
   and the parts left out (ADRs, the migration map, ume).
3. `LICENSE`, chosen by the owner (MIT like PrepKit, or PolyForm Noncommercial like Shiori).
4. With the owner's yes: push, make the repo public, and attach `release\Workstation.exe` to a GitHub release.

### Later

- The header's path disappears below about 900 px wide: the switcher's buttons take the room. A narrower switcher
  (its actions in a menu) would keep it.

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
- `frontend.md`: the window (iro-ui, header and frame, desktop behavior) and its "How to add" recipes, for `src/**`.
