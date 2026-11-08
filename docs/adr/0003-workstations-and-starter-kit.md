# ADR-0003: Several workstations per user, and a starter kit in the exe

**Status:** Accepted (the kit's registry file changed by ADR-0004; auto-detect and the marker replaced by ADR-0005)
**Date:** 2026-11-08

## Context

One person may have more than one workstation (work and personal, one per drive), and several people may share a PC,
each with their own. People who download the app usually have no WORKSTATION yet, and should get the same layout and
agent rules the author uses, without cloning anything.

## Decision

- **A workstation is a root folder**, recognized by a `PROJECTS.md` next to an `AGENTS.md`. Nothing about it lives in
  the repo.
- **The list of workstations** (name, root, which one is open) is a JSON file in the app's config folder
  (`%APPDATA%\com.nyaridev.workstation\`). Windows keeps that per user, so people sharing a PC each see their own list.
  `workstations.rs` owns it.
- **Adding one:** pick a folder in the app. When the exe starts from inside a workstation (walking up from its own
  folder), that one is added on its own.
- **Switching** stops the watcher, scans the new root and starts a new watcher. One workstation is open at a time.
- **Starter kit:** the repo's `kit/` holds a generic workstation: the category folders, `AGENTS.md`, `CLAUDE.md`,
  `README.md`, an empty `PROJECTS.md`, `_meta/docs/where-things-go.md`, the category `CLAUDE.md` files,
  `.claude/rules/`, `.claude/skills/`, `_meta/templates/` and `_meta/scripts/`. It's embedded in the exe at build
  time. "Set up a workstation here" copies it into a folder, skips every file that already exists, and adds the
  workstation to the list.
- **The kit is generic:** no owner names, no drive letters, no migration notes. Personal values become placeholders the
  user fills in.

## Options considered

- **One workstation per install:** doesn't cover work and personal, or a shared PC.
- **Clone the repo into the workstation to get the rules:** forces Git and a source build on people who only want the
  app.
- **Make the WORKSTATION root itself the repo:** every project would sit inside one big repo; one `git add .` away from
  committing everything.
- **Download the kit from GitHub at setup:** needs a network and a release process; embedding is one build step.

## Consequences

- **Easier:** download, run, pick an empty folder, done; each person keeps their own list.
- **Harder:** the kit is a generic copy of the author's workspace rules and is kept in sync by hand when those rules
  change.
- **Later:** updating an existing workstation's rules from a newer kit is a "compare and copy missing" pass in
  `kit.rs`; a per-workstation colour or icon is a field in the list file.
- **Rules:** `.claude/rules/architecture/overview.md`, `.claude/rules/architecture/backend.md`.
