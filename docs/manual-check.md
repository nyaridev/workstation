# Manual check

What `pnpm check` can't cover: the real window, the native folder picker, Explorer, and the app writing real files.
Run it before a release, and after a change to the part it covers. Use the real app (`start-dev.bat`, or
`release\Workstation.exe` from `build.bat`), not `pnpm dev`.

Use a **throwaway workstation** for everything that writes (an empty folder like `C:/Temp/ws-test`), and your real one
only for the read-only parts. The app's own list lives in `%APPDATA%\com.nyaridev.workstation\workstations.json`;
delete that file to see the first run again.

## 1. First run and workstations

- [ ] With no `workstations.json`, the app opens on "Add a workstation" / "Set up a new one".
- [ ] **Add** a folder without `projects.json`: an error, with "Set it up as a new workstation".
- [ ] **Set up a new one** in the empty test folder: it asks first, then says how many files it wrote, and opens the
      new workstation. The folder now has `projects.json`, `AGENTS.md`, `CLAUDE.md`, `.claude/`, `_meta/` and the
      category folders.
- [ ] Set up the same folder again: it writes nothing ("… already there and kept").
- [ ] Settings → Workstations → **Add…** your real workstation: it opens and lists your projects.
- [ ] Switch between the two with Open in Settings → Workstations; the list follows.
- [ ] Rename the test folder in Explorer: it shows "(not found)" and the "wasn't found" message. Rename it back.
- [ ] Settings → **Remove from list** asks first, removes it from the dropdown, and leaves the folder untouched.
- [ ] Close and reopen the app: the list and the open workstation are remembered.

## 2. The header and Settings

- [ ] No Windows frame: the header is the title bar, with the mark and the name at the left, and the
      Settings button and window buttons at the right. On Windows 11 the corners are round and the window has its
      shadow.
- [ ] Dragging the empty part of the header moves the window; dragging to the top edge
      maximizes, to a side snaps it. Double-clicking the empty part maximizes and restores.
- [ ] Minimize, Maximize (its icon turns into Restore) and Close work; Close quits the app.
- [ ] The name (Home) and the Settings button work inside the header, and clicking them doesn't
      drag.
- [ ] The first-run screen has the header too.
- [ ] The liquid background flows behind the window. Settings → "Liquid background" off stops it at once; on brings
      it back. Both are remembered after a restart.
- [ ] Settings → "Use the system title bar", then restart: the Windows frame is back, the header has no window
      buttons and doesn't drag. Turn it off and restart: the custom header returns.
- [ ] Settings has two tabs, Workstations and App, each section a card. Settings and back: the project list keeps
      its filters and scroll. Clicking the mark or the name from Settings
      goes back to the projects.
- [ ] Right-clicking shows no browser menu, except in the search field; text in the list can't be selected.

## 3. The project list (real workstation, read-only)

- [ ] Groups appear in order (Games, Apps, Tools, Frameworks, Research, Ideas, Archive…) with counts.
- [ ] Every project in `projects.json` is there, with its description, path, stack and tags.
- [ ] Search finds by name, description, path, stack and notes; several words must all match.
- [ ] A suite (ume) is one row; clicking anywhere on it (not its buttons or tags) opens its repos, each with its own
      row, badges and Edit tags. A game home opens to `game/`, `wiki/`, `docs/`, `assets/`, `saves/` (repos with git
      badges), not `.claude/` or `builds/`.
- [ ] A suite or game home shows no branch: its uncommitted and unpushed badges add up the repos inside it.
- [ ] The kind tabs (All, Games, Apps…) show one kind at a time; their counts follow the other filters.
- [ ] **Tags** opens a list with a search box and counts; checking two tags shows only projects with both. Picked tags
      show as chips (× removes one); a `#tag` on a row also toggles it. Escape or a click outside closes the list.
- [ ] Status, Owner and Stack each filter, and turn blue while set. "Needs attention" keeps only flagged projects, as
      does the banner's **Show them**. "Clear filters" resets everything.
- [ ] **Open folder** opens the project in Explorer.
- [ ] Right-clicking a project or folder row opens a menu with the same actions as its buttons (and Show what's
      inside, Git overview), and each one works.

## 4. Git

- [ ] Repos show their branch; ones with changes show "N uncommitted" and "N unpushed" (compare with `git status`).
- [ ] Plain folders (ideas, research, suites) show no badges.
- [ ] "Has changes" keeps only repos with uncommitted or unpushed work.
- [ ] Clicking a repo's row (an app, a suite's repo, a game home's `game/` or `wiki/`) opens its git overview: the
      branch and what it tracks, unpushed and behind counts, uncommitted files, and the latest commits with the
      unpushed ones marked. Compare with `git log --oneline` and `git status`. Refresh, Escape and a click beside the
      panel work; nothing is fetched or changed.
- [ ] Commit something in a terminal, switch back to the app: the badge updates.

## 5. Live updates (test workstation)

- [ ] Create `tools/hello/` in Explorer: within a second it appears, flagged "not in projects.json".
- [ ] Rename it: the old row goes, the new one appears. Delete it: it goes.
- [ ] Edit a description in `projects.json` by hand and save: the list shows it.
- [ ] Break `projects.json` (delete a comma): a red banner names the line; folders are still listed; Register and Edit
      tags disappear. Fix it: everything comes back.
- [ ] Save files inside a project, or run `pnpm install` in one: the list doesn't flicker or rescan.
- [ ] Create `archive/tools/old/`: it shows in the Archive group with no flag and no Register button. Add an entry for
      it to `projects.json` by hand: it's flagged "archived: remove from projects.json".

## 6. Registering and tags (test workstation)

- [ ] On `tools/hello/` (create it again), **Register…** opens a prefilled form: name, kind `tool`, status, owner,
      and a stack guessed from its files (add a `Cargo.toml` or `package.json` to see the guess).
- [ ] Empty description: the form refuses.
- [ ] Type "CLI Tool" in tags and press Enter: it becomes `cli-tool`. Suggestions come from tags in use.
- [ ] **Add to projects.json**: the flag goes, the row shows the description and tags. In `projects.json` the entry
      sits at its place by path, in the documented key order, and the rest of the file is unchanged.
- [ ] **Edit tags** on a registered project: remove one, add one, save. Only that entry's `tags` changed.
- [ ] A repo with a GitHub remote prefills Owner with the remote's owner; a repo without one says `local`.

## 7. Release build

- [ ] `build.bat` makes `release\Workstation.exe`; it starts with no console window and shows the app icon in the
      title bar and taskbar.
- [ ] Copy it somewhere else (Desktop) and run it: it still opens, and "Set up a new one" still works (the kit is
      inside the exe).

## 8. Updates

Needs a published release newer than the exe you run: build the older version from its tag, or run a copy of the
previous release.

- [ ] Within a few seconds of starting, the title bar shows `v<newer>`. Without a network connection it shows nothing
      and says nothing.
- [ ] Clicking it asks first; Cancel changes nothing.
- [ ] Install: the window closes and the new version opens from the same place, with the same workstations. Beside the
      exe, `Workstation.old.exe` is gone after the new one has started (or on its next start).
- [ ] With `gh` logged in, and again with `gh` logged out (it uses `curl.exe`): both find and install it.
- [ ] Run from a folder you can't write to (`C:/Program Files/…`): it says it can't replace the exe and offers the
      release page.
- [ ] In `start-dev.bat`, clicking it says it's a development build and offers the release page.
