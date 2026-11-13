# .workstation files, the registry

Every project describes itself in a `.workstation` file in its main folder: JSON with no extension, and no `path`
(its place is where it is). The Workstation app finds them up to 4 folder levels below the workstation root. The
root's own `.workstation` (`{ "version": 1 }`) only marks the workstation. Skills write and update a project's file in
the same task as the change.

- **Update it without asking,** in any session, even one opened on a project folder: write, fix or update a
  project's `.workstation`, then say what changed in one line. Never delete one.
- **It matches reality.** When a file disagrees with the disk or GitHub, fix the file, not the other way round:
  `owner` is the main repo's GitHub owner (`local` with no remote), and the `public` tag is there exactly when the main
  repo is public on GitHub (`gh repo view <owner>/<repo> --json visibility`). Whenever a task changes a repo's remote,
  owner or visibility, or you notice a mismatch, fix it in the same task.

- **Format, fields, tag list and the template:** `_meta/docs/workstation-file.md`. Read it before writing or editing a
  file. A new file starts from `_meta/templates/workstation-file/`.
- **Every file** has `name`, `kind`, `stack`, `owner`, `status`, `description` (one sentence: what it is) and `tags`;
  `notes` is optional (partner or client, why it was cloned, setup history).
- **Where it goes:**
  - **A repo** (app, tool, framework, a suite's repo): at its root, committed with it.
  - **A game home, mod home or emulator home,** and a **suite**: in that folder, never in the repo inside (`game/`), so
    a partner's repo never gets one. List a mod home's mods, or an emulator home's emulators, in `notes`.
  - **A plain folder** (research, idea, asset pack): in that folder.
  - **Someone else's repo** (`external/`), or a **template repo** other repos are made from (a framework's
    `new-project`): at its root, and add `.workstation` to the repo's `.git/info/exclude` so it's never committed.
- **It's committed, so it may be public:** `notes` never name paths on this PC (`AGENTS.md` → Paths).
- **Milestones** (format: `_meta/docs/workstation-file.md` → Milestones) are the project's plan, kept by agents; the user reads them in
  the Workstation app.
  - **Add them** only from a plan the user agreed to: their own list, or steps you proposed and they accepted. Never
    invent a plan. Most projects have none.
  - **Several plans at once** (a server and a rewrite, an app and its tooling) are separate tracks: every milestone
    gets a `track` naming its plan, and each track has its own number prefix (`M1`, `R1`). One plan needs no `track`.
  - **Mark one done** in the same task that finishes it, and never earlier: `done: true` means it's finished and
    checked, not started. Then the next one not done is current.
  - **Change the plan** (add, drop, reorder or rename milestones) only when the user agrees. Keep each `description`
    to one short line on what it covers.
  - A project whose plan also lives in a milestone table in its `docs/adr/README.md` (the `architect` and
    `reverse-engineer` skills) keeps both in step: the same names, in the same order, done at the same time.
- **Tags:** lowercase kebab-case. Reuse tags already in use before inventing new ones. Give partner games `partner` and
  client work `client`.
- **Sandbox** folders, library asset sets and one-file scripts get none.
- **Moving or archiving** a project moves its file with it: nothing else to update.
- `pwsh -NoProfile -File _meta/scripts/scan-projects.ps1` finds project folders and checks each file. Fix every
  "invalid" or "no .workstation" line it reports.
