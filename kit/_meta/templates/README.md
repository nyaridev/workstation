# Templates

`_meta/scripts/new-from-template.ps1 -Template a,b,c` applies these templates. It copies each template's files in
order (a later template overwrites an earlier one) and fills placeholders in file contents and file names.

| Placeholder | Value |
|---|---|
| `{{Name}}` | kebab-case slug: `fish-dive` |
| `{{Title}}` | display name: `Fish Dive` |
| `{{Module}}` | snake_case form, for code: `fish_dive` |
| `{{Owner}}` | GitHub owner, or `local` |
| `{{Engine}}` | engine and version: `Roblox`, `Godot 4.7` |
| `{{Date}}` | today, `YYYY-MM-DD` |

| Template | For | Used with |
|---|---|---|
| `game-home/` | Any game home: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`, `docs/`, `assets/` (`_inbox/`, `_reference/`, `_templates/`) | first, for every game |
| `game-roblox/` | Roblox overlay: Roblox map in `AGENTS.md`, `CLAUDE.md` listing the `-game` and `-gui` rules, `saves/` | after `game-home` |
| `game-godot/` | Godot overlay: Godot map and commands in `AGENTS.md`, `.claude/settings.json` with the Godot commands, `builds/CHANGELOG.md` | after `game-home` |
| `godot-project/` | The Godot project in `game/`, with its own `.claude/settings.json` (new games only, not clones) | after `game-godot` |
| `repo-base/` | Any repo: `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.gitattributes` | first, for repos |
| `tool-python/` | Python tool: `main.py`, `app/`, `pyproject.toml`, `run.bat`, `setup.bat`, `README.md` | after `repo-base` |
| `mod/` | A mod repo's `AGENTS.md`, `README.md`, `.gitignore` | after `repo-base` |
| `mod-home/` | A mod home: `AGENTS.md`, `CLAUDE.md`, `_game/`, `_sdk/`, `_saves/` | alone |
| `emulator-home/` | An emulator home: `AGENTS.md`, `CLAUDE.md`, `_game/`, `_sdk/` | alone |
| `suite/` | A framework suite's `AGENTS.md`, `CLAUDE.md`, `README.md` | alone |
| `asset-set/` | A library set's card, plus `source/` and `export/` | alone |
| `research/` | `report.md`, `sources.md`, `data/` | alone |
| `idea/` | An idea's `README.md`: pitch, audience, open questions | alone |
| `user-claude/` | Your `~/.claude/WORKSTATION.md`: where projects live, and the stay-inside rule | by hand, once per PC (`README.md`) |

Roblox repos come from `rojo init`. Web and desktop apps come from their
official generators, with `repo-base` added on top using `-Merge`.

Keep templates short. A project's files say what's specific to it, because the category rules already load from the
category's `CLAUDE.md`. HTML comments (`<!-- -->`) in the Markdown are prompts to fill in; Claude Code strips them
from its context.

The `.claude/settings.json` files in `game-home/`, `game-godot/` and `godot-project/game/` copy
`.claude/settings.json`, because a session started in a game home or its `game/` doesn't inherit it.
The Godot ones also allow `godot` and the asset sync script. When the workspace settings change, change these
copies and the games that already have them.

`godot-project/game/` is a committed repo, so its `settings.json` holds no paths to this PC (`AGENTS.md` → Paths).
The workspace rules that name paths (`Edit(//d/Old/**)`…) go in its `settings.local.json`, which git ignores.
