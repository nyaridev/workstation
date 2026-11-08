# projects.json

The registry of a workstation: one entry per project, at the workstation root (`<root>/projects.json`). People,
agents and the Workstation app all read and write it. The app finds projects on disk by their place and matches them
to these entries by `path`.

## File

```json
{
  "version": 1,
  "projects": [
    {
      "name": "Fish Dive",
      "path": "games/roblox/fish-dive/",
      "kind": "game",
      "stack": ["Roblox", "Rojo"],
      "owner": "my-games",
      "status": "prototyping",
      "description": "Roblox diving simulator: dive deeper, catch rarer fish, upgrade your gear.",
      "tags": ["roblox", "simulator"],
      "notes": "Started from the Roblox recipe with Rojo 7."
    }
  ]
}
```

## Fields

| Field | Required | What |
| --- | --- | --- |
| `name` | yes | Display name: `Fish Dive` |
| `path` | yes | From the workstation root, forward slashes, trailing slash: `games/roblox/fish-dive/`. Unique |
| `kind` | yes | `game` · `mod` · `emulator` · `app` · `tool` · `framework` · `suite` · `asset-pack` · `research` · `idea` · `external` |
| `stack` | yes | Short list of what it's built with: `["Tauri", "React"]`, `["Godot 4.7", "GDScript"]`. `[]` when there's nothing to name |
| `owner` | yes | GitHub owner of the main repo, `"local"` if it has no remote, `null` for plain folders |
| `status` | yes | `planning` · `prototyping` · `in-development` · `released` · `on-hold` |
| `description` | yes | One sentence: what it is. No history, no setup details |
| `tags` | yes | What to sort and filter by (below). `[]` is fine |
| `notes` | no | One line: partner or client, why it was cloned, setup history, gotchas |

## Tags

Lowercase kebab-case (`co-op`, `game-design`), as many as help. Reuse a tag that already exists before making a new
one; the app lists every tag in use. Starter list:

| Group | Tags |
| --- | --- |
| Platform | `roblox`, `godot`, `rust`, `web`, `desktop`, `steam` |
| Genre | `simulator`, `incremental`, `horror`, `survival`, `voxel`, `mmorpg`, `battlegrounds` |
| Play | `multiplayer`, `co-op`, `pvp` |
| Who | `partner`, `client`, `public` |
| Topic | `ai`, `agents`, `wiki`, `asset-pipeline`, `game-design`, `monetization`, `editor`, `mcp` |
| Family | one tag per framework or suite you build on, `workstation` |

## Rules

- **One entry per project,** sorted by `path` byte by byte (so `ui-kit/` comes before `ui/`). Keys in the order
  above, two-space indent, UTF-8.
- Game homes, mod homes and emulator homes get one entry, with the home's path. Suites get one entry for the suite and
  one per repo.
- Sandbox experiments, library asset sets and one-file scripts get no entry.
- Archived projects get no entry: archiving one removes its entry, and nothing under `archive/` is listed. The app
  shows archived folders in its Archive group without flagging them.
- Anything the app doesn't know (an extra key) is kept as it is when the app writes the file.

## New entry

Copy this, fill it in, and insert it at its place by `path`:

```json
{
  "name": "",
  "path": "",
  "kind": "",
  "stack": [],
  "owner": "local",
  "status": "prototyping",
  "description": "",
  "tags": []
}
```
