# AGENTS.md — {{Title}}

Guide for AI agents working on {{Title}}. This folder is the game's **home**: a plain folder, not a git repo. The
game's repo is `game/`. Workspace rules: `games/CLAUDE.md`.

## What this is

<!-- One paragraph: the pitch, who it's for, where it stands. -->

- Engine: {{Engine}}
- Owner: {{Owner}}
- Started: {{Date}}
- Status: prototyping

## Map

| Folder | What | In git? |
|---|---|---|
| `game/` | The game's repo | yes (its own repo) |
| `docs/` | Design and tech docs | no |
| `assets/` | Sources and working files (`assets/README.md`) | no |
| `.claude/` | Claude Code settings: the workspace guardrails, which a session started here doesn't inherit | no |

Add a row when you add a folder.

## Working here

- Code changes happen in `game/`. Follow `game/AGENTS.md` once it exists.
- Edit assets in `assets/`, never the game-ready copies in the repo.
- Record design decisions in `docs/` as they're made.
