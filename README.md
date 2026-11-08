# Workstation

A Windows desktop app for people who keep every project in one folder: games, apps, tools, mods, ideas, research.
Workstation lists them all, sorts and filters them by tags, shows which repos have uncommitted or unpushed work, and
updates on its own as projects are added, moved or removed.

> Work in progress: not released yet.

## What it does

- **Lists every project** in your WORKSTATION folder, grouped by kind (games, apps, tools, frameworks, research…).
- **Search and filter** by text, tags, status, or "has changes".
- **Git at a glance:** each repo's branch, uncommitted changes and unpushed commits.
- **Keeps the registry honest:** projects on disk that aren't in `projects.json` are flagged, and so are entries whose
  folder is gone. Register a project or edit its tags right from the list.
- **Live:** create, move or delete a project folder, or edit `projects.json`, and the list updates by itself.
- **Several workstations:** work and personal, or one per person on a shared PC. Each Windows user has their own list.
- **Starts you off:** set up a new workstation in an empty folder and get the folder layout, agent rules for Claude
  Code (and other agents), project templates and an empty `projects.json`. Nothing that's already there is overwritten.

Workstation only reads your projects. Its only writes are to `projects.json` (when you register a project or edit
tags) and the starter files when you set up a new workstation. It never deletes or moves anything.

## Get started

1. Download `Workstation.exe` and run it. There's nothing to install; it needs Windows 10 or 11 (WebView2 ships with
   them).
2. Either **Add a workstation** (a folder with `projects.json` at its top) or **Set up a new one** in an empty folder.
3. In a new workstation, open `AGENTS.md` and fill in the GitHub owners table, so agents know where your repos go.

Git status needs [git](https://git-scm.com/) on your PATH; without it the list still works, just without the badges.

## The layout

```
WORKSTATION/
├─ projects.json            the registry: one entry per project, with tags
├─ AGENTS.md  CLAUDE.md     where things go, for you and your AI agents
├─ games/<engine>/<game>/   a game home: docs, assets and saves beside the game's repo in game/
├─ apps/web|desktop|bots/<name>/
├─ tools/<name>/
├─ frameworks/<name>/       or frameworks/<suite>/<repo>/
├─ mods/<target-game>/      emulators/<game>/
├─ assets/  ideas/  research/  external/<owner>/<repo>/
├─ sandbox/  archive/
└─ _meta/  _toolchains/  _cache/
```

The registry's format, an entry template and a starter list of tags are in
[`docs/projects-json.md`](docs/projects-json.md).

## Build from source

Needs Node 22.18+, pnpm and Rust (stable).

| Run | To |
| --- | --- |
| `start-dev.bat` | run the app with hot reload |
| `pnpm dev` | the UI alone in a browser at http://localhost:4420, with fake data |
| `pnpm check` | type checks, lint and every test |
| `build.bat` | build the portable `release\Workstation.exe` |

How it's built: [`docs/adr/`](docs/adr/README.md).
