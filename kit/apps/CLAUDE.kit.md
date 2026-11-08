# apps/

Full applications. Each app folder is its own repo.

| Folder | For |
|---|---|
| `web/` | Websites, web apps, browser extensions, hosted APIs |
| `desktop/` | Apps that run on this machine: Tauri, Electron, .NET, Python GUI. Local-first apps that open in the browser *or* a window are desktop apps |
| `bots/` | Always-on services: Discord and Twitch bots, an AI VTuber |
| `mobile/` (make it with the first one) | Phone apps |

A tool that does one job belongs in `tools/`, and a companion for one game belongs inside that game home.

## House stack

New apps use this stack unless the user picks something else:

- Node 22.18+, TypeScript (strict), React 19 + Vite, Tailwind 4, Biome (format + lint), Vitest.
- Desktop shell: Tauri 2. Local server: Hono.
- New projects use **pnpm** (point its store at `_cache/pnpm-store/`). Existing projects keep the package manager their lockfile
  shows.

## Conventions

- Windows launchers at the root (`start-web.bat`, `start-app.bat`, `start-dev.bat`, saved with CRLF line endings), so
  the app runs with a double-click.
- A `.claude/launch.json` entry for the dev server, so Claude can preview it.
- Secrets live in `.env` (git-ignored), with a committed `.env.example`.
- One `check` script (typecheck + lint + tests) that must pass before a task is done.
- For client work, the client's org owns the repo. Note it in the project's `projects.json` entry (`client` tag, client in `notes`).
