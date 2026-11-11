# Safety

- **Claude deletes nothing.** Not projects, assets, saves, sandbox folders, or originals after a move. Say what can be
  removed, and let the user remove it.
- **Commands for the user match their OS and shell.** Check the OS first (the environment info, or `$PSVersionTable` /
  `uname`), and give every command in that shell's syntax, in a code block tagged with it. Removing a folder:
  - **Windows:** PowerShell, even when Git Bash is installed: `Remove-Item -LiteralPath "<path>" -Recurse -Force`.
  - **macOS and Linux:** `rm -rf "<path>"` in bash or zsh.
- **Moving within the workspace** (archive, promote) uses `Move-Item`, which is a rename on the same drive. If a
  running app watches the folder (a dev server, a desktop app), copy instead and let the user remove the old one.
- **Junctions and symlinks:** `Move-Item` can walk into a linked folder and move the files it points to. Before
  moving a folder, look for links inside it (`Get-ChildItem -Recurse -Attributes ReparsePoint`). If there are any,
  rename the folder with `[IO.Directory]::Move`, or leave it in place. pnpm stores keep junctions to projects.
- **Bringing projects in from outside the workstation** is always a copy: verify it, reinstall what was skipped, then
  register. `/move-project` has the exact robocopy command.
- **Folders projects come from are read-only** unless the user asks for a change there. To make edits there ask
  first, add them to `.claude/settings.local.json` (`Edit(//d/Old/**)` under `ask`).
- **Roblox places and saves** are copied, never moved, and keep their original name plus a date.
- **Long paths:** keep folder names short, and set `git config core.longpaths true` in repos that need it.
