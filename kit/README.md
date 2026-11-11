# WORKSTATION

Your home for every project. Open Claude Code in this folder and say what you want:

| Say | Skill |
|---|---|
| "New Roblox game called Fish Dive" | `/new-project` |
| "Clone https://github.com/…" | `/clone-project` |
| "Where should a Discord bot for my group go?" | `/where` |
| "Turn the mining game idea into a Godot game" | `/promote` |
| "Move my old site in from D:/Old/site" | `/move-project` |
| "I'm done with farm-game" | `/archive-project` |
| "What's in here?" | `/projects` |

## Make it yours

This workstation started from a starter kit, and it's meant to become your own. The layout, rules and recipes are a
starting point, not a standard to keep:

- **Folders:** keep the categories you use, delete the ones you don't, and add your own. A new category gets a
  `CLAUDE.md` with its rules and a row in the `AGENTS.md` map.
- **Stacks and engines are defaults:** the app stack in `apps/CLAUDE.md`, the Python shape in `tools/CLAUDE.md`, and
  the Roblox and Godot setups in `games/`. Swap in the tools you actually use.
- **The rules follow you:** when you tell Claude you work differently, it updates the rule in the same task, so the
  rules keep matching how you work instead of pulling you back to the kit's defaults.

## First steps

1. Fill in the GitHub owners table in `AGENTS.md` (Names and owners) with your own account and orgs, and delete
   the rows you don't need. `gh api user --jq .login` shows your GitHub username.
2. Go through "Make it yours" above: delete the categories and engines you won't use, and set your own stacks.
3. Put `_toolchains/bin/` on your PATH if you'll use the shims there (`_toolchains/README.md`).
4. Tell Claude Code about this folder everywhere, not only in sessions opened here:
   - Copy `_meta/templates/user-claude/WORKSTATION.md` to `~/.claude/WORKSTATION.md` and replace every
     `<workstation>` in it with this folder's path. It says where projects live, keeps sessions inside their own
     folder, and lets any session update `projects.json`.
   - Add the line `@WORKSTATION.md` to `~/.claude/CLAUDE.md` (create the file if it doesn't exist).

5. Open the Workstation app and add this folder, or keep using it with Claude Code alone.

## Folders

| Folder | What goes there |
|---|---|
| `games/` | Your games, by engine: `roblox/`, `godot/`, … Each game is a **game home** (below) |
| `mods/` | Mods for other people's games, one folder per game |
| `emulators/` | Server emulators for other people's online games, one folder per game |
| `apps/` | Full applications: `web/`, `desktop/` (and `bots/`, `mobile/` later) |
| `tools/` | Utilities that do one job; `tools/scripts/` for one-file scripts |
| `frameworks/` | Your frameworks and libraries; a family of repos lives here as a suite |
| `assets/` | Shared assets: `library/` (reusable sets), `references/`, `packs/` (assets you sell), `brands/` |
| `ideas/` | Game and app ideas before any code |
| `research/` | Reports and analysis |
| `external/` | Other people's repos, as `owner/repo` |
| `sandbox/` | Throwaway experiments |
| `archive/` | Finished or abandoned projects |
| `_meta/` | Templates, scripts, docs and decisions (ADRs) |
| `_toolchains/` | Shared engines: Godot versions, shims |
| `_cache/` | Shared caches (pnpm store); safe to empty any time (`_cache/README.md`) |

## A game

```
games/roblox/fish-dive/        a plain folder (not git), backed up as a whole
├─ AGENTS.md  CLAUDE.md        the game's map and rules
├─ docs/                       design: pitch, systems, decisions
├─ game/                       the git repo (code + place, or the Godot project)
├─ assets/                     PSDs, .blend, audio, AI generations: never in git
├─ saves/                      place snapshots (Roblox)
└─ builds/                     exported builds (Godot)
```

## Rules of thumb

- One idea = one folder. Claude checks for an existing project before making a new one.
- Heavy assets never go in git. They live in the game home's `assets/`, so **back up this drive**.
- New repos are private, and nothing is pushed or created on GitHub without your yes.

## Where the rules live

- `AGENTS.md`: the source of truth for every agent (map, routing, shapes, owners, hard rules).
- `CLAUDE.md`: Claude Code notes. It imports `AGENTS.md`.
- `<category>/CLAUDE.md`: the rules for each kind of project. They load in every session inside that category.
- `.claude/`: workspace settings, admin rules and skills.
- `projects.json`: the registry, with tags (`_meta/docs/projects-json.md`); the Workstation app shows it.
