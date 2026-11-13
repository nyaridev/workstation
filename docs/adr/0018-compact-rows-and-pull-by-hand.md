# ADR-0018: Compact project rows, and pulling a repo by hand

**Status:** Accepted
**Date:** 2026-11-13

## Context

The owner compared four layouts for the project list (cards, compact, tiles, table) and picked the compact one, with
its parts lined up in columns like a table but without a header. They also want each repo's GitHub `owner/name` on its
row, and a button that pulls a repo so it matches GitHub, for when they want to update one by hand.

Until now the app only read git, and wrote nothing in a workstation besides `projects.json` and kit files (the rules
in `.claude/rules/architecture/overview.md`). A pull changes a repo's files and talks to its remote.

## Decision

- **Compact rows:** one line per project, in the group's card, with the same columns in every row: the name (with
  its flags and what's inside), the status, the git badges, the remote's `owner/name`, then the path. No description,
  stack or tags on the row; the search still finds them, and the tags still filter.
- **The remote:** `git::Status` gains `repo`, the name in the `origin` URL, next to the `owner` it already had.
- **Pull by hand:** a Pull button on repos that track an upstream branch, and the same in the right-click menu. It
  runs `git pull --ff-only` in the repo (a game home's `game/`), with git's own credentials and no prompt in a
  console (`GIT_TERMINAL_PROMPT=0`). Fast-forward only: it never merges or rebases, and git refuses when local
  changes would be overwritten or the branches have split; the app shows git's reason. Nothing pulls on its own.
- **The rules change:** besides `projects.json` and kit files, the app may run `git pull --ff-only` in a repo when the
  user clicks Pull; besides the updater, the only network traffic is git's own during that pull.

## Options considered

- **Keep the other layouts as a setting:** four layouts to keep working for one owner who picked one.
- **`git pull` with merges or rebases:** could leave a repo mid-merge with conflicts, which the app can't help with.
- **Fetch on a timer to show "behind" counts:** network traffic the user didn't ask for; a later ADR if wanted.

## Consequences

- **Easier:** more projects fit on screen, and a repo can be brought up to date without a terminal.
- **Harder:** the description and tags no longer show on the row; a pull can fail on credentials, which git asks for
  in its own credential window, if at all.
- **Rules:** `.claude/rules/architecture/overview.md`, `backend.md`.
