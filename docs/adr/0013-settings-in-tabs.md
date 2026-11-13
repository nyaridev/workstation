# ADR-0013: Settings in tabs, each section a card

**Status:** Accepted
**Date:** 2026-11-13

## Context

Settings is one column with two switches and the version. It will gain the workstation list (ADR-0012), updates
(ADR-0014), starting with the system and the tray (ADR-0015). Scrappy puts its Settings in tabs, each section an iro-ui
card, which reads well as settings grow.

## Decision

- **`SettingsView` holds iro-ui `Tabs`** (`TABS` in `SettingsView.tsx`), each tab one or more sections, each section
  its own component in `src/features/settings/`: `<Panel as="section" className="settings-section">` with a
  `SectionTitle`.
- **Two tabs:**
  - **Workstations:** every saved workstation with its root and whether it's found, the open one marked; Open and
    Remove from list per row; Add and Set up new.
  - **App:** Look (liquid background, system title bar), Start (start with the system, close to the tray: ADR-0015)
    and About (version, updates: ADR-0014).
- **Settings stay in Rust's `settings.json`** (ADR-0009). Workstation management keeps its own commands and
  `workstations.json`.

## Options considered

- **One long column:** fine for three switches, hard to scan with the workstation list and updates in it.
- **A tab per section:** tabs with one switch each.

## Consequences

- **Easier:** a new setting goes in the section it belongs to; a new section in the tab that fits, or a new tab.
- **Harder:** a setting is one click further away.
- **Rules:** `.claude/rules/architecture/frontend.md` → How to add a setting.
