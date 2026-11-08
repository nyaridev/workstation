// useGitStatus: git status of the listed repos, read after every scan and whenever the window gets focus again
// (commits happen inside .git, which the watcher ignores on purpose).

import { useEffect, useState } from "react";
import { gitStatus } from "../../lib/backend";
import type { GitStatuses, Project } from "../../lib/types";

/** The git status of `projects` by path; empty until the first read finishes, and when git isn't available. */
export function useGitStatus(root: string, projects: Project[] | undefined) {
  const [statuses, setStatuses] = useState<GitStatuses>({});

  useEffect(() => {
    if (!projects) return;
    let current = true;
    const paths = projects.filter((p) => p.onDisk).map((p) => p.path);
    const load = () =>
      gitStatus(root, paths).then(
        (result) => current && setStatuses(result),
        () => {},
      );
    void load();
    window.addEventListener("focus", load);
    return () => {
      current = false;
      window.removeEventListener("focus", load);
    };
  }, [root, projects]);

  return statuses;
}
