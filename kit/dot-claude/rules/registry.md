# projects.json, the registry

`projects.json` lists every active project: one entry each, sorted by `path`. Skills add, move and update
entries in the same task as the change.

- **Format, fields, tag list and the entry template to copy:** `_meta/docs/projects-json.md`. Read
  it before adding or editing an entry.
- **Every entry** has `name`, `path`, `kind`, `stack`, `owner`, `status`, `description` (one sentence: what it is) and
  `tags`; `notes` is optional (partner or client, why it was cloned, setup history).
- **Tags:** lowercase kebab-case. Reuse tags already in the file before inventing new ones. Give partner games
  `partner` and client work `client`.
- **Game homes, mod homes and emulator homes** get one entry, with the home's path. List a mod home's mods, or an
  emulator home's emulators, in `notes`.
- **Suites** get one entry for the suite and one per repo (`frameworks/<suite>/<repo>/`).
- **Sandbox** folders, library asset sets and one-file scripts aren't registered.
- **Archived projects aren't registered.** Archiving removes the entry; nothing under `archive/` gets one. Promoting
  a project back out of `archive/` adds a new entry.
- `pwsh -NoProfile -File _meta/scripts/scan-projects.ps1` compares the file with the disk and checks
  each entry. Fix every "invalid", "unregistered" or "missing" line it reports. Ask before removing an entry, except when
  archiving.
