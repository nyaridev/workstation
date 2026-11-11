# Roblox game

- **Game home:** `games/roblox/<name>/`.
- **Repo:** `game/`, a Rojo project. Needs `rojo` (install it with rokit: `rokit add rojo-rbx/rojo`).

0. **The engine folder,** if this is the first Roblox game (`games/roblox/` doesn't exist yet):
   `new-from-template.ps1 -Template engine-roblox -Destination games/roblox -Name roblox -Engine Roblox`.
1. **Game home files.** From the workstation root:
   `new-from-template.ps1 -Template game-home,game-roblox -Destination games/roblox/<name> -Name <name> -Title "<Title>" -Owner <owner> -Engine Roblox`
   This writes `AGENTS.md`, `CLAUDE.md`, `docs/`, `assets/` (`_inbox/`, `_reference/`, `_templates/`) and `saves/`.
2. **The repo.** In the game home, run `rojo init game`, then `git init` in `game/`. Add `repo-base` on top for the
   workspace files: `new-from-template.ps1 -Template repo-base -Destination games/roblox/<name>/game -Name <name> -Title "<Title>" -Owner <owner> -Merge`.
3. **Build the place** once: `rojo build -o <name>.rbxl` in `game/`, and fill in the game home's `AGENTS.md`
   (the pitch).
4. **Commit** in `game/` as `Initial scaffold from WORKSTATION templates`. A GitHub repo is created only after the
   user says yes (`gh repo create <owner>/<name> --private --source game --push`).
5. **Next steps**, to tell the user: run `rojo serve` in `game/` and connect from the Rojo plugin in Studio.
