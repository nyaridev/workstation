# external/

Other people's repos, cloned to study, run or patch, at `external/<owner>/<repo>/` exactly as GitHub names them. A repo
that serves one emulator home only can live in that home's `_external/<owner>/<repo>/` instead; these rules apply
there too.

- **Their rules apply.** Read the repo's own `AGENTS.md`, `CLAUDE.md` or `CONTRIBUTING.md` before changing anything.
- **Read and run first.** Make changes on a local branch (`local/<topic>`), never on their default branch.
- **Never push** to their remote. To contribute, the user forks the repo on GitHub; the fork becomes `origin` and
  theirs stays as `upstream`.
- **Ask before running install or build scripts** (`npm install`, `pip install`, `.bat` or `.ps1` setups), because
  they run someone else's code.
- Note why the repo was cloned in the `notes` of its `projects.json` entry.
- If it becomes the user's own product (a real fork under active development), `/promote` moves it to its category.
