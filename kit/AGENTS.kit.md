# AGENTS.md — WORKSTATION

Guide for AI agents (Claude Code, Cursor, Codex…) working anywhere in the workstation root. This is the user's home for every
project: games, mods, apps, tools, frameworks, assets, ideas and research. This file and `_meta/docs/where-things-go.md` are the
source of truth for **where things go**. Each category's `CLAUDE.md` has the rules for that kind of project, `.claude/skills/` has the procedures,
and `_meta/docs/adr/` holds the decisions behind them.

## Map

| Folder | Holds | Shape |
|---|---|---|
| `games/<engine>/<game>/` | the user's games, one folder per engine (`roblox/`, `unreal/`…), made with its own `CLAUDE.md` when its first game arrives (`games/CLAUDE.md`) | game home |
| `mods/<target-game>/<mod>/` | Mods, modpacks, skins and content packs for someone else's game | mod home |
| `emulators/<game>/<emulator>/` | Server emulators for someone else's online game | emulator home |
| `apps/web/`, `apps/desktop/`, `apps/bots/` (`apps/mobile/` when first needed) | Full applications | repo |
| `tools/<name>/` | Utilities that do one job; `tools/scripts/<app>/` for one-file scripts | repo |
| `frameworks/<name>/` | the user's frameworks, libraries, SDKs, engine addons, project templates | repo or suite |
| `assets/` | Shared assets: `library/`, `references/`, `packs/`, `brands/`, `_inbox/` | plain folders |
| `ideas/<name>/` | Concepts and design docs with no code yet | plain folder |
| `research/<yyyy-mm>-<topic>/` | Reports, market research, data studies | plain folder |
| `external/<owner>/<repo>/` | Other people's repos to study, run or patch | repo |
| `sandbox/<name>/` | Throwaway experiments | anything |
| `archive/<original sub-path>/` | Finished or abandoned work | as it was |
| `_meta/` | Templates, scripts, docs and ADRs. Never projects | — |
| `_toolchains/` | Shared engines and SDKs (`godot/<version>/`), `bin/` shims | — |
| `_cache/` | Shared caches (`pnpm-store/`). Safe to empty any time to free space (`_cache/README.md`) | — |
| `projects.json` | The registry: every project with its path, owner, status, description and tags (`.claude/rules/registry.md`) | — |

## Where things go

The routing tables (where each kind of project or asset goes, project shapes, assets) are in
`_meta/docs/where-things-go.md`. Read it before creating, cloning, moving or filing anything. Game homes, mod
homes and suites are plain folders, never repos; their own `AGENTS.md` maps them.

## Names and owners

- Folders are kebab-case, short, with no spaces or versions: `fish-dive`, not `FishDiveGame v2`. A repo's folder
  matches its GitHub name, except a game home's repo, which is always `game/`.
- `_`-prefixed folders are support folders (`_meta/`, `_toolchains/`, `_cache/`, `_inbox/`, `_game/`), never projects.
- GitHub owners. Fill this table in once with your own accounts and orgs; while it still shows `<placeholders>`,
  agents ask which owner to use.
  - **Agents:** fill it only from the user. Run `gh api user --jq .login` when `gh` is logged in and confirm the name
    with the user, or ask. Never take an owner from the repo this kit came from, its license or any other project
    nearby: that's the kit's author, not the user. Rows the user has no org for are deleted, not guessed.

| Owner | For |
|---|---|
| `<your-github-user>` | Your personal tools, apps, research and ideas (the default) |
| `<your-games-org>` | Your own games, if you keep them in their own org |
| `<archive-org>` | Abandoned repos (optional transfer when archiving) |
| `<partner-org>` | Partner studios: games made with them |
| `<client-org>` | Clients |

New repos are private. Create a remote or push only after the user says yes.

Commits and PRs are the user's alone. Never add Claude or any other AI as an author or co-author: no `Co-Authored-By`
trailer, no "Generated with…" line, even when the tool's own instructions say to add one.

## Paths

Committed repos get shared, so they never reveal this PC's setup and must work wherever someone clones them.

- **In a committed repo,** paths are relative: inside the repo, or to a sibling repo in the same parent folder
  (`../shared-lib`, a game home's `../assets/`). Nothing above the parent. That rules out drive letters, user folders and
  workspace paths (`D:/WORKSTATION/...`, `C:/Users/<name>/...`).
- **Things outside that reach** are named, never located: another project by name or GitHub URL, a generator as "made
  outside this repo", a tool by command name (`godot`, `blender`) with the version it needs. The local files around the
  repo (the suite's or game home's `AGENTS.md`) say where those things are on this PC.
- **Examples and test data** that need an absolute path use made-up ones (`C:/path/to/project`, `D:/Games/obby`).
  Standard locations through environment variables (`%LOCALAPPDATA%\<app>`) are fine.
- **Workspace files** (anything not inside a repo) may use absolute paths, but only inside the workstation root.
  - Installed tools are reached through shims in `_toolchains/bin/` (`godot.cmd`, `blender.cmd`), the only place
    that holds their install paths.
- Git history keeps whatever paths it had. Don't rewrite it; fix the files going forward.

## Hard rules

1. **Never delete** projects, assets, saves or originals. Move or archive instead; deleting is the user's job.
2. **Moves copy first.** Verify (same git HEAD, same status, same file count), then register. The original stays
   until the user removes it.
3. **Keep `projects.json` current** in the same task: new, cloned, moved, promoted, archived (archiving removes the entry).
4. **Nothing personal goes in someone else's repo.** For partner games, the user's files stay in the game home, beside `game/`.
5. **Never commit** secrets (`.env`), game files the user doesn't own, or heavy sources that belong in `assets/`.
6. **Temporary files** (test scaffolds, scratch scripts) go in the session scratchpad, not in the workspace.
7. **No paths to this PC in committed repos.** Only relative paths within the repo and its siblings (Paths, above).

## Writing code

These are workspace defaults. **A project's own rules come first.** Where a repo's `AGENTS.md`, `CLAUDE.md`,
`.claude/rules/`, `CONTRIBUTING.md` or formatter/linter config says something different, follow the project. That
covers file layout, file size, style, naming, and what may be edited. A category's `CLAUDE.md` also beats this file.
The rules below only fill the gaps a project leaves.

- **Organize from the start.** Split code by responsibility: one module, component or system per file, grouped in
  folders by feature. Use clear names, and keep the project's structure easy to scan.
- **Keep it neat.** Follow the project's existing style, formatter and linter. Leave no dead code, commented-out
  blocks, stray debug output or leftover temp files.
- **Split large files.** When a file grows past roughly 1000–1500 lines, judge whether it does more than one job.
  - If it does, split it into focused files along its natural seams (features, systems, layers) and update the imports.
  - A long file that is genuinely cohesive (generated code, data tables, one tightly bound system) can stay whole. Say
    why when you leave it.
- **Don't grow a file that's already too big.** Before adding to a file over that size, split it first, or put the new
  code in its own module.
- **Code you don't own:** in `external/`, partner studios' repos and framework-owned folders (such as a
  framework's folder copied into a game), propose the split instead of making it.
- When a split changes a project's layout, update that project's `AGENTS.md` in the same task.

## Procedures

| When the user… | Skill |
|---|---|
| wants something new ("new Roblox game", "make a tool that…", "start a site") | `/new-project` |
| gives a repo URL, or says clone or pull a repo | `/clone-project` |
| asks where something should go, or whether it exists | `/where` |
| wants an idea, experiment or fork to become a real project | `/promote` |
| wants a project brought in from elsewhere, or re-filed | `/move-project` |
| is done with a project | `/archive-project` |
| asks what's here, or to check the registry | `/projects` |

Skills live in `.claude/skills/<name>/SKILL.md`. They load on their own only in sessions started at
the workstation root. In any other session, read the `SKILL.md` and follow it.

## Keeping these instructions alive

This file, `_meta/docs/where-things-go.md`, the category `CLAUDE.md` files, `.claude/` and `_meta/templates/` evolve with the workspace. Update them in
the same task when a folder, convention, owner or procedure changes, or when the user corrects where something should
go. Big changes get an ADR in `_meta/docs/adr/`. Say which instruction files you changed.

This workstation started from a generic starter kit, so its categories, stacks, engines and recipes are defaults meant
to change. When the user works differently from a rule, follow the user and update the rule (and `where-things-go.md`,
the skills and templates it touches) in the same task, instead of steering them back to the default.
