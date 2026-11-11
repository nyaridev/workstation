# Architecture overview

Rust does every disk read and write; React only shows what Rust sends it and calls commands. A workstation is a root
folder the app remembers; `projects.json` in it is the only project registry (`docs/projects-json.md`). Reasons:
`docs/adr/`.

## Modules

| Module                                | Owns                                                  | May depend on              |
| ------------------------------------- | ----------------------------------------------------- | -------------------------- |
| `src-tauri/src/workstations.rs`       | the user's list of workstations                       | nothing in the app         |
| `src-tauri/src/scan/`                 | finding projects, reading and writing `projects.json` | nothing in the app         |
| `src-tauri/src/git.rs`                | running `git` for status                              | nothing in the app         |
| `src-tauri/src/kit.rs`                | copying the embedded starter kit                      | nothing in the app         |
| `src-tauri/src/update.rs`             | the app's own updates from GitHub releases            | nothing in the app         |
| `src-tauri/src/watch.rs`              | the watcher and `projects-changed`                    | `scan/`, `tauri`           |
| `src-tauri/src/commands.rs`, `lib.rs` | the Tauri surface                                     | the modules above, `tauri` |
| `src/lib/`                            | every `invoke` and `listen`, fake data outside Tauri  | `@tauri-apps/api`          |
| `src/app/`, `src/features/`           | the UI                                                | `src/lib/`                 |

## Where new things go

| New thing                                        | Goes in                                                    |
| ------------------------------------------------ | ---------------------------------------------------------- |
| Anything that touches the disk or runs a program | a Rust logic module, exposed by a command (`backend.md`)   |
| A kind of project or a place rule                | a row in `src-tauri/src/scan/layout.rs` (`backend.md`)     |
| A screen or panel                                | `src/features/<feature>/`, one component per file          |
| A control (button, badge, field, dialog, icon)   | an iro-ui component and `iro-ui/icons` (ADR-0008)          |
| Shared UI pieces built from iro-ui               | `src/components/` once two features need them              |
| Layout and app-only looks                        | `src/styles.css`, with `--iro-*` tokens only               |
| Types shared with Rust                           | `src/lib/types.ts`, matching the Rust struct's serde names |
| A file every new workstation gets                | `kit/`, under its stored name (below)                      |

## The kit

- `kit/` is a generic workstation, built into the exe by `src-tauri/src/kit.rs`. Store its files under neutral names so
  they don't act on this repo: a leading `.` becomes `dot-` (`dot-claude/`, `dot-gitignore`), and `CLAUDE.md` /
  `AGENTS.md` become `CLAUDE.kit.md` / `AGENTS.kit.md`. Never read kit files as rules for this repo.
- Nothing personal in the kit: no drive letters, user folders, real GitHub owners or private projects. Owners stay
  `<placeholders>`. `kit.rs`'s `the_kit_is_safe_to_ship` test checks the common cases.
- The registry format ships from `docs/projects-json.md` (as `_meta/docs/projects-json.md`); don't copy it into `kit/`.

## Rules

- Never delete, move or rename anything inside a workstation. The only writes are adding or editing `projects.json`
  entries and copying kit files that don't exist yet.
- The only network calls are `update.rs`'s, through `gh` or `curl.exe`, to this app's GitHub releases (ADR-0007).
  No HTTP client in the app, no telemetry.
- No paths to anyone's PC in code, config, tests or docs. Tests build fake workstations in a temp folder.
- UI components call `src/lib/backend.ts`, never `invoke` or `listen` directly.
- The UI is iro-ui in the sumi style (ADR-0008): no hand-built controls, no inline `<svg>` icons (the app's mark
  aside), no raw colors or sizes in CSS, no `window.confirm` (use `AlertDialog`). iro-ui comes from a release tag
  (`github:nyaridev/iro-ui#vX.Y.Z`), never a path or a branch.
- Architecture changes need a new ADR in `docs/adr/`, plus an update to `docs/adr/README.md` and these rules.
