# ADR-0004: projects.json is the registry

**Status:** Accepted (the workstation marker replaced by ADR-0005, archived entries by ADR-0006)
**Date:** 2026-11-08
**Supersedes:** ADR-0002

## Context

ADR-0002 kept `PROJECTS.md` (a Markdown table) as the registry. The owner wants to sort and filter projects by tags
in the app, and give each project a short description. A Markdown table has no good place for a list of tags, and
the app would have to parse and patch a table that people also edit by hand. The workstation's agents and skills
handle JSON as easily as Markdown.

## Decision

- **`projects.json` at the workstation root is the only registry.** Format, template and tag list:
  `docs/projects-json.md`. `PROJECTS.md` is retired.
- **Two sources, merged, as before:** the disk says a project exists (place rules in `scan/layout.rs`, the same as
  `scan-projects.ps1`); `projects.json` gives its name, stack, owner, status, description, tags and notes. A project on
  disk with no entry is **unregistered**; an entry with no folder is **missing**.
- **Writing:** the app reads the whole file, changes entries, and writes it back sorted by `path`, two-space indent,
  keys in the documented order, through a temp file and a rename so a crash never leaves half a file. Keys it doesn't
  know are kept. It never removes an entry.
- **Tags** are free lowercase kebab-case strings; the app offers the tags already in use. The project list filters
  and groups by tag (M2); the Register button and a tag editor write entries (M4).
- **Workstation marker** (changes ADR-0003): a root is a folder with `projects.json` next to `AGENTS.md`.
- **Live updates** stay as ADR-0002 described: debounced recursive watcher, `projects-changed` event, git separately.

## Options considered

- **Keep `PROJECTS.md` and add a Tags column:** a comma list in a table cell, and every app write is a text patch.
- **`projects.json` beside `PROJECTS.md`, both by hand:** two files to keep in step on every change.
- **`projects.json` plus a generated `PROJECTS.md`:** a second file nobody may edit, for a view the app already gives.
- **A tag file inside each project:** spreads the registry over every folder, and plain folders get noise.

## Consequences

- **Easier:** tags and descriptions are real fields; the app reads and writes with `serde_json`; agents validate
  with one parse.
- **Harder:** a hand edit with a JSON syntax error breaks the file for the app and the scan script until it's fixed;
  both report the parse error with its line instead of guessing.
- **Later:** a new field is a key in `docs/projects-json.md`, a field in `scan/registry.rs` and in `src/lib/types.ts`;
  a fixed tag vocabulary would be a `tags` map at the top of the file.
- **Rules:** `.claude/rules/architecture/overview.md`, `.claude/rules/architecture/backend.md`.
