---
name: new-project
description: Create a new project in the workstation in the right folder, scaffolded, under git and registered — a game (Roblox, Godot, other engine), mod, web/desktop app, bot, tool, script, framework, asset pack, research study, idea or sandbox experiment. Use when the user wants to start, make, create or set up something new ("new Roblox game", "make me a tool that…", "start a website", "I have an idea for…").
argument-hint: "[what it is] [name]"
---

# New project

Creates the folder, scaffolds it from `_meta/templates/`, sets up git, and registers it in
`projects.json`. The rules are in `AGENTS.md`.

## 1. Work out what it is

From `$ARGUMENTS` and the conversation, settle these:

- **Kind and path**, from the routing table in `_meta/docs/where-things-go.md`. If two rows fit, pick one and say why.
  Ask (AskUserQuestion, with your pick first) only when it's truly 50/50.
- **Name**: a kebab-case slug (`fish-dive`) and a title (`Fish Dive`). Suggest one if the user gave none.
- **Owner** (repos only), from `AGENTS.md` → Names and owners. Default to the games owner for games and
  the personal owner for everything else. Ask for partner or client work, or while the table shows placeholders.
- **Stack**: the category's default (from its `CLAUDE.md`), unless the user asked for something else.

## 2. Check it doesn't exist already

Search `projects.json` and the target category for the same thing under any name
(`mining`, `mine`, `miner`…). If something matches, show it and offer to continue it, `/promote` it or
`/move-project` it in instead of making a second copy.

## 3. Confirm once

Show the path, kind, stack, owner and what gets created. Say that git stays local, with no remote yet, unless the
recipe offers one (Roblox). Ask one question, then go.

## 4. Scaffold

Read the category's `CLAUDE.md` first, then follow the recipe for the kind:

| Kind | Recipe |
|---|---|
| Roblox game | `types/roblox.md` |
| Godot game | `types/godot.md` |
| Game in another engine | `types/game-other.md` |
| Web, desktop or bot app | `types/app.md` |
| Tool, script or plugin | `types/tool.md` |
| Framework or suite | `types/framework.md` |
| Mod | `types/mod.md` |
| Server emulator | `types/emulator.md` |
| Asset set, pack or brand kit | `types/asset.md` |
| Research study | `types/research.md` |
| Idea | `types/idea.md` |
| Sandbox experiment | `types/sandbox.md` |

Recipes apply templates with:

```powershell
pwsh -NoProfile -File _meta/scripts/new-from-template.ps1 -Template <t1>,<t2> -Destination <path> -Name <slug> [-Title "<Title>"] [-Owner <owner>] [-Engine "<engine>"] [-Merge] [-DryRun]
```

- Templates apply in order, and a later one overwrites an earlier one file by file.
- Placeholders (`{{Name}} {{Title}} {{Module}} {{Owner}} {{Engine}} {{Date}}`) are filled in file contents and names.
- It refuses a destination that isn't empty unless you pass `-Merge`, which writes only the missing files.
- `_meta/templates/README.md` lists the templates.

Then fill in the HTML-comment prompts in the new `AGENTS.md`/`README.md` with what you know (the pitch, what it does).

**Check the instructions** once the recipe is done (`.claude/rules/instructions.md` → Keeping it findable):

- Each folder with its own instructions has a `CLAUDE.md` that starts with `@AGENTS.md`.
- For a game home, mod home, emulator home or suite: every folder below it with its own `CLAUDE.md`, `.claude/rules/` or
  `.claude/skills/` has a row in the home's `CLAUDE.md` "Rules below this folder" table, and a row in its `AGENTS.md`
  map. Setup scripts (a template's own `setup.ps1`) add such folders after the templates are applied, so check after them.
- `scan-projects.ps1` must print no `not listed` line for the new project.

## 5. Git (repos only)

Run `git init` in the repo folder (`game/` for a game home). Commit everything as
`Initial scaffold from WORKSTATION templates`, with no AI co-author lines. Don't add a remote here.

## 6. Register

Add the `projects.json` entry (`.claude/rules/registry.md`), with a one-sentence description and tags. Status is `planning` for ideas and `prototyping` for
everything else.

## 7. Offer the next steps

- **A private GitHub repo:** `gh repo create <owner>/<name> --private --source <repo folder> --push`, only after the
  user says yes. (Roblox games may already have one from the template step.)
- **Switch the session** into the new folder (the desktop app's change-directory tool, or `/cd`). For a game, switch
  to the game home itself.
- Anything the recipe lists as next (`rokit install`, a Godot import…).

Report what was created and where, and what wasn't done.
