# AGENTS.md — {{Title}}

Guide for AI agents working on {{Title}}, a mod. The mod home around it (`../AGENTS.md`) records the game, the game
version, the mod loader and the install path.

## What this is

<!-- What the mod does, and the game version it's tested on. -->

## Layout

| Path | What |
|---|---|
| `install.ps1` | Installs the mod into the loader's folder (`-GamePath`, `-Uninstall`) |
| <!-- the mod's payload folder --> | What the loader loads |
| `tools/` | Analysis and helper scripts |
| `dist/` | Release zips (git-ignored) |

## Hard rules

- Never commit the game's files, dumps or extracted assets.
- Never extract encryption keys or unpack encrypted archives.
- Back up saves to `../_saves/<date>/` before testing anything that writes them.
