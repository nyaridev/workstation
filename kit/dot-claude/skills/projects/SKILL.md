---
name: projects
description: Show what's in the workstation and check the projects.json registry against the disk — unregistered or missing projects, uncommitted or unpushed repos, stale sandbox folders. Use when the user asks what projects they have, wants an overview or status, or asks to check, refresh or clean up the registry.
argument-hint: "[category or filter]"
---

# Projects overview

1. **Run** `pwsh -NoProfile -File _meta/scripts/scan-projects.ps1`. Add `-Category <name>` to narrow it
   down, or `-Json` for structured output.
2. **Report briefly.** Start with the counts per category. Then list the problems:
   - **unregistered** folders;
   - **missing** paths;
   - repos with uncommitted changes or unpushed commits;
   - sandbox folders untouched for 60+ days;
   - **not listed** folders: rules below a home or suite that its `CLAUDE.md` doesn't point to.
3. **Fix the registry** without asking (`.claude/rules/registry.md`): add unregistered projects, with Kind, Stack and
   Owner read from the folder, and correct entries that disagree with the disk or GitHub. Say what changed.
   - Ask before removing an entry whose folder is missing.
   - Offer the rest: for each `not listed` folder, a row in that home's `CLAUDE.md` "Rules below this folder" table
     (`.claude/rules/instructions.md`), and `/archive-project` for stale work.
4. **Filters:** with a filter in `$ARGUMENTS` ("roblox", "partner", "in-development"), answer from `projects.json` (tags, kind, status, owner)
   directly.
5. **Other folders:** to see what's in a folder outside the workstation, run `scan-projects.ps1 -Root <folder>`.
