# AGENTS.md — {{Title}}

Guide for AI agents working on {{Title}}, a Godot game. This folder is the game's **home**: a plain folder, not a git
repo. Workspace rules: `games/CLAUDE.md` and `games/godot/CLAUDE.md`.

## What this is

<!-- One paragraph: the pitch, who it's for, where it stands. -->

- Engine: {{Engine}} (binaries in `_toolchains/godot/`)
- Owner: {{Owner}}
- Started: {{Date}}
- Status: prototyping

## Map

| Folder | What | In git? |
|---|---|---|
| `game/` | The repo and Godot project: `scenes/`, `scripts/`, `data/`, `assets/` (game-ready copies only). Rules: `game/AGENTS.md` | yes (its own repo) |
| `docs/` | Design and tech docs | no |
| `assets/` | Sources, as `<type>/<use>/<asset>/` with `source/` and `export/` (`assets/README.md`) | no |
| `builds/` | `builds/<version>/{{Name}}-<version>.exe`, plus `CHANGELOG.md` | no |
| `.claude/` | Claude Code settings: the workspace guardrails, plus the Godot and sync commands (a session started here doesn't inherit the workspace's) | no |

Add a row when you add a folder (a wiki in `wiki/`, a tool in `tools/`…).

## Commands

Run these from this folder. `godot` is the shim in `_toolchains/bin/`, which must be on your PATH
(`_toolchains/README.md`).

| What | Command |
|---|---|
| Open the editor | `godot --path game -e` |
| Import resources (after adding assets) | `godot --headless --path game --import` |
| Check for script errors | `godot --headless --path game --quit` |
| Run the game | `godot --path game` |
| Export a build | `godot --headless --path game --export-release "Windows Desktop" ../builds/<version>/{{Name}}-<version>.exe` |

## Working here

- Edit assets in `assets/`, re-export, then copy `export/` to the same path under `game/assets/`. Never edit
  `game/assets/` by hand.
- Every build bumps `config/version` in `game/project.godot` and adds a `builds/CHANGELOG.md` entry.
