<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/banner-dark.svg" />
    <img src="assets/brand/banner-light.svg" width="100%" alt="Workstation — every project in one folder, at a glance" />
  </picture>
</p>

<p align="center">
  <a href="#run"><b>Run</b></a> ·
  <a href="docs/layout.md">Layout</a> ·
  <a href="docs/projects-json.md">projects.json</a> ·
  <a href="AGENTS.md">Agents</a> ·
  <a href="docs/adr">Decisions</a>
</p>

A Windows app for people who keep every project in one folder: games, apps, tools, mods, ideas, research. Open your
WORKSTATION folder and see everything in it, sorted by kind and tagged, with what each repo has left to commit or
push. It only reads your projects; its only writes are to `projects.json` and to a new workstation's starter files.

- **Every project at a glance.** Grouped by kind, with search, tags, status and a "has changes" filter.
- **Git in every row.** Each repo's branch, uncommitted changes and unpushed commits.
- **A registry that stays honest.** Folders missing from `projects.json` are flagged; register them or edit their tags
  from the list.
- **Live.** Add, move or remove a project folder and the list follows.
- **Several workstations.** Work and personal, or one per person. Set up a new one in an empty folder and it gets the
  layout, agent rules and templates.

> Work in progress: not released yet.

## Run

Download `Workstation.exe` and run it: nothing to install, on Windows 10 or 11. **Add a workstation** (a folder with
`projects.json` at its top) or **Set up a new one** in an empty folder, then fill in the GitHub owners table in its
`AGENTS.md`. When a new version is out, a button in the title bar installs it.

## Develop

Needs Node 22.18+, pnpm and Rust.

```bash
pnpm install
pnpm check
```

`start-dev.bat` runs the app with hot reload, `pnpm dev` the UI alone in a browser with fake data, and `build.bat`
builds `release\Workstation.exe`. `pnpm check` runs types, lint and every test; [docs/manual-check.md](docs/manual-check.md)
covers what it can't.

## License

MIT. See [LICENSE](LICENSE).
