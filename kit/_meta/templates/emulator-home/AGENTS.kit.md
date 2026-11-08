# AGENTS.md — {{Title}} emulators

Server emulators for **{{Title}}**. This folder is an **emulator home**: a plain folder, not a repo. Each emulator is
its own repo inside it. Rules: `emulators/CLAUDE.md`.

## The game

| | |
|---|---|
| Client version tested | <!-- e.g. 0.9.3.3171 --> |
| Client copy | <!-- `_game/<version>/`, or the install path --> |
| Protocol | <!-- transport, cipher, packet format, where it's documented --> |
| Reference data | <!-- repos in `_external/` (or `external/`) with maps, items, configs --> |

## Map

| Folder | What | In git? |
|---|---|---|
| `_game/` | Client copies, one per version, read-only | no |
| `_sdk/` | Packet logs, notes, tools | no |
| `_external/<owner>/<repo>/` | Other people's repos this home reads (`external/CLAUDE.md` rules) | their own repos |
| <!-- `emulator-name/` --> | <!-- what it runs --> | yes (its own repo) |
