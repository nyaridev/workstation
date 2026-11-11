# games/{{Name}}/

{{Engine}} games, one game home each (`games/CLAUDE.md`). This file came from the `engine` template with the first
{{Engine}} game; fill in the prompts below and keep it current.

## Engine

<!-- Where the engine comes from (an installer, a portable build in `_toolchains/{{Name}}/<version>/`, a package
manager), the version games use and where each game pins it, and the command committed files call it by (a shim in
`_toolchains/bin/`, never a path). -->

## A {{Engine}} game home

| Folder | What |
|---|---|
| `game/` | The repo <!-- and what's inside it for this engine: the project file, code and scene folders, game-ready assets --> |
| `assets/` | Sources by type, use and asset (`games/CLAUDE.md`), each with `source/` and `export/` |
| `builds/` | `builds/<version>/` with exported builds, plus `builds/CHANGELOG.md` <!-- or saves/, or neither --> |

## Rules

- Edit assets in `assets/`, never in the game-ready copies inside `game/`. Re-export, then copy or upload.
<!-- How to run the game headless or from a CLI, the checks to run before a task is done, how builds and exports are
made and versioned, and what git must ignore or commit for this engine. -->
