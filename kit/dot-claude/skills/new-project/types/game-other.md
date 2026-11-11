# Game in another engine

Game home: `games/<engine>/<name>/`. Engines include `unity`, `unreal`, `love2d`, and `web` for
HTML5/Phaser/Three.js.

1. **If `games/<engine>/` is new:**
   - Create it with its `CLAUDE.md`:
     `new-from-template.ps1 -Template engine -Destination games/<engine> -Name <engine> -Engine "<Engine>"`.
   - Fill in that file's prompts: where the engine lives and its version, where the project sits inside `game/`, how
     to run headless, and how builds are made. Ask the user what you can't find out.
   - If the engine is portable, put it in `_toolchains/<engine>/<version>/` and add a row to `_toolchains/README.md`.
2. **Game home files:**
   `new-from-template.ps1 -Template game-home -Destination games/<engine>/<name> -Name <name> -Title "<Title>" -Owner <owner> -Engine "<Engine> <version>"`
3. **The engine project:** create it inside `game/` with the engine's own tool (Unity Hub, `pnpm create vite` for web
   games…). Add the engine's standard `.gitignore`, run `git init`, and commit.
4. **Builds:** if the engine exports builds, add `builds/` with a `CHANGELOG.md`, and add rows for it to the game home's
   `AGENTS.md` map.
