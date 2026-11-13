# ADR-0010: The window's shell works like Scrappy's

**Status:** Accepted
**Date:** 2026-11-12

## Context

ADR-0008 moved the controls to iro-ui, but the window still differs from Scrappy's: a `TitleBar` component instead
of a header that holds the views, no Settings, no view list to add screens to, and some controls still hand-built
(project rows, chevrons, the tag picker and tag input, `title` tooltips). The browser's own right-click menu and text
selection are on, so it feels like a web page. The owner wants Workstation to look and behave like Scrappy.

## Decision

- **The header is the title bar**, a three-column grid like Scrappy's: the mark, name and workstation switcher; the
  view tabs in the middle (`Tabs variant="nav"`, shown once there are two main views); then the update chip, the
  header's view buttons (Settings) and, for the `custom` frame, `WindowControls`. Its empty parts are the drag area.
- **Views** are listed in `src/app/views.ts`: `MAIN_VIEWS` (tabs) and `HEADER_VIEWS` (icon buttons). Each view is
  `src/features/<view>/<View>View.tsx`. Opened views stay mounted and hidden, as in Scrappy.
- **The backdrop** is iro-ui's `Backdrop` with the liquid layer, on unless Settings → "Liquid background" turns it
  off (`src/app/AppBackdrop.tsx`, ADR-0009).
- **It behaves like a desktop window:** text can't be selected and the browser's menu is off, except in text fields
  and `selectable` text. Rows the user acts on get an iro-ui `ContextMenu` with the same actions as their buttons.
  Tooltips are iro-ui's `Tooltip`, never a `title` attribute. Short results show in iro-ui's `Toaster`.
- **No hand-built controls:** rows, disclosure, tag picking and tag entry use iro-ui components (`ListItem`,
  `Collapsible`, `MultiSelect`, `TagInput`…). `src/styles.css` does layout only. iro-ui moves to `v1.2.0`.
- **The mark** is `assets/brand/icon.svg`, shown as an image, not inline SVG.

## Options considered

- **Keep `TitleBar` and add a Settings button to it:** the next screen would again have nowhere to go.
- **A shared header component in iro-ui:** both apps would use one, but it ties iro-ui to Tauri's drag regions. Worth
  it once a third app wants the same header.

## Consequences

- **Easier:** a new screen is a folder and one line in `views.ts`; Workstation and Scrappy feel like one family.
- **Harder:** the window glyphs (minimize, maximize, restore) are drawn in both apps until iro-ui has them.
- **Later:** a Workstations view (add, set up, remove) is one more entry in `MAIN_VIEWS`, which also turns the tabs on.
- **Rules:** `.claude/rules/architecture/frontend.md`, `.claude/rules/architecture/overview.md`.
