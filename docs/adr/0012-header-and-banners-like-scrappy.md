# ADR-0012: The header and its banners look like Scrappy's

**Status:** Accepted (the switcher: superseded by 0017)
**Date:** 2026-11-13

## Context

ADR-0010 gave Workstation Scrappy's header layout, but not its look: Workstation's header has a bottom line, the mark
is a framed ghost button, and the workstation switcher brings three more buttons (Add, Set up new, Remove from list)
plus the root path, which crowd the header until the path disappears below about 900 px. Scrappy has since settled
its header (a plain Home button with a tooltip, no line, a compact layout under 960 px) and shows notices in one slim
banner under it. Workstation's notices are full-width iro-ui Banners in three places, each styled its own way.

## Decision

- **The header is Scrappy's:** the same padding and no bottom line; the mark and name are a plain button (no frame,
  only a focus ring) with a "Home" tooltip that opens the first main view, inside a slot that still drags the window;
  under 960 px the name shows as the mark alone (still read out).
- **Only the switcher stays in the header:** an iro-ui `Select` of the workstations. Adding, setting up and removing
  workstations move to Settings → Workstations (ADR-0013). The root path shows in Settings, not the header.
- **One banner style under the header** (`src/app/NoticeBanner.tsx`): Scrappy's update banner, a slim rounded box
  lined up with the content, everything centered, with a border tinted by its tone. The update banner (ADR-0014) is
  `accent`; projects that don't match `projects.json` are `warning`, with "Show them"; an unreadable `projects.json`
  and other errors are `danger`; a done notice is `success`. They stack in that order: errors, update, registry.

## Options considered

- **Keep the actions in the header behind a menu button:** one more header control; Scrappy keeps its header to
  views and Settings.
- **Keep iro-ui's full-width Banner:** it reads as part of the page rather than the window.

## Consequences

- **Easier:** the header has room again, and every notice looks the same; a new notice is one `NoticeBanner`.
- **Harder:** switching between workstations is in the header, but managing them is in Settings.
- **Rules:** `.claude/rules/architecture/frontend.md`.
