# Web, desktop or bot app

- **Path:** `apps/web/<name>/`, `apps/desktop/<name>/` or `apps/bots/<name>/`. The folder is the repo.
- **Stack and conventions:** `apps/CLAUDE.md`.

1. **Generate** the app with the official tool, run from the parent folder so it creates `<name>/`. Check `--help`
   first if the flags may have changed.

   | Kind | Command |
   |---|---|
   | Web (React) | `pnpm create vite@latest <name> --template react-ts` |
   | Desktop (Tauri 2) | `pnpm create tauri-app@latest <name> --template react-ts --manager pnpm --yes` |
   | Bot or service | `pnpm init` (Node), or the Python tool shape (`types/tool.md`) |
   | Anything else the user asked for | its own generator |
2. **Add the workspace files** on top without overwriting the generator's:
   `new-from-template.ps1 -Template repo-base -Destination <path> -Name <name> -Title "<Title>" -Owner <owner> -Merge`
   - `-Merge` skips files that already exist, so the generator's `.gitignore` and `README.md` stay as they are.
   - Add any useful `repo-base/.gitignore` lines to them by hand (`.env`, `CLAUDE.local.md`).
3. **Apply the house conventions** from `apps/CLAUDE.md`:
   - Biome and Vitest, plus a `check` script;
   - `start-*.bat` launchers, saved with CRLF;
   - `.claude/launch.json` for the dev server;
   - `.env.example`.
4. **Finish:** run `pnpm install` (it's the user's own project, so that's fine) and `check` once, then `git init` and commit.
