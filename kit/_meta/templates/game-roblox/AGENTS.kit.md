# AGENTS.md — {{Title}}

Guide for AI agents working on {{Title}}, a Roblox game. This folder is the game's **home**: a plain folder, not a
git repo. Workspace rules: `games/CLAUDE.md` and `games/roblox/CLAUDE.md`.

## What this is

<!-- One paragraph: the pitch, who it's for, where it stands. -->

- Owner: {{Owner}}
- Started: {{Date}}
- Status: prototyping
- Built with: Rojo (`game/default.project.json`)

## Map

| Folder | What | In git? |
|---|---|---|
| `game/` | The repo: a Rojo project (`default.project.json`, `src/`) and the place `{{Name}}.rbxl` it builds. Rules: `game/AGENTS.md` | yes (its own repo) |
| `docs/` | Design: pitch, systems, decisions | no |
| `assets/` | GFX and SFX sources, marketing art (`assets/README.md`) | no |
| `saves/` | Place snapshots, `YYYY-MM-DD_note.rbxl` | no |
| `.claude/` | Claude Code settings: the workspace guardrails, which a session started here doesn't inherit | no |

Add a row when you add a folder (a balancer in `tools/`, a site in `site/`…).

## Working here

- For code, work inside `game/` and follow its `AGENTS.md` and `.claude/rules/`.
- Before risky place edits, copy `game/{{Name}}.rbxl` to `saves/<date>_<note>.rbxl`.
- After uploading an asset, write its `rbxassetid` on the asset's card (`assets/.../asset.yaml`).
