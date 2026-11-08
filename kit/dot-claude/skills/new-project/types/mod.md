# Mod

- **Mod home:** `mods/<target-game>/`, named with the game's slug (`carnal-instinct`, `minecraft`, `skyrim`).
- **Mod repo:** `mods/<target-game>/<mod>/`.

1. **The mod home**, if this is the first mod for the game:
   `new-from-template.ps1 -Template mod-home -Destination mods/<game> -Name <game> -Title "<Game Title>"`
   - Fill in its `AGENTS.md` table with the user: engine and version, mod loader, install path.
   - Copy the vanilla game into `_game/<version>/` only if the user wants a test copy; otherwise record the install
     path. Never edit the copy.
2. **The mod:**
   `new-from-template.ps1 -Template repo-base,mod -Destination mods/<game>/<mod> -Name <mod> -Title "<Mod Title>" -Owner <owner>`
   This writes `AGENTS.md` (what the mod does, the loader, the layout), `README.md` (install, controls) and a
   `.gitignore` that keeps out game files, dumps and `dist/`. Add the mod to the mod home's `AGENTS.md` map and to its
   `CLAUDE.md` "Rules below this folder" table.
3. **The loader's skeleton**, depending on the loader:

   | Loader | Skeleton |
   |---|---|
   | UE4SS Lua | `<Mod>/Scripts/main.lua` + `enabled.txt` |
   | BepInEx | a .NET class library |
   | Minecraft | the loader's MDK template |

   Also add an `install.ps1` that takes `-GamePath`, links or copies the mod into the loader's mod folder, and
   supports `-Uninstall`.
4. **Commit:** `git init`, then commit. Rules: `mods/CLAUDE.md` (no game files in git, no DRM breaking, back up saves).
