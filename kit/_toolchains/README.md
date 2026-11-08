# _toolchains/

Engines and SDKs shared by every project, and the shims for tools installed elsewhere. Nothing in this folder is a
project.

**`bin/` must be on your PATH.** Committed repos call tools by name (`godot`, `blender`) and never by path
(`AGENTS.md` → Paths), so the shims here are what makes those names work on this PC. Each shim has a `.cmd` file for
PowerShell and cmd, and an extension-less twin for Git Bash. Add the folder once, in PowerShell, from the workstation
root:

```powershell
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$PWD\_toolchains\bin", "User")
```

| Path | What | Used by |
|---|---|---|
| `godot/<version>/` | Godot builds, one folder per version: the editor and the console build | Godot games (`games/godot/`) |
| `bin/godot.cmd`, `bin/godot` | `godot`: the current Godot console build, with any arguments | scripts, Claude |

Add a row for every engine, SDK or shim you put here.

## Rules

- One folder per version (`godot/<version>/`). Never overwrite a version a project still uses. Each project names its
  version in its `AGENTS.md`.
- **To add a version:** download the official build, unzip it to `<engine>/<version>/`, and add a row here. Point the
  `bin/` shims at it only once every project has moved to it.
- **Not in this folder:**
  - Roblox tools: each project pins them in `rokit.toml`, and rokit installs them to `~/.rokit`.
  - Node, Python, uv, Rust and .NET: installed system-wide.
- Mod loaders that several games use (UE4SS, BepInEx) can live in `<loader>/<version>/`. Game-specific dumps stay in
  that game's `mods/<game>/_sdk/`.
