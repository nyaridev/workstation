# Framework or suite

## Single repo → `frameworks/<name>/`

1. Scaffold it:
   `new-from-template.ps1 -Template repo-base -Destination frameworks/<name> -Name <name> -Title "<Title>" -Owner <owner>`
2. Add the language's package setup:

   | Language | Setup |
   |---|---|
   | Luau | Rojo `default.project.json` + `rokit.toml` |
   | TypeScript | `pnpm init` |
   | Python | `uv init --lib` |
   | Godot addon | `addons/<name>/plugin.cfg` |
3. Add a `CHANGELOG.md`. Then `git init` and commit. Don't tag anything until the first release.

## Suite → `frameworks/<suite>/`

For several repos released together:

1. Create the suite's `AGENTS.md`, `CLAUDE.md` and `README.md` in a plain folder (no git):
   `new-from-template.ps1 -Template suite -Destination frameworks/<suite> -Name <suite> -Title "<Title>"`
2. Create each repo inside it as a single repo (above).
3. Keep the suite's repo table current, and give each repo a row in the suite's `CLAUDE.md` "Rules below this folder"
   table (its `AGENTS.md`, plus `.claude/rules/` and `.claude/skills/` if it has them).

## A new repo in an existing suite


- Create it as a single repo at `frameworks/<suite>/<repo>/`.
- Its owner is the suite's org.
- Add a row for it in the suite's `AGENTS.md`, in the suite's `CLAUDE.md` "Rules below this folder" table, and in
  `projects.json`.
