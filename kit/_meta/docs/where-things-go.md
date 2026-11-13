# Where things go

Routing tables for creating, cloning, moving and filing projects and assets in the workstation root. The skills
(`/where`, `/new-project`, `/clone-project`, `/promote`, `/move-project`) read this file; `AGENTS.md` keeps the map.

## Where does it go?

| You're making… | Goes to |
|---|---|
| A Roblox game | `games/roblox/<game>/` |
| A Godot game / another engine / an HTML5 game | `games/godot/<game>/` / `games/<engine>/<game>/` |
| A mod, modpack, skin or content pack for someone else's game | `mods/<target-game>/<mod>/` |
| A server emulator for someone else's online game (the real client connects to it) | `emulators/<game>/<emulator>/` |
| A website, web app, browser extension, hosted API | `apps/web/<name>/` |
| A desktop or local-first app (Tauri, Electron, .NET, Python GUI, apps that open in a browser *or* a window) | `apps/desktop/<name>/` |
| A bot or always-on service (Discord/Twitch bot, AI VTuber) | `apps/bots/<name>/` |
| A tool that does one job (CLI, converter, downloader, AI pipeline, small GUI utility) | `tools/<name>/` |
| A one-file script for an app (Photoshop `.jsx`, Blender `.py`, PowerShell) | `tools/scripts/<app>/` |
| A Studio plugin, VS Code extension or Blender add-on that isn't part of a framework | `tools/<name>/` |
| A framework, library, SDK, engine addon or project template | `frameworks/<name>/`; a family of repos: `frameworks/<suite>/<repo>/` |
| A companion app, wiki or site for **one** game | inside that game home: `tools/<name>/`, `wiki/`, `site/` |
| A reusable asset (pack, AI-generated set, SFX library, font) | `assets/library/<category>/<set>/` |
| Reference or inspiration material | `assets/references/<topic>/`, or the game's `assets/_reference/` |
| An asset that is the product (UGC items, model or icon pack for sale) | `assets/packs/<name>/` |
| Logos and brand kits | `assets/brands/<brand>/` |
| A report, market research, a data study | `research/<yyyy-mm>-<topic>/` |
| An idea or design with no code or engine yet | `ideas/<name>/` |
| Someone else's repo to study, run or patch | `external/<owner>/<repo>/` |
| A quick test, tutorial or experiment | `sandbox/<name>/` |
| Something finished or abandoned | `archive/<original sub-path>/` |

- A repo the user or a partner studio owns goes by what it is, never to `external/`.
- When two rows fit, pick one and say why. Ask only when it's truly 50/50.
- **One idea = one folder.** Before creating anything, search the project files (`scan-projects.ps1 -Json`: each project's name, description and tags) and the
  target folder for the same thing under another name. If it exists, offer to continue, promote or move it in instead.

## Project shapes

| Shape | What | Where |
|---|---|---|
| **Repo** | The folder is the git repo | apps, tools, frameworks, external |
| **Game home** | A plain folder, never a repo. The game's repo is `game/` inside it; assets, design docs, saves and builds sit beside it, outside git | `games/<engine>/<game>/` |
| **Suite** | A plain folder of related repos, with an `AGENTS.md` that maps them | `frameworks/<suite>/` |
| **Mod home** | A plain folder per target game: `_game/` (vanilla copy), `_sdk/`, `_saves/`, one repo per mod | `mods/<target-game>/` |
| **Emulator home** | A plain folder per target game: `_game/` (client copy), `_sdk/`, `_external/` (other people's repos it reads), one repo per emulator | `emulators/<game>/` |

Game homes, mod homes, emulator homes and suites keep an `AGENTS.md` with a map of their folders. Details: `games/CLAUDE.md`,
`mods/CLAUDE.md`, `emulators/CLAUDE.md`, `frameworks/CLAUDE.md`. Items in `assets/`, `ideas/`, `research/` and `sandbox/` are plain folders
where git is optional.

## Assets in one minute

| The asset is… | It lives in |
|---|---|
| A source or working file for one game (PSD, `.blend`, raw audio, AI generations) | that game home's `assets/`, outside git |
| A game-ready file the engine loads to build | inside the game repo (Godot: `game/assets/`, a copy of `export/`) |
| Uploaded to Roblox | its source stays in `assets/`; the `rbxassetid` goes on its card |
| Reused by 2+ projects, or downloaded or bought | `assets/library/<category>/<set>/`, copied into each project that uses it |
| Reference or inspiration | `assets/references/` or the game's `assets/_reference/`; never ships |
| The product itself (UGC items, packs for sale) | `assets/packs/<name>/` |

New AI generations (image tools, MCP servers) land in the nearest `_inbox/` first.
