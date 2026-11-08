# Server emulator

- **Emulator home:** `emulators/<game>/`, named with the game's slug (`nostale`, `metin2`).
- **Emulator repo:** `emulators/<game>/<emulator>/`.

1. **The emulator home**, if this is the first emulator for the game:
   `new-from-template.ps1 -Template emulator-home -Destination emulators/<game> -Name <game> -Title "<Game Title>"`
   - Fill in its `AGENTS.md` table: client version, protocol, reference data.
   - Copy the client into `_game/<version>/` only if the user wants a test copy; otherwise record its path.
   - Reference repos (data dumps, configs, other emulators) are cloned with `/clone-project` into `external/`.
2. **The emulator:**
   `new-from-template.ps1 -Template repo-base -Destination emulators/<game>/<emulator> -Name <emulator> -Title "<Title>" -Owner <owner>`
   Then the stack's own generator with the folder already there (`cargo init`, `uv init`…). Add the game's file types
   (client archives, `.dat`, maps) and the local config file to `.gitignore`. Add the repo to the home's `AGENTS.md` map
   and its `CLAUDE.md` "Rules below this folder" table.
3. **Commit:** `git init`, then commit. Rules: `emulators/CLAUDE.md` (no game files in git, local only).
