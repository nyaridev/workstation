---
name: promote
description: Turn an idea, sandbox experiment, third-party clone or archived project into a real project in its proper the workstation category — e.g. an ideas/ game design becomes a Godot or Roblox game home, a sandbox test becomes a tool, an external fork becomes the user's own app. Use when the user says promote, make it real, start building it, revive it, or move it out of ideas/, sandbox/, external/ or archive/.
argument-hint: "<path or name> [target kind or engine]"
---

# Promote

1. **Find the source** (from `$ARGUMENTS` or `projects.json`) and the target (from `AGENTS.md` routing).
   - For a game idea, ask which engine if that isn't settled.
   - Check the target doesn't exist yet.
2. **Confirm once:** source → target, what moves, and what gets added.
3. **Move** within the workspace with `Move-Item`; on the same drive it's a rename. If a running app may be watching
   the folder (a dev server), copy instead and tell the user they can remove the old one.
4. **Then, by case:**

   | Case | What to do |
   |---|---|
   | **Game idea → game home** (`games/<engine>/<name>/`) | See below |
   | **Other idea → project** | Create the project with `/new-project`'s recipe, then move the idea's `README.md` into it as `docs/idea.md` |
   | **Sandbox → category** | Move it, add what the category expects (`repo-base` with `-Merge`, git if missing), and register it |
   | **External fork → the user's own** | Move it to its category. Rename the remotes so the fork is `origin` and the original is `upstream`. Update the row's owner |
   | **Archive → active** | Move it back to the path it had before archiving (`archive/<sub-path>` → `<sub-path>`), with status `in-development` |

   **Game idea → game home.** The idea folder *becomes* the game home:
   1. Its `game.json`, `README.md`, `docs/`, `features/`, `scripts/` and `data/` stay at the home's root.
   2. Its `assets/` (cover, banner, gallery) stays. Add the missing home files with
      `new-from-template.ps1 -Template game-home,game-<engine> -Destination <home> -Name <name> -Merge`.
   3. Create the repo in `game/` as `/new-project` → `types/<engine>.md` describes (steps 2–4).
   4. Set the `game.json` status to `prototyping`.
5. **Fix paths** that point at the old location: `git grep -n "<old path>"` in repos, plus `AGENTS.md`, `CLAUDE.md` and
   configs. Update the `projects.json` entry (path, kind, stack, status). Check the instructions as `/new-project` step 4 does: every folder with its
   own rules is listed in its home's `CLAUDE.md`, and `scan-projects.ps1` prints no `not listed` line.
6. Offer to switch the session into the new home.
