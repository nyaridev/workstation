---
name: archive-project
description: Archive a finished or abandoned workstation project — move it to archive/ at the same sub-path (its .workstation goes with it), and optionally move its GitHub repo to the archive org. Use when the user says archive, retire, shelve, abandon or is done with a project.
argument-hint: "<project name or path>"
---

# Archive a project

1. **Find it** by its `.workstation` (`scan-projects.ps1`). Check every repo inside it: `git status` should be clean, with nothing unpushed. If
   not, show what's pending and ask whether to commit, push, or archive it as it is.
2. **Confirm once:** `<path>` → `archive/<path>`, and whether to move the GitHub repo to
   the archive org from `AGENTS.md` → Names and owners (optional, for the user's own repos only, and only when
   that org is filled in).
3. **Move** it with `Move-Item` to `archive/<same sub-path>`, creating the parent folders. If a running app is
   watching the folder, copy instead and let the user remove the old one.
4. **Transfer the repo**, only with an explicit yes:
   1. Run `gh api -X POST repos/<owner>/<repo>/transfer -f new_owner=<archive-org>`. GitHub may ask the user to confirm.
   2. Point the local remote at the new home: `git remote set-url origin https://github.com/<archive-org>/<repo>`.
   
   If the user would rather keep the repo where it is but read-only, offer `gh repo archive <owner>/<repo>` instead.
5. **Its `.workstation` moved with it,** so there's nothing to update (`.claude/rules/registry.md`). For a game home,
   set the `game.json` status to `archived`.
6. No files are deleted.
