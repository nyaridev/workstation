# ADR-0008: The UI is built from iro-ui

**Status:** Accepted
**Date:** 2026-11-11

## Context

The window was styled with Tailwind 4 utility classes on plain HTML controls, in a dark zinc and sky palette of its
own. Each control (buttons, selects, chips, the tag dropdown, the git side panel) was hand-built, and the questions
before installing or removing used the browser's `window.confirm`. The owner's React component library, iro-ui, now
has these controls with keyboard and screen-reader behavior from Base UI, plus three looks (kami, sumi, kon). Scrappy
already builds its whole UI from it, in the sumi style.

## Decision

- **Every control comes from iro-ui** (`github:nyaridev/iro-ui#vX.Y.Z`, a release tag, never a path or a branch), in
  the **sumi** style with its default theme and accent, like Scrappy: `IroRoot styleName="sumi"` in `main.tsx`, and
  iro-ui's `Backdrop` behind the window.
- **Icons** come from `iro-ui/icons`. The window glyphs (minimize, maximize, restore) are built with its `icon()`
  builder, as Scrappy does; the app's mark stays its own drawing, colored with the accent.
- **Questions** use `AlertDialog`, never `window.confirm`; the git overview is a `Sheet`; notices are `Banner`s.
- **The app's own CSS** (`src/styles.css`) does layout only, with iro-ui's `--iro-*` tokens and never raw values.
  Status colors are palette token pairs (`--iro-<color>`, `--iro-<color>-ink`).
- **Tailwind is gone.**

## Options considered

- **Keep Tailwind and point its colors at iro-ui's tokens** (`iro-ui/tailwind.css`): the controls would still be
  hand-built, with their own keyboard handling.
- **The kami or kon style:** kami is light and plain; kon is BlomboUI's look. Sumi matches Scrappy, the owner's other
  desktop app.

## Consequences

- **Easier:** the controls behave the same as in the owner's other apps; a style, theme or accent can change in one
  place.
- **Harder:** a control iro-ui lacks is added to iro-ui first, or built in the app from its tokens. Updating iro-ui
  means changing the tag in `package.json` and reading its `CHANGELOG.md`.
- **Rules:** `overview.md` → Where new things go and Rules.
