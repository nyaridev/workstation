@AGENTS.md

## Claude Code notes

- Every `CLAUDE.md` from the session folder up to here loads at start: this file, then the category's
  (`games/roblox/CLAUDE.md`…), then the project's. Put each rule at the level it belongs to and never repeat a parent's.
  Rules in folders *below* the session folder don't load by themselves: `.claude/rules/instructions.md` says what to
  read before working there.
- Skills and `.claude/settings.json` load only in sessions started at the workstation root. Elsewhere, read
  `.claude/skills/<name>/SKILL.md` when a procedure applies.
- Game homes and Godot `game/` repos carry their own `.claude/settings.json`, a copy of the workspace one (from
  `_meta/templates/`). When you change `.claude/settings.json` here, update those copies too. In a `game/` repo,
  the rules that name paths on this PC (`Edit(//d/Old/**)`…) go in `.claude/settings.local.json`, not the
  committed `settings.json`.
- After creating, cloning or moving a project, offer to switch the session into it (the desktop app's change-directory
  tool, or `/cd`).
- Game homes aren't repos. Open the session on the game home for design and asset work, or on the folder you code in
  for code with git features: `game/`, or `game/<folder>/` when that folder has its own `.claude/` (Roblox). The
  game's `CLAUDE.md` loads either way.
- Files that MCP servers and generators make go to the nearest `_inbox/`.
- Windows 11, with both PowerShell and Git Bash. Use forward slashes in paths inside files. Run workspace scripts with
  `pwsh -NoProfile -File _meta/scripts/<script>.ps1`.
