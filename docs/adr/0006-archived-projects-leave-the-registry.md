# ADR-0006: Archived projects leave projects.json

**Status:** Accepted
**Date:** 2026-11-08
**Supersedes:** the "never remove an entry when archiving" rule of ADR-0004

## Context

ADR-0004 kept an archived project's entry, with its new `archive/` path and status `archived`. In practice `archive/`
also collects leftovers that were never projects (an app's old sample files), and each one showed up flagged as "not
in projects.json". The owner wants `projects.json` to list only active work.

## Decision

- **Archived projects have no entry.** Archiving removes it; promoting a project back out of `archive/` adds a new one.
  `archived` is no longer a status.
- **The app still lists `archive/`** in its Archive group, but never flags a folder there for having no entry. An entry
  that points into `archive/` (or still says `archived`) is flagged "archived: remove from projects.json".
- **The app refuses to register** anything under `archive/`. It still never removes an entry itself: removing is the
  archive skill's job.

## Options considered

- **Keep archived entries (ADR-0004):** every leftover under `archive/` needs a made-up entry to stop being flagged.
- **Don't scan `archive/` at all:** simpler, but archived work disappears from the app.

## Consequences

- **Easier:** `projects.json` is the list of live work; nothing to keep in step when archiving.
- **Harder:** an archived project's description and tags are gone with its entry; its own README has to say what it was.
- **Rules:** the workstation's `.claude/rules/registry.md`, the archive and promote skills, `archive/CLAUDE.md` and
  `scan-projects.ps1`, in the workspace and in `kit/`.
