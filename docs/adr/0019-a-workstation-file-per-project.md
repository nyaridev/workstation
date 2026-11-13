# ADR-0019: Each project has its own .workstation file

**Status:** Accepted
**Date:** 2026-11-13
**Supersedes:** ADR-0004 (projects.json is the registry), the marker of ADR-0005, and ADR-0006 (archived projects
leave the registry)

## Context

One `projects.json` at the root held every project's entry. It drifted every time a project moved, was archived or
was cloned, since the entry and the folder were in two places. It also couldn't travel with a repo, so milestones and
descriptions stayed on one PC.

## Decision

- **Each project has a `.workstation` file in its main folder** (`docs/workstation-file.md`): JSON with no extension
  and no `path`, since its place is where it is. A repo commits it; a home, suite or plain folder holds it in its own
  folder; someone else's repo keeps it out of git with `.git/info/exclude`.
- **The app finds them by walking 4 folder levels below the root**, 5 under `archive/`. The deepest place a project
  sits is a suite repo in a group (`frameworks/<suite>/<group>/<repo>/`); most are 2 or 3 deep. The walk skips
  `_`-prefixed support folders, dependency and build folders, links, and the inside of git repos.
- **The place rules (`layout.rs`) stay**, to flag a project folder that has no file: "no .workstation".
- **The root's `.workstation` marks a workstation**, in place of `projects.json`. It holds `{ "version": 1 }`.
- **Archived projects keep their file.** It moves with the folder; the app never flags anything in `archive/`.
- A file that doesn't parse is reported with its path and line in a banner, and its folder still counts as having
  one. Writes still go through a temp file and a rename, keeping keys the app doesn't know.

## Options considered

- **Keep `projects.json`:** one file to read, but it drifts from the disk and can't travel with a repo.
- **Only find projects by their file, no place rules:** less code, but a new folder without a file would be invisible
  instead of flagged.
- **Walk the whole tree:** finds anything, but a workstation holds big repos, caches and asset trees; 4 levels covers
  every place with one to spare.

## Consequences

- **Easier:** moving, archiving and cloning need no registry edit; milestones and descriptions travel with the repo.
- **Harder:** the list is spread over many files, so a scan reads one per project (still a few ms); a committed file
  is public in a public repo, so notes never name paths on a PC.
- **Rules:** the workstation's `.claude/rules/registry.md`, its skills, `scan-projects.ps1`, and the kit's copies.
