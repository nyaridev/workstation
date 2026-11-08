---
name: clone-project
description: Clone a git repository into the right place in the workstation and register it — the user's own and partner repos by what they are (a game into a game home's game/ folder), third-party repos into external/<owner>/<repo>. Use when the user gives a GitHub or git URL, or says clone, pull, download or check out a repo ("clone github.com/x/y", "pull my hunt-a-pet repo").
argument-hint: "<url or owner/repo>"
---

# Clone a repo

1. **Parse** `$ARGUMENTS` into `<owner>/<repo>` (HTTPS, SSH or `owner/repo`).
   - Check whether it's already on disk: `projects.json`, or a folder with that remote.
   - If it is, say where and stop. Offer to `git pull` there instead.
2. **Look before cloning.** Run
   `gh repo view <owner>/<repo> --json name,description,primaryLanguage,repositoryTopics,isPrivate,defaultBranchRef`.
   If that isn't enough, read the README with `gh api repos/<owner>/<repo>/readme -H "Accept: application/vnd.github.raw"`.
   Markers that tell you what it is:

   | Marker | It's a… |
   |---|---|
   | `default.project.json` or `rokit.toml` | Roblox game or framework |
   | `project.godot` | Godot game |
   | `src-tauri/` | desktop app |
   | `package.json` with a web framework | web app |
   | `pyproject.toml` or `requirements.txt` with a CLI | tool |
3. **Route it** with `_meta/docs/where-things-go.md`:
   - **the user's repo or a partner/client org's** (`AGENTS.md` → Names and owners): route by what it is.
     - **A game** goes into a game home. Create the home first with
       `new-from-template.ps1 -Template game-home,game-<engine> -Destination games/<engine>/<name> -Name <name> -Owner <owner> -Engine "<engine>"`
       (`game-roblox` or `game-godot`; never `godot-project`, because the repo brings its own project).
       Then clone into `game/`.
     - **A repo that belongs to a suite** (`<suite-org>/*`) goes in `frameworks/<suite>/<repo>/`.
   - **Anyone else's repo** goes in `external/<owner>/<repo>/`.
   - **Not sure:** reason it through as `/where` would, then ask once.
4. **Clone:** `git clone <url> <path>`, where `<path>` ends in `game` for a game home. Private repos use the user's
   `gh` login.
5. **Agent files:**
   - If the repo has an `AGENTS.md` but no `CLAUDE.md`, write a `CLAUDE.local.md` containing `@AGENTS.md`, and add
     `CLAUDE.local.md` to `.git/info/exclude`. It stays local and is never committed.
   - If it's the user's own repo and has neither file, offer to add them from `_meta/templates/repo-base`. Commit them only
     if the user asks.
   - **Cloned into a game home, mod home, emulator home or suite:** list the repo, and every folder in it with its own `CLAUDE.md`,
     `.claude/rules/` or `.claude/skills/`, in the home's `CLAUDE.md` "Rules below this folder" table
     (`.claude/rules/instructions.md`). `scan-projects.ps1` must print no `not listed` line for it.
6. **Don't install yet.**
   - For third-party repos, ask before `pnpm install`, `pip install`, `rokit install` or any setup script.
   - For the user's own repos, offer to run them.
7. **Register** the repo in `projects.json`. Owner is the GitHub owner; for `external/`, `notes` says why it was cloned.
8. Offer to switch the session into it (for a game, into the game home).
