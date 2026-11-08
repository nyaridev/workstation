# ADR-0002: Projects come from the disk, PROJECTS.md stays the registry

**Status:** Superseded by ADR-0004
**Date:** 2026-11-08

## Context

A WORKSTATION already has a registry: `PROJECTS.md`, a Markdown table (Project, Path, Kind, Stack, Owner, Status,
Notes) that people and agents keep current. It also has a script, `_meta/scripts/scan-projects.ps1`, that finds
projects by their place (`games/<engine>/<game>/`, `apps/<type>/<name>/`, suites, `external/<owner>/<repo>/`,
`archive/`…) and reports which are unregistered or missing. The app has to list the same projects, notice new ones
as they appear, and never fall out of step with that registry.

## Decision

- **Two sources, merged:**
  - **The disk** says a project exists: its path, kind and shape, found with the same place rules as
    `scan-projects.ps1`, written once as a table in `scan/layout.rs`.
  - **`PROJECTS.md`** gives the name, stack, owner, status and notes, read by `scan/registry.rs`.
  - A project on disk with no row is **unregistered**; a row with no folder is **missing**.
- **`PROJECTS.md` is the only registry.** The app never keeps its own list of projects. Its one write is appending a
  row for an unregistered project (M4), in the table's existing format.
- **Live updates:** `watch.rs` watches the workstation root recursively. It drops events deeper than a project folder
  or inside `node_modules`, `target`, `.git` and similar, waits about 500 ms after the last change, rescans, and emits
  `projects-changed`. A scan only lists folders, so it's cheap; git status is fetched separately (M4).
- **Shared test case:** `scan/` has a test that builds a small fake workstation and checks the result, with the same
  paths as the script's rules, so a change to one side shows up.

## Options considered

- **A JSON registry owned by the app:** a second list that people and agents would have to keep in step with
  `PROJECTS.md`.
- **Run `scan-projects.ps1 -Json` from the app:** needs PowerShell 7, takes seconds because it calls `git` for every
  project, and isn't there in a fresh workstation without the kit.
- **Watch only the category folders, not recursively:** misses projects two levels down (`games/<engine>/<game>/`)
  unless a watcher is added per folder as they appear.

## Consequences

- **Easier:** agents keep editing `PROJECTS.md` as before and the app shows it at once; no migration.
- **Harder:** the place rules live in two languages. A rule change goes into `scan/layout.rs` and `scan-projects.ps1`
  together.
- **Later:** a new kind of project is one row in `scan/layout.rs`; a new registry column is a field in
  `scan/registry.rs` and a column in the list.
- **Rules:** `.claude/rules/architecture/backend.md` (How to add a project kind).
