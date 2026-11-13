# games/roblox/

Roblox games, one game home each (`games/CLAUDE.md`), built with Rojo. That's the kit's default toolchain: if you
build Roblox games another way, change this file and `/new-project` → `types/roblox.md`.

## A Roblox game home

| Folder | What |
|---|---|
| `game/` | The repo: a Rojo project (`default.project.json`, `src/`), the place `<name>.rbxl` it builds, and the repo's own `AGENTS.md` and `CLAUDE.md` |
| `assets/` | GFX and SFX sources: `ui/` (icons, buttons, frames, HUD), `marketing/` (thumbnails, game icons, ads), `audio/sfx/<use>/<sound>/`, `models/`, `_inbox/` for AI generations |
| `saves/` | Place snapshots, `YYYY-MM-DD_note.rbxl` |

## New game

Follow `/new-project` → `types/roblox.md`: the game home from the templates, then `rojo init` in `game/`. This file
came from the `engine-roblox` template with the first Roblox game; it's yours to change.

## Working on a game

- **Code rules** come from `game/AGENTS.md` and its `.claude/rules/`. Run the project's tools (`rojo`, `selene`,
  `stylua`) from inside `game/`.
- **Toolchain:** pin tools in `rokit.toml` (`rokit add rojo-rbx/rojo`…). Run `rokit install` in a fresh clone.
- **Snapshots:** before risky place edits or Studio experiments, copy `game/<name>.rbxl` to
  `saves/<YYYY-MM-DD>_<note>.rbxl`.
- **Assets:** design and export in `assets/`, upload to Roblox, then write the `rbxassetid` on the asset's card before
  using it in code. Images from AI tools start in `assets/_inbox/`.
- **Prep assets before uploading:** fix transparent edges on exported PNGs (never on sources), and normalize sounds.
  **Roblox sounds are uploaded only as `.ogg`**, never `.mp3` or `.wav`. Keep raw files untouched in `source/`.
- **Owners:** your own games use the games owner in `AGENTS.md`. Partner studios own their repos; the home's `.workstation` says
  which.
