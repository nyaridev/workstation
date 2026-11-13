---
name: projects
description: Show what's in the workstation and check every project's .workstation file — projects without one or with a broken one, uncommitted or unpushed repos, stale sandbox folders. Use when the user asks what projects they have, wants an overview or status, or asks to check, refresh or clean up the registry.
argument-hint: "[category or filter]"
---

# Projects overview

1. **Run** `pwsh -NoProfile -File _meta/scripts/scan-projects.ps1`. Add `-Category <name>` to narrow it
   down, or `-Json` for structured output.
2. **Report briefly.** Start with the counts per category. Then list the problems:
   - **no .workstation**: project folders without one;
   - **invalid**: files that don't parse or miss a field;
   - repos with uncommitted changes or unpushed commits;
   - sandbox folders untouched for 60+ days;
   - **not listed** folders: rules below a home or suite that its `CLAUDE.md` doesn't point to.
3. **Fix the files** without asking (`.claude/rules/registry.md`): write a `.workstation` for each project without
   one, with kind, stack and owner read from the folder, and correct files that disagree with the disk or GitHub. Say
   what changed.
   - Offer the rest: for each `not listed` folder, a row in that home's `CLAUDE.md` "Rules below this folder" table
     (`.claude/rules/instructions.md`), and `/archive-project` for stale work.
4. **Filters:** with a filter in `$ARGUMENTS` ("roblox", "partner", "in-development"), answer from the scan's `-Json` output (each
   project's tags, kind, status and owner) directly.
5. **Other folders:** to see what's in a folder outside the workstation, run `scan-projects.ps1 -Root <folder>`.
