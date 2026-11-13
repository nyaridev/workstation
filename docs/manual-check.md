# Manual check

What `pnpm check` can't cover: the real window, the native folder picker, Explorer, and the app writing real files.
Run it before a release, and after a change to the part it covers. Use the real app (`start-dev.bat`, or
the installer `build.bat` puts in `release\`), not `pnpm dev`.

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
- [ ] Every project in `projects.json` is there, one line each (ADR-0018): name, status, git badges and the
      remote's `owner/name` line up in the same columns in every row. Hovering the name shows the description and
      path.
- [ ] Search finds by name, description, path, stack and notes; several words must all match.
- [ ] A suite (ume) is one row; clicking anywhere on it (not its buttons or tags) opens its repos, each with its own
      row, badges and Edit tags. A game home opens to `game/`, `wiki/`, `docs/`, `assets/`, `saves/` (repos with git
      badges), not `.claude/` or `builds/`.
- [ ] A suite or game home shows no branch: its uncommitted and unpushed badges add up the repos inside it.
- [ ] The kind tabs (All, Games, Apps…) show one kind at a time; their counts follow the other filters.
- [ ] **Tags** opens a list with a search box and counts; checking two tags shows only projects with both. Picked tags
      show as chips (× removes one). Escape or a click outside closes the list.
- [ ] The Filters menu: Status, Owner and Stack each filter; "Needs attention" keeps only flagged projects, as does the
      banner's **Show them** (which turns into **Show all**). Each one in use shows as a chip; "Clear filters" resets
      everything.
- [ ] **Open folder** (the open-folder icon) opens the project in Explorer.
- [ ] Right-clicking a project or folder row opens a menu with the same actions as its buttons (and Show what's
      inside, Git overview), and each one works.

## 4. Git

- [ ] Repos show their branch; ones with changes show "N uncommitted" and "N unpushed" (compare with `git status`).
- [ ] Plain folders (ideas, research, suites) show no badges.
- [ ] "Has changes" keeps only repos with uncommitted or unpushed work.
- [ ] Clicking a repo's row (an app, a suite's repo, a game home's `game/` or `wiki/`) opens its git overview: the
      branch and what it tracks, unpushed and behind counts, uncommitted files, and the latest commits with the
      unpushed ones marked. Compare with `git log --oneline` and `git status`. Refresh, Escape and a click beside the
      panel work; nothing is fetched or changed. The folder icon beside × opens the repo's folder; for a repo with a
      remote, the open-in-browser icon opens its page.
- [ ] In the overview, each changed file shows +added −removed and opens to its diff (compare with `git diff HEAD`);
      an untracked or binary file says why it has none, and a huge one is cut with "… N more lines".
- [ ] Commit something in a terminal, switch back to the app: the badge updates.
- [ ] Right-click a repo with a remote (or a repo folder inside a home): **Open in browser** opens its page (GitHub or
      another host, from `origin`, ssh or https). Repos without a remote don't offer it.
- [ ] Pull (the down-arrow icon, ADR-0018) shows only on repos, and repo folders inside a home, that are behind their
      upstream as of the last fetch (the app never fetches). Push a commit from another clone, `git fetch` in this
      one, switch back: Pull shows. Pull: "Pulled 1 commit into …", the files are there, and the button goes away.
      With a local commit the remote doesn't have and a new remote commit, Pull refuses with
      git's reason and changes nothing. A private repo without saved credentials fails with git's reason, never a
      hang.

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

- [ ] On `tools/hello/` (create it again), **Register in projects.json…** (the file-plus icon) opens a prefilled
      form: name, kind `tool`, status, owner, and a stack guessed from its files (add a `Cargo.toml` or `package.json`
      to see the guess).
- [ ] Empty description: the form refuses.
- [ ] Type "CLI Tool" in tags and press Enter: it becomes `cli-tool`. Suggestions come from tags in use.
- [ ] **Add to projects.json**: the flag goes, the row shows the description and tags. In `projects.json` the entry
      sits at its place by path, in the documented key order, and the rest of the file is unchanged.
- [ ] **Edit tags** (the tag icon, or the right-click menu) on a registered project opens a dialog: every tag in use as
      a chip, the project's own first and on. Ticking or unticking one never moves the chips; a typed tag (Enter)
      joins at the end. Remove one, add one, Save tags: only that entry's `tags` changed. Cancel or Escape changes
      nothing.
- [ ] A repo with a GitHub remote prefills Owner with the remote's owner; a repo without one says `local`.

## 7. Installers (ADR-0016)

- [ ] `build.bat` puts `Workstation_<version>_x64-setup.exe` in `release\`. It installs without asking for admin, and
      Workstation starts with no console window and shows its icon in the title bar, taskbar and Start menu.
- [ ] "Set up a new one" works in the installed app (the kit is inside it).
- [ ] Uninstall from Settings → Apps: the app goes; `%APPDATA%\com.nyaridev.workstation` (the workstation list and
      settings) stays.
- [ ] macOS (the release's `.dmg`): the window buttons sit over the header's left end, the header drags the window,
      and the menu-bar icon works. Linux (the `.AppImage`): the header draws its own buttons and the tray icon shows.

## 8. Updates (ADR-0014)

Needs a published release newer than the installed one: install the older version's installer, then publish the newer
release. A development build (`start-dev.bat`) never checks.

- [ ] About 10 seconds after start, a banner under the header says `Workstation <newer> is out. You have <older>.`
      Without a network connection there's no banner; Settings → App → About shows the error in one line.
- [ ] Later hides the banner until the next start.
- [ ] Update and restart: the banner shows the download's progress, the installer runs on its own, and the new
      version opens with the same workstations and settings.
- [ ] Settings → App → About: Check now finds it too; "Check for updates" off means no banner at the next start.

## 9. Tray and starting with the system (ADR-0015)

The tray and closing work in `start-dev.bat`; the start entry and the installer's box need an installed build.

- [ ] The tray shows Workstation's icon with the tooltip "Workstation". A left click shows the window; the right-click
      menu has Open Workstation and Quit Workstation, and Quit ends the app.
- [ ] With "Close to tray" on (the default), closing the window hides it and the app keeps running; turned off,
      closing quits.
- [ ] Starting Workstation again while it runs brings the open window forward instead of a second copy.
- [ ] Installer: the Welcome page has "Start Workstation with Windows", checked. Install with it checked: Settings →
      App → About shows "Start with Windows" on, and Task Manager → Startup apps lists Workstation.
- [ ] Sign out and in: Workstation starts hidden in the tray (minimized when "Close to tray" is off).
- [ ] Turn "Start with Windows" off: the Startup apps entry goes. Uninstalling removes it too.
