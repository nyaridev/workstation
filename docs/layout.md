# The workstation layout

A workstation is one folder that holds every project, sorted by what it is. The app finds projects by their place in
this tree and matches them to `projects.json` ([format](projects-json.md)). A new workstation set up from the app gets
this layout, with an `AGENTS.md` that tells you and your AI agents where each kind of project goes.

```
WORKSTATION/
├─ projects.json            the registry: one entry per active project, with tags
├─ AGENTS.md  CLAUDE.md     where things go, for you and your AI agents
├─ games/<engine>/<game>/   a game home: docs, assets and saves beside the game's repo in game/
├─ apps/web|desktop|bots/<name>/
├─ tools/<name>/
├─ frameworks/<name>/       or frameworks/<suite>/<repo>/
├─ mods/<target-game>/      emulators/<game>/
├─ assets/  ideas/  research/  external/<owner>/<repo>/
├─ sandbox/  archive/       experiments, and finished work (neither goes in projects.json)
└─ _meta/  _toolchains/  _cache/
```

## What the app does with it

- **Reads** every project folder, its `projects.json` entry, and each repo's git status (`git` on your PATH; without
  it the list still works, just without the badges).
- **Writes** only `projects.json` (when you register a project or edit its tags) and the starter files when you set up
  a new workstation. It never overwrites a file, and never deletes or moves anything.
- **Flags** folders that have no entry, and entries whose folder is gone. Folders under `archive/` are listed but never
  flagged.
- **Checks** GitHub for a newer Workstation release (through `gh` when it's logged in, else Windows' `curl.exe`),
  and installs it only when you click. That's its only network use.
- **Remembers** your workstations per Windows user, in `%APPDATA%\com.nyaridev.workstation\workstations.json`.
