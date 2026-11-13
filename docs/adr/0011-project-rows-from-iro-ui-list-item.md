# ADR-0011: Project rows are iro-ui's ListItem, stretched; the Tags filter stays

**Status:** Accepted
**Date:** 2026-11-12

## Context

ADR-0010 asked for every control to come from iro-ui. A project row is clickable as a whole (it opens a suite's
repos, or a repo's git overview) and also holds clickable `#tag` chips and buttons. The app did this by hand: a
button under the row's content, which let clicks through except on its own controls. iro-ui's `ListItem` (v1.2.0)
wraps a clickable row's content in its button, so chips inside it would be buttons in a button, which HTML forbids;
it also cut its text to one line and had no open/closed state. The Tags filter is a `Popover` of iro-ui's `TextField`
and `Checkbox`es with a search box and counts; `MultiSelect` has counts but no search box.

## Decision

- **iro-ui gets what the rows need first** (v1.3.0): `ListItem` takes `stretched` (its button lies under the content),
  `expanded` (a turning chevron and `aria-expanded`) and `wrap` (text wraps; each child of `description` starts a
  line).
- **Project rows and folder rows are `ListItem`s.** Name, status and git badges go in `title`; the description and
  the path, stack and tag chips in `description`; Register, Edit tags and Open folder in `actions`. A suite or home
  passes `expanded`; a repo's row opens its git overview. Inner rows sit in a nested list after their parent.
- **The Tags filter stays** a `Popover` of iro-ui parts: it isn't hand-built, and its search box matters with many
  tags.

## Options considered

- **No row click** (a chevron button and a Git button instead): no iro-ui change, but the row stops working as one
  target.
- **Row click with plain tags** (filter by tag from the context menu): no iro-ui change, but a tag on a row stops being
  a one-click filter.
- **`MultiSelect` for tags:** the stock dropdown, without the search box.

## Consequences

- **Easier:** rows look and behave like every other iro-ui list; the row CSS leaves `styles.css`. Scrappy can use the
  same props.
- **Harder:** the app needs iro-ui v1.3.0 or later.
- **Rules:** `.claude/rules/architecture/frontend.md`.
