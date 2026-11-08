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
- [ ] **Add…** your real workstation: it opens and lists your projects.
- [ ] Switch between the two with the dropdown; the list and the path on the right follow.
- [ ] Rename the test folder in Explorer: it shows "(not found)" and the "wasn't found" message. Rename it back.
- [ ] **Remove from list** asks first, removes it from the dropdown, and leaves the folder untouched.
- [ ] Close and reopen the app: the list and the open workstation are remembered.

## 2. The project list (real workstation, read-only)

- [ ] Groups appear in order (Games, Apps, Tools, Frameworks, Research, Ideas, Archive…) with counts.
- [ ] Every project in `projects.json` is there, with its description, path, stack and tags.
- [ ] Search finds by name, description, path, stack and notes; several words must all match.
- [ ] Clicking a tag chip, or a `#tag` on a row, filters; two tags show only projects with both. "Clear filters" resets.
- [ ] The status picker filters.
- [ ] **Open folder** opens the project in Explorer.

## 3. Git

- [ ] Repos show their branch; ones with changes show "N uncommitted" and "N unpushed" (compare with `git status`).
- [ ] Plain folders (ideas, research, suites) show no badges.
- [ ] "Has changes" keeps only repos with uncommitted or unpushed work.
- [ ] Commit something in a terminal, switch back to the app: the badge updates.

## 4. Live updates (test workstation)

- [ ] Create `tools/hello/` in Explorer: within a second it appears, flagged "not in projects.json".
- [ ] Rename it: the old row goes, the new one appears. Delete it: it goes.
- [ ] Edit a description in `projects.json` by hand and save: the list shows it.
- [ ] Break `projects.json` (delete a comma): a red banner names the line; folders are still listed; Register and Edit
      tags disappear. Fix it: everything comes back.
- [ ] Save files inside a project, or run `pnpm install` in one: the list doesn't flicker or rescan.

## 5. Registering and tags (test workstation)

- [ ] On `tools/hello/` (create it again), **Register…** opens a prefilled form: name, kind `tool`, status, owner,
      and a stack guessed from its files (add a `Cargo.toml` or `package.json` to see the guess).
- [ ] Empty description: the form refuses.
- [ ] Type "CLI Tool" in tags and press Enter: it becomes `cli-tool`. Suggestions come from tags in use.
- [ ] **Add to projects.json**: the flag goes, the row shows the description and tags. In `projects.json` the entry
      sits at its place by path, in the documented key order, and the rest of the file is unchanged.
- [ ] **Edit tags** on a registered project: remove one, add one, save. Only that entry's `tags` changed.
- [ ] A repo with a GitHub remote prefills Owner with the remote's owner; a repo without one says `local`.

## 6. Release build

- [ ] `build.bat` makes `release\Workstation.exe`; it starts with no console window and shows the app icon in the
      title bar and taskbar.
- [ ] Copy it somewhere else (Desktop) and run it: it still opens, and "Set up a new one" still works (the kit is
      inside the exe).
