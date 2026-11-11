# tools/

Utilities that do one job: CLIs, converters, downloaders, AI pipelines, small GUI tools, and editor or Studio plugins.
Each tool folder is its own repo.

- **One-file scripts** don't get a repo each. They go in `tools/scripts/<app>/` (`photoshop/*.jsx`, `blender/*.py`,
  `powershell/*.ps1`): one repo for all of them, with a line per script in its README.
- **Plugins** (Roblox Studio, VS Code, Blender add-ons) live here unless they belong to a framework suite. A suite's
  plugins stay in the suite's folder.

## Python tools (the default shape)

The kit's starting choice: change it, or add a section like it for the language your tools use.

```
<tool>/
├─ main.py            entry point
├─ app/               the code
├─ pyproject.toml     managed by uv (requirements.txt only for pip-only tools)
├─ run.bat            double-click to run: sets up .venv on the first start, then runs main.py
├─ setup.bat          (re)creates .venv and installs dependencies with uv
└─ README.md          what it does, how to run it, settings
```

- Each tool has its own `.venv/`, never committed. Call `.venv\Scripts\python.exe` directly instead of activating it.
- Pin the Python range in `pyproject.toml` when a dependency needs it (pydub breaks on 3.13).
- Big inputs and outputs (`input/`, `output/`, model files) are git-ignored.
- Built executables go in `dist/`, with the PyInstaller spec committed. Share them through GitHub Releases, not git.

Node and PowerShell tools follow the same idea: one entry point, a `run.bat`, a README.
