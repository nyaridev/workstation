// GitBadges: a repo's branch, uncommitted changes and unpushed commits, shown next to the project name. Totals over
// the repos inside a suite or home come without a branch.

import { Badge, Icon } from "iro-ui";
import { BranchIcon } from "iro-ui/icons";
import type { GitStatus } from "../../lib/types";

/** Nothing for projects that aren't repos and hold none. */
export function GitBadges({ git }: { git: GitStatus | undefined }) {
  if (!git) return null;
  return (
    <>
      {git.branch && (
        <Badge className="mono" title="Branch" icon={<Icon icon={BranchIcon} size={12} />}>
          {git.branch}
        </Badge>
      )}
      {git.uncommitted > 0 && <Badge tone="warning">{git.uncommitted} uncommitted</Badge>}
      {(git.unpushed ?? 0) > 0 && <Badge tone="info">{git.unpushed} unpushed</Badge>}
    </>
  );
}
