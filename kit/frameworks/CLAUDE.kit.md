# frameworks/

The user's frameworks, libraries, SDKs, engine addons and project templates: code that other projects build on.

- **Single repo:** `frameworks/<name>/` is the repo.
- **Suite:** a family of repos released together stays together in a plain folder, `frameworks/<suite>/<repo>/`. The
  suite has an `AGENTS.md` (and a `CLAUDE.md` importing it) that maps the repos and how they depend on each other,
  usually all under one GitHub org.

## Rules

- Releases are `v*` git tags. A suite keeps a version manifest (a repo or a file) that records which versions fit
  together.
- Projects **copy** a released version into themselves. They never link into `frameworks/` by path.
- A change to a framework updates its docs and changelog in the same task. A breaking change says how projects update.
- Work in one repo at a time, and follow that repo's own `AGENTS.md` and `.claude/rules/`.
