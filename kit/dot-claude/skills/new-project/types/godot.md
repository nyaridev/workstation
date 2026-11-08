# Godot game

- **Game home:** `games/godot/<name>/`.
- **Repo and Godot project:** `game/`.
- **Engine:** `_toolchains/bin/godot.cmd`, which runs Godot 4.7.

1. **Scaffold.** From the workstation root:
   `new-from-template.ps1 -Template game-home,game-godot,godot-project -Destination games/godot/<name> -Name <name> -Title "<Title>" -Owner <owner> -Engine "Godot 4.7"`
   - This writes the game home: `AGENTS.md` with the commands, `CLAUDE.md`, `docs/`, `assets/`, `builds/CHANGELOG.md`.
   - It also writes `game/`: `project.godot` (Forward+, Jolt, version 0.0.1), `scenes/main.tscn`, `scripts/`,
     `data/`, `assets/`, `icon.svg`, `.gitignore` and `.gitattributes`.
2. **Ask about the look** if it matters: renderer (`Forward Plus` / `Mobile` / `GL Compatibility`) and 2D or 3D.
   - For 2D pixel art, add `textures/canvas_textures/default_texture_filter=0` under `[rendering]` in `project.godot`.
3. **Import once**, headless, to generate `.godot/` and the `.uid` files:
   `_toolchains/bin/godot.cmd --headless --path games/godot/<name>/game --import`.
   It must finish without errors.
4. **Commit:** `git init` in `game/`, then commit, including the generated `*.uid` and `*.import` files.
5. **Next:** open the editor with
   `_toolchains/godot/4.7-stable/Godot_v4.7-stable_win64.exe --path game -e`. To export builds, add a
   "Windows Desktop" preset in the editor, which installs the export templates the first time.

**A different Godot version:** put it in `_toolchains/godot/<version>/` first (see `_toolchains/README.md`). Then pass
`-Engine "Godot <version>"` and fix `config/features` and the commands in the game's `AGENTS.md`.
