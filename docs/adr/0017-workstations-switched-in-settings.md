# ADR-0017: Workstations are switched in Settings only

**Status:** Accepted
**Date:** 2026-11-13
**Supersedes:** ADR-0012's "only the switcher stays in the header" (the rest of ADR-0012 stands)

## Context

ADR-0012 kept the workstation dropdown in the header beside the name. The owner wants the header to hold only what
Scrappy's holds: the name, the view tabs, the Settings button and the window buttons.

## Decision

- **No workstation switcher in the header.** `WorkstationSwitcher.tsx` goes.
- **Settings → Workstations is the one place** to open, add, set up and remove workstations (ADR-0013): each row's
  Open button switches to it.

## Options considered

- **Keep the dropdown:** one click to switch, but a control Scrappy's header doesn't have.

## Consequences

- **Easier:** the header is Scrappy's, with room to spare at the smallest window.
- **Harder:** switching takes Settings, then Open; the header no longer says which workstation is open.
- **Rules:** `.claude/rules/architecture/frontend.md`.
