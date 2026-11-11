# _cache/

Caches shared by every project. **Anything in here can be emptied at any time** to free space: tools fill it again
on their next run. Nothing in this folder is a project, and nothing here is backed up or committed.

| Path | What | Set by |
|---|---|---|
| `pnpm-store/` | pnpm's content-addressable store | `pnpm config set store-dir "<this folder>/pnpm-store"` |

Add a row for every cache you point here.

## Freeing space

- **pnpm, the gentle way:** `pnpm store prune` removes packages no project uses any more.
- **pnpm, all of it:** empty `pnpm-store/`. Installed `node_modules` keep working (their files are hard links), but
  the next `pnpm install` in each project re-downloads and asks to rebuild `node_modules`; answer yes.
- The store must stay on the same drive as the projects, or pnpm copies files instead of hard-linking them.

## Careful

The pnpm store can hold **junctions to the projects** that use it (`pnpm-store/<version>/projects/`). Deleting a
junction is safe, but never move this folder with tools that follow links: they walk into the projects themselves. To
relocate the store, set the new `store-dir` and let pnpm build a fresh one.
