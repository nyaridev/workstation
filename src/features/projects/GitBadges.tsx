// GitBadges: a repo's branch, uncommitted changes and unpushed commits, shown next to the project name.

import type { GitStatus } from "../../lib/types";

/** Nothing for projects that aren't repos. */
export function GitBadges({ git }: { git: GitStatus | undefined }) {
  if (!git) return null;
  return (
    <>
      <span className="rounded bg-zinc-800 px-1.5 font-mono text-xs text-zinc-400" title="Branch">
        {git.branch}
      </span>
      {git.uncommitted > 0 && (
        <span className="rounded bg-amber-900/40 px-1.5 text-amber-300 text-xs">{git.uncommitted} uncommitted</span>
      )}
      {(git.unpushed ?? 0) > 0 && (
        <span className="rounded bg-sky-900/40 px-1.5 text-sky-300 text-xs">{git.unpushed} unpushed</span>
      )}
    </>
  );
}
