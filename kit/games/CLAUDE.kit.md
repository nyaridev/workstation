# games/

Every game is a **game home** at `games/<engine>/<game>/`: a plain folder that is never a git repo. Engines so far are
`roblox/`, `godot/` and `rust/`. Another engine (`unity/`, `love2d/`, `web/`…) gets its folder, and a `CLAUDE.md` like the
others, when its first game arrives.

## A game home

| Folder | What | In git? |
|---|---|---|
| `AGENTS.md`, `CLAUDE.md` | The game's map and rules: what it is, which folder is which repo, how to run it | no |
| `.claude/settings.json` | Claude Code settings: a copy of the workspace guardrails, plus engine commands, because a session started here doesn't inherit `.claude/settings.json`. A Godot `game/` has its own copy | no (the `game/` copy is) |
| `docs/` (+ `game.json`, `features/`) | Design: pitch, systems, decisions, feature specs | no |
| `game/` | **The game's repo**: the Roblox project (Rojo) or the Godot project | its own repo |
| `assets/` | Sources and working files: PSD, `.blend`, raw and edited audio, AI generations | no |
| `saves/` | Roblox place snapshots | no |
| `builds/` | Exported builds, one folder per version, plus `CHANGELOG.md` | no |
| `tools/<name>/`, `wiki/`, `site/` | Companions for this game only (a balancer, a wiki, a site) | each its own repo, if code |

The list is a menu, not a checklist. A new game gets `AGENTS.md`, `CLAUDE.md`, `docs/`, `game/`, `assets/` (with
`_inbox/`, `_reference/`, `_templates/`), plus `saves/` (Roblox) or `builds/` (Godot). Add other folders when the game
needs them, and give each one a row in the game's `AGENTS.md` map.

Everything outside `game/` exists only on this drive, so the drive needs a backup.

## Assets

`assets/` uses one layout everywhere:

```
assets/
├─ _inbox/        drops, downloads and AI generations waiting to be sorted (never ships)
├─ _reference/    moodboards, inspirations, screenshots (never ships)
├─ _templates/    asset.yaml, the asset card
├─ _tools/        export, sync and normalize scripts (when needed)
├─ ui/ textures/ models/ vfx/ audio/ fonts/   type folders, made when the first asset needs one
│  └─ <use>/<asset>/   one folder per asset: source/ (editable), export/ (game-ready), asset.yaml
└─ marketing/     thumbnails, game icons, ads, trailers, store pages
```

- **The asset card** (`asset.yaml`) records what the asset is, who or what made it, how to make it again, its license,
  where it's used, and its `rbxassetid` once it's uploaded to Roblox.
- **Sets** of small related files (an icon set, a button kit) share one folder and one card.
- **Game-ready copies:** engines that import files (Godot) get a copy of `export/` inside the repo at the same path
  (`game/assets/<type>/<use>/<asset>/`). Edit only the source, then re-export and copy. On Roblox the export is
  uploaded instead of copied.
- **Shared assets:** an asset two games use moves to `assets/library/`, and each game copies it.
- **AI generations** go to `assets/_inbox/` first, with the prompt or script next to them.
- Names inside asset folders are `snake_case`, after the asset (`oxygen_tank.psd`, `oxygen_tank.png`).

## Design and status

A game home keeps its status in `docs/game.json` too, if it has one. The status runs `planning` → `prototyping` →
`in-development` → `released` → `on-hold` → `archived`. Keep it in step with the game's `projects.json` entry.

## Working here

- Open Claude on the game home for design, asset or mixed work. Open it on the folder you code in for code (`game/`, or
  `game/<folder>/` when it has its own `.claude/`): git features work there, and this file still loads.
- Each game home's `CLAUDE.md` lists the rules below it ("Rules below this folder"), which a session on the home
  doesn't load. Keep that table current (`.claude/rules/instructions.md`).
- For a partner studio's game, nothing personal goes inside `game/`. the user's art, saves and tools stay in the game home.
- Before a risky change, snapshot the place (Roblox) or commit (Godot).
