# AGENTS.md — {{Title}} (game)

The Godot project and git repo of {{Title}}. The game home around it (`../AGENTS.md`) holds the design docs, asset
sources and builds.

## Layout

| Folder | What |
|---|---|
| `scenes/` | Scenes; `main.tscn` boots the game |
| `scripts/` | GDScript, grouped by feature |
| `data/` | Editable data the game reads (JSON, `.tres`) |
| `assets/` | Game-ready copies of `../assets/**/export/`, at the same paths. Never edited here |
| `.claude/` | Claude Code settings for sessions opened on `game/`: `settings.json` (guardrails, the Godot and sync commands; committed) and `settings.local.json` (rules that name paths on this PC; not committed) |

## Conventions

- GDScript with static types. Files and functions in `snake_case`; classes and nodes in `PascalCase`.
- Commit `*.import` and `*.uid` files; never `.godot/`.
- `godot` is the Godot 4.7 console build, on your PATH.
- Before finishing, run `godot --headless --path . --quit`. It must print no errors.
