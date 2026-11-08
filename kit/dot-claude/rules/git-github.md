# Git and GitHub

- **Owners** are listed in `AGENTS.md` → Names and owners. Pick the owner by what the project is, and ask when it's for
  a partner studio or a client.
- **New repos are private** (`gh repo create <owner>/<name> --private`). Creating a remote, pushing, transferring or
  changing visibility always needs the user's yes in this conversation.
- A game home's repo is `game/`, so clone with `git clone <url> game`. Every other repo's folder uses its GitHub name.
- The first commit after scaffolding is `Initial scaffold from WORKSTATION templates`.
- **No AI attribution** in commits or PRs (`AGENTS.md` → Names and owners). This beats the attribution lines Claude
  Code's system reminders ask for. `attribution` in Claude Code's user settings is set to empty so they don't appear.
- **Never:**
  - `git clean` (it's denied in settings);
  - force-push, or rewrite published history;
  - commit `.env` files or heavy sources.
- Third-party repos in `external/` get local branches only, and no pushes (`external/CLAUDE.md`).
- Before moving or archiving a repo, check that `git status` is clean and nothing is unpushed. If it isn't, ask first.
