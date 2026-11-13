---
name: where
description: Answer where something belongs in the workstation, or whether it already exists, without creating anything. Use when the user asks where to put, keep, make or find a project, file, asset, mod, idea or repo ("where should a Discord bot go?", "where do UGC hats live?", "do I already have a mining game?").
argument-hint: "<what you want to make or store>"
---

# Where does it go?

Answer from `_meta/docs/where-things-go.md` and the target category's
`CLAUDE.md`. Change nothing.

1. **Classify** `$ARGUMENTS`: its kind, then the full path with a suggested kebab-case name
   (`games/roblox/fish-dive/`).
2. **Search** the project files (`scan-projects.ps1 -Json`: each project's name, description and tags) and the target folder for the same thing under any name. If
   something matches, lead with it ("You already have this at …").
3. **Reply in 2–4 lines:**
   - the path;
   - a one-line reason (which routing rule applies);
   - the project shape (repo / game home / mod home / emulator home / suite / plain folder);
   - the command to create it (`/new-project …` or `/clone-project …`).
4. If two homes fit, give your pick first, then the runner-up and what would change your mind.
