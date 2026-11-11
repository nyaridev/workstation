# games/godot/

Godot games, one game home each (`games/CLAUDE.md`).

## Engine

Godot binaries live in `_toolchains/godot/<version>/`. The kit's default is **4.7-stable**: install it there, or change this file, `/new-project` →
`types/godot.md` and the `godot-project` template to your version.

| Use | Path |
|---|---|
| Editor | `_toolchains/godot/4.7-stable/Godot_v4.7-stable_win64.exe` |
| CLI with console output (headless runs, imports, exports) | `godot`: the shim in `_toolchains/bin/` (on PATH), which wraps `…/Godot_v4.7-stable_win64_console.exe` |

Committed files in a `game/` repo call it `godot`, never by path (`AGENTS.md` → Paths).

Each game names its version in its `AGENTS.md` and in `project.godot` (`config/features`). A new version goes in its
own folder; never overwrite a version a game still uses.

## A Godot game home

| Folder | What |
|---|---|
| `game/` | The repo **and** the Godot project (`project.godot` at its root): `scenes/`, `scripts/`, `data/`, and `assets/` (game-ready copies only) |
| `assets/` | Sources by type, use and asset (`games/CLAUDE.md`), each asset with `source/` and `export/` |
| `builds/` | `builds/<version>/<name>-<version>.exe`, plus `builds/CHANGELOG.md` |

## Rules

- Edit assets in `assets/`, never in `game/assets/`. Re-export, then copy `export/` to the same path under
  `game/assets/`. Once there are more than a few assets, put a sync script in `assets/_tools/`.
- Commit `*.import` and `*.uid` files; ignore `.godot/`.
- **Headless checks:**
  - `godot --headless --path game --import` imports resources and quits.
  - `godot --headless --path game --quit` runs one frame and reports script errors.
- **Exports:** `godot --headless --path game --export-release "<preset>" <output>`, with presets in
  `game/export_presets.cfg`. Export templates for the version must be installed (the editor's Export dialog does this).
- Every build bumps `config/version` in `project.godot` and adds an entry to `builds/CHANGELOG.md`.
- If `game/assets/` grows large, turn on Git LFS for it in that game only, and say so in its `AGENTS.md`.
