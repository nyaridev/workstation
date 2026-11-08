---
name: move-project
description: Bring an existing project into the workstation from another folder or drive, or re-file one between categories. Copies, verifies, fixes hard-coded paths and registers it; never deletes the original. Use when the user says move, migrate, bring in, import or re-file a project.
argument-hint: "<source path or project name> [target path]"
---

# Move a project in

1. **Source and target.** Route the project with `AGENTS.md` and `_meta/docs/where-things-go.md`, and work out how
   its pieces split: repo → `game/`, art and sound sources → `assets/`, place saves → `saves/`, and so on.
2. **Inspect** every repo inside the project:
   - Run `git status --short`, and check for unpushed commits with `git log @{u}..` when there's an upstream.
   - If anything is dirty or unpushed, tell the user and ask before going on.
   - Note the size: `Get-ChildItem -Recurse -File | Measure-Object Length -Sum`.
3. **Confirm once:** the piece-by-piece plan, the size, and that the original stays untouched.
4. **Copy.**
   - For a game home, create the home first:
     `new-from-template.ps1 -Template game-home,game-<engine> -Destination <home> -Name <name>`. If the project already
     has its own `AGENTS.md` or `CLAUDE.md` at its root, copy those over the templated ones, then add the
     template's "Rules below this folder" section back to the `CLAUDE.md`.
   - Copy each piece with robocopy, skipping folders that can be rebuilt (exit codes 0–7 mean success):
     `robocopy "<src>" "<dst>" /E /COPY:DAT /DCOPY:DAT /XD node_modules .venv venv target .godot __pycache__ /R:1 /W:1 /NFL /NDL /NP`
   - Loose files (`*.rbxl` saves, `.jsx` scripts) are copied, never moved.
5. **Verify:**
   - each repo's `git rev-parse HEAD` matches the original;
   - `git status --short` matches;
   - file counts match, apart from the skipped folders.
6. **Fix hard-coded paths.** Search the copy for its old location (both slash styles) in
   `AGENTS.md`, `CLAUDE.md`, `.claude/`, configs and scripts.
   - Replace them with the new paths. Godot paths become `_toolchains/godot/<version>/…`.
   - Show the changes, and commit them inside a repo only if the user agrees.
   - In a game home, mod home, emulator home or suite, list every folder below it with its own `CLAUDE.md`, `.claude/rules/` or
     `.claude/skills/` in the home's `CLAUDE.md` (`.claude/rules/instructions.md`). `scan-projects.ps1` must print no
     `not listed` line for it.
7. **Rebuild** what was skipped, if the user wants: `pnpm install`, `uv sync`, `rokit install`, a Godot import.
8. **Register** the project in `projects.json`, with where it came from in `notes`.
9. **The original stays.** Tell the user it's safe to remove it themselves once they've opened the new copy. Never
   delete it.
