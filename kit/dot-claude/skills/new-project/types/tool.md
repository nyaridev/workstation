# Tool, script or plugin

| What | Where |
|---|---|
| A tool | `tools/<name>/`, its own repo |
| A one-file script | `tools/scripts/<app>/<script>`, inside the shared scripts repo |
| A plugin (Studio, VS Code, Blender) | `tools/<name>/`, unless it belongs to a framework suite |

## One-file script

1. If `tools/scripts/` doesn't exist yet, create it:
   `new-from-template.ps1 -Template repo-base -Destination tools/scripts -Name scripts -Title "Scripts" -Owner <owner>`,
   then run `git init` and register it once.
2. Add the script, and a line in the repo's README saying what it does, how to run it and which app it's for.
3. Commit. Scripts don't get their own registry rows.

## Python tool (the default for utilities)

1. Scaffold it:
   `new-from-template.ps1 -Template repo-base,tool-python -Destination tools/<name> -Name <name> -Title "<Title>" -Owner <owner>`
   This writes `main.py`, `app/__init__.py`, `pyproject.toml` (managed by uv, `package = false`), `run.bat`,
   `setup.bat`, `README.md` and `.gitignore`.
2. Add dependencies with `uv add <package>` in the tool folder. This creates `.venv/` and `uv.lock`.
3. Check that `run.bat` starts it (or `uv run main.py`). Then `git init` and commit, including `uv.lock`.

## Other tools

- **Node:** `repo-base`, then `pnpm init`, an entry point in `src/index.ts`, and a `run.bat`.
- **PowerShell:** `repo-base`, then `<name>.ps1` with comment-based help.
