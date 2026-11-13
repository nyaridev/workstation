---
paths:
  - "src/**"
  - "index.html"
  - "vite.config.ts"
---

# Window (React + iro-ui)

The window shows what Rust sends and passes clicks on. It doesn't read files, decide or parse.

- Every call to Rust is a function in `src/lib/backend.ts`; nothing else imports `@tauri-apps/*`
  (`scripts/check-boundaries.mjs` fails on it). Window controls and the maximized state are `backend.ts` functions too.
- `backend.ts` answers with fake data when `!("__TAURI_INTERNALS__" in window)`, so `pnpm dev` previews every view.
  The data lives in `src/lib/fakeProjects.ts`; name preview states with URL flags (`?empty`, `?broken`, `?update`) and
  list them in `backend.ts`'s header comment.
- Types shared with Rust live in `src/lib/types.ts`, matching the Rust struct's serde names.
- Sorting, filtering and grouping a list Rust sent is fine for display. Anything that changes data is a command.

## iro-ui

- The UI is iro-ui in the sumi style (ADR-0008). Every control is an iro-ui component and every icon comes from
  `iro-ui/icons`: no hand-built rows, toggles, pickers or menus (ADR-0010). A control iro-ui lacks is added to iro-ui
  first, or built here from its tokens with an ADR note.
- No inline `<svg>`: the mark is `assets/brand/icon.svg` as an `<img>`; window glyphs use `icon()` from
  `iro-ui/icons` (`src/app/WindowControls.tsx`).
- App CSS goes in `src/styles.css` (layout only) or a view's own `<view>.css`, with `--iro-*` tokens only: no raw
  colors or sizes (a 1px line and the `sr-only` box aside).
- Questions use `AlertDialog`, never `window.confirm`. Short results use `toast` from the `Toaster`; lasting notices
  are `Banner` or `Notice`.
- Tooltips are iro-ui's `Tooltip` (an `IconButton`'s label already is one). Never a `title` attribute; a component's
  `title` prop is fine.

## Desktop window

- Text keeps the arrow cursor and can't be selected (`styles.css`). Only typed fields show the text cursor. Mark text
  worth copying (a path, an error) with the `selectable` class.
- The browser's right-click menu is off (`App.tsx`), except in text fields and `selectable` text. A row the user acts
  on gets an iro-ui `ContextMenu` with the same actions as its buttons.
- Accessibility: every control has a label, the keyboard works, and color is never the only signal.

- A view or screen that scrolls keeps its scrollbar in its right padding: `scrollbar-gutter: stable` and a right
  padding less `--iro-scrollbar-size`, so content keeps its width when the scrollbar shows (`styles.css`).
## Layout

- `src/main.tsx`: the iro-ui style import, `IroRoot`, `Toaster`. Nothing else.
- `src/app/`: `App.tsx` (the header and the views; the first-run screen until there's a workstation),
  `views.ts` (`MAIN_VIEWS` for the tabs, `HEADER_VIEWS` for the header's icon buttons), `WindowControls.tsx`,
  `AppBackdrop.tsx` (iro-ui's `Backdrop`, liquid unless Settings turns it off), `SettingsProvider.tsx`
  (`useSettings`), the update chip, `NoticeBanner`, the status banner and shared hooks.
- The header is the title bar (ADR-0009, ADR-0010) and follows `AppInfo.frame`: `custom` adds `WindowControls` and
  makes the header the drag area (`data-tauri-drag-region` on the header and its empty parts, never on controls);
  `native` is a plain header.
- The tabs show only when `MAIN_VIEWS` has two or more views. The mark and name are a plain button with a "Home"
  tooltip that opens the first main view, so they're not part of the drag area; under 960 px the name hides (still
  read out). Nothing else sits beside them: workstations are opened, added and removed in Settings (ADR-0017).
- Notices under the header are `NoticeBanner`s (`src/app/NoticeBanner.tsx`): `accent` for updates, `warning` for
  projects that don't match, `danger` for errors (their text `selectable`), `success` for done. Never a bare iro-ui
  `Banner`.
- `App.tsx` holds the workstation state (`useWorkstationState`) and shares it through `WorkstationsContext`; views
  read it with `useWorkstations()`.
- Views stay mounted once opened and hide with `hidden`, so filters and scroll survive switching. Keep a view's
  state in the view, not in module variables.
- `src/features/<view>/`: one folder per view, `<View>View.tsx` plus its own components and `.ts` helpers.
- `src/components/`: components two or more views use.

## How to add a view

1. Create `src/features/<view>/<View>View.tsx`.
2. Add it to `MAIN_VIEWS` (a tab) or `HEADER_VIEWS` (an icon button) in `src/app/views.ts`, with a label and an
   `iro-ui/icons` icon.
3. Give its data fake answers in `backend.ts` so it previews in `pnpm dev`.

## How to add a setting

1. Add the field to the struct in `src-tauri/src/settings.rs`, with its default and a test (`backend.md`).
2. Add it to `Settings` in `src/lib/types.ts` and to the fake settings in `backend.ts`.
3. Add its row to `src/features/settings/SettingsView.tsx`; read it elsewhere through `useSettings()`.

## Updating iro-ui

Change the tag in `package.json` (`github:nyaridev/iro-ui#vX.Y.Z`), run `pnpm install`, and read iro-ui's
`CHANGELOG.md` first. Never install it from a path or a branch.
