# ADR-0005: Workstations are added by hand and recognized by projects.json

**Status:** Accepted
**Date:** 2026-11-08
**Supersedes:** the auto-detect and marker parts of ADR-0003, and the marker line of ADR-0004

## Context

ADR-0003 had the app add, on its own, the workstation it was started from (walking up from the exe's folder), and
recognized a workstation by `projects.json` next to `AGENTS.md`. The owner finds a list that only changes when they
change it cleaner and easier to understand, and `projects.json` is the one file the app actually reads.

## Decision

- **No auto-detect.** The list of workstations changes only when the user adds or removes one in the app.
- **A workstation is a folder with a `projects.json` at its top.** `AGENTS.md` and the rest of the layout are for
  agents and people; the app doesn't require them.
- Everything else in ADR-0003 stands: the list lives per Windows user in the app config folder, one workstation is
  open at a time, and the starter kit sets up new ones.

## Options considered

- **Keep auto-detect:** a workstation appears that the user never added, and a portable exe copied into a folder
  changes the list.
- **Keep `AGENTS.md` in the marker:** blocks a folder the app can fully read, for a file the app never uses.

## Consequences

- **Easier:** the list is predictable; the first run always starts on "Add a workstation".
- **Harder:** one extra click the first time, even when the app sits inside a workstation.
- **Later:** if a "found a workstation here, add it?" hint is wanted, it's a suggestion in the UI, never an automatic
  add.
- **Rules:** none changed.
