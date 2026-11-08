# Instructions: what loads, and what to read

Rules sit at the level they belong to (`CLAUDE.md` → Claude Code notes). Claude Code only loads some of them by itself,
so read the rest before working in their folders.

## What loads by itself

| Loads | When |
|---|---|
| Every `CLAUDE.md` from the session folder up to the workstation root, plus the `AGENTS.md` each one imports | At start |
| `.claude/rules/` (this folder) | At start, in any session inside the workspace |
| A subfolder's `CLAUDE.md` (and its `@AGENTS.md`) | Only after a file in that subfolder is read, and not always reliably |
| A subfolder's `.claude/rules/` and `.claude/skills/` | Never from a parent folder: only in a session opened on that folder |

Subfolders with their own instructions are the repos inside homes and suites: `game/` and `game/<folder>/` in a game
home, each mod repo in a mod home, each emulator repo in an emulator home, each repo in a suite (`frameworks/<suite>/<repo>/`…). A plain `AGENTS.md` without a
`CLAUDE.md` next to it never loads.

## Before working in a subfolder

Before editing anything in a folder below the session folder that has its own `CLAUDE.md`, `AGENTS.md` or
`.claude/`:

1. Read its `AGENTS.md` (or `CLAUDE.md` and what it imports).
2. List its `.claude/rules/` and read every rule that covers the files you'll change. When unsure, read them all.
3. When its `.claude/skills/` has a skill for the task, read that `SKILL.md` and follow it.
4. Do the same for every level between the session folder and the files (`game/`, then `game/<folder>/`).

For long code work in one repo, suggest opening the session on that repo instead, so all of it loads.

## Never

- `@import` a subfolder's `AGENTS.md` or rules into a parent's `CLAUDE.md`. Imports load in every session below that
  parent, and different repos' rules clash. Point to them in the parent's map instead.
- Copy a repo's rules into the home or the workspace. Each rule lives once, at its own level.

## Keeping it findable

Every new or changed project keeps these true (`/new-project`, `/clone-project`, `/move-project` and `/promote` check
them):

- **Every folder with its own instructions** has an `AGENTS.md` and a `CLAUDE.md` that starts with `@AGENTS.md`. A
  third-party repo that has only `AGENTS.md` gets a `CLAUDE.local.md` (`/clone-project`).
- **The parent's `AGENTS.md` map** gives that folder a row naming its rules: `Rules: game/AGENTS.md`, or
  `Rules: AGENTS.md, .claude/rules/` when it has a rules folder.
- **A home's or suite's `CLAUDE.md`** has the "Rules below this folder" note from its template, listing the subfolders
  that hold `CLAUDE.md`, `.claude/rules/` or `.claude/skills/`. Update the list when one is added.
