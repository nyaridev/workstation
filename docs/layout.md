# The workstation layout

A workstation is one folder that holds every project, sorted by what it is. Each project describes itself in a
`.workstation` file in its main folder ([format](workstation-file.md)); the app finds those files, and flags project
folders in this tree that have none. A new workstation set up from the app gets
this layout, with an `AGENTS.md` that tells you and your AI agents where each kind of project goes.

```
WORKSTATION/
├─ .workstation             marks the folder as a workstation
├─ AGENTS.md  CLAUDE.md     where things go, for you and your AI agents
├─ games/<engine>/<game>/   a game home: docs, assets and saves beside the game's repo in game/
├─ apps/web|desktop|bots/<name>/
├─ tools/<name>/
├─ frameworks/<name>/       or frameworks/<suite>/<repo>/
├─ mods/<target-game>/      emulators/<game>/
├─ assets/  ideas/  research/  external/<owner>/<repo>/
├─ sandbox/  archive/       experiments, and finished work (archived projects keep their .workstation)
└─ _meta/  _toolchains/  _cache/
```

## What the app does with it

- **Reads** every project's `.workstation` (up to 4 folders deep), and each repo's git status (`git` on your PATH; without
  it the list still works, just without the badges).
- **Writes** only a project's `.workstation` (when you add one or edit its tags) and the starter files when you set up
  a new workstation. It never overwrites a file, and never deletes or moves anything.
- **Flags** project folders that have no `.workstation`. Folders under `archive/` are listed but never flagged.
- **Checks** GitHub for a newer Workstation release (through `gh` when it's logged in, else Windows' `curl.exe`),
  and installs it only when you click. That's its only network use.
- **Remembers** your workstations per Windows user, in `%APPDATA%\com.nyaridev.workstation\workstations.json`.
