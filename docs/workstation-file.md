# .workstation

Every project describes itself in a `.workstation` file in its main folder: JSON, with no extension. People, agents
and the Workstation app all read and write it. A project's path is where its file is, so the file never names one.

The workstation root has a `.workstation` too, holding only `{ "version": 1 }`: it marks the folder as a workstation.

## Where it goes

- **A repo** (an app, a tool, a framework, a suite's repo): at the repo's root, committed with it.
- **A home** (game, mod or emulator home) and a **suite**: in the home's or suite's folder, never in the repo inside
  (`game/`). So a partner's repo never gets one.
- **A plain folder** (research, an idea, an asset pack): in that folder.
- **Someone else's repo** (`external/`), or a **template repo** other repos are made from: at its root, but kept out
  of git (add `.workstation` to the repo's `.git/info/exclude`), so it never lands in someone else's history or in
  every repo made from the template.
- Sandbox experiments, library asset sets and one-file scripts get none.

The app finds files up to **4 folder levels below the root** (5 under `archive/`): the deepest place a project sits
is a suite repo in a group, `frameworks/<suite>/<group>/<repo>/`. It doesn't look inside `_`-prefixed support
folders, dependency and build folders, or git repos (a repo's file is at its root).

## File

```json
{
  "name": "Fish Dive",
  "kind": "game",
  "stack": ["Roblox", "Rojo"],
  "owner": "my-games",
  "status": "prototyping",
  "description": "Roblox diving simulator: dive deeper, catch rarer fish, upgrade your gear.",
  "tags": ["roblox", "simulator"],
  "notes": "Started from the Roblox recipe with Rojo 7."
}
```

## Fields

| Field | Required | What |
| --- | --- | --- |
| `name` | yes | Display name: `Fish Dive` |
| `kind` | yes | `game` · `mod` · `emulator` · `app` · `tool` · `framework` · `suite` · `asset-pack` · `research` · `idea` · `external` |
| `stack` | yes | Short list of what it's built with: `["Tauri", "React"]`, `["Godot 4.7", "GDScript"]`. `[]` when there's nothing to name |
| `owner` | yes | GitHub owner of the main repo, `"local"` if it has no remote, `null` for plain folders |
| `status` | yes | Where it stands (below) |
| `description` | yes | One sentence: what it is. No history, no setup details |
| `tags` | yes | What to sort and filter by (below). `[]` is fine |
| `notes` | no | One line: partner or client, why it was cloned, setup history, gotchas. No paths to this PC: the file is committed |
| `milestones` | no | The plan in steps, in order, in one or more tracks (below) |

## Statuses

| Status | For |
| --- | --- |
| `concept` | An idea, nothing planned yet (new ideas start here) |
| `planning` | Designing what to build |
| `researching` | A study in progress (new research starts here) |
| `prototyping` | Building a first version (new projects start here) |
| `in-development` | Being built for real |
| `released` | Shipped: people use it |
| `maintained` | Shipped and still looked after, nothing big planned |
| `complete` | Finished work that doesn't ship: a study, a document, an asset set |
| `on-hold` | Paused |

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

## Milestones

A project with planned work in steps keeps its plan in `milestones`: a list in order, where the first one not done
is the one being worked on. The app shows it under the project's row, as a bar per plan, and in a side panel.

```json
"milestones": [
  { "name": "M1 Login server", "done": true, "track": "Server", "description": "Accounts, sessions and the handshake." },
  { "name": "M2 World server", "done": false, "track": "Server", "description": "Maps, movement and NPCs." },
  { "name": "R1 Asset loader", "done": false, "track": "Rewrite", "description": "Reads the original game's archives." }
]
```

| Key | Required | What |
| --- | --- | --- |
| `name` | yes | Short, with its number first: `M3 Batch rename`. Unique within its track |
| `done` | no | `true` once it's finished; missing means `false` |
| `track` | no | Which plan it belongs to, when a project has several (below). Leave it out when there's one plan |
| `description` | no | One short line on what it covers, shown in the side panel |

- **Order is the plan.** The first milestone not done is the current one; when every milestone is done, the app hides
  the project's milestone line.
- **Several plans side by side** are tracks: give every milestone a `track`, one name per plan (`"Server"` and
  `"Rewrite"` for a server emulator and a rewrite of the same game; `"App"` and `"Registry"`). Each track has its own
  order and its own current milestone, its own bar under the row and its own tab in the side panel. Milestones of
  one track can be interleaved with another's; only their order within the track counts. Give each track its own
  number prefix (`M1`, `R1`) so names stay clear.
- Most projects have no milestones; leave the key out rather than writing `[]`.

## Rules

- **One file per project.** Keys in the order above, two-space indent, UTF-8, a newline at the end.
- Game homes, mod homes and emulator homes get one file, in the home. Suites get one for the suite and one per repo.
- **Moving or archiving a project moves its file with it.** Nothing else to update. The app shows archived folders
  in its Archive group and never flags them.
- Anything the app doesn't know (an extra key) is kept as it is when the app writes the file.

## New file

`_meta/templates/workstation-file/` holds this, with `{{Title}}` and `{{Owner}}` filled when it's applied as a
template. Fill in the rest:

```json
{
  "name": "",
  "kind": "",
  "stack": [],
  "owner": "local",
  "status": "prototyping",
  "description": "",
  "tags": []
}
```
