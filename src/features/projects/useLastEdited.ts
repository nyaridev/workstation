// useLastEdited: when each listed project was last edited, read only while the list is sorted by it: after every
// scan, and whenever the window gets focus again (edits happen in other apps).

import { useEffect, useState } from "react";
import { lastEdited } from "../../lib/backend";
import type { Project } from "../../lib/types";

/** Unix seconds by project path; empty while `wanted` is false or before the first read. */
export function useLastEdited(root: string, projects: Project[], wanted: boolean) {
  const [edited, setEdited] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!wanted) return;
    let current = true;
    const paths = projects.map((p) => p.path);
    const load = () =>
      lastEdited(root, paths).then(
        (result) => current && setEdited(result),
        () => {},
      );
    void load();
    window.addEventListener("focus", load);
    return () => {
      current = false;
      window.removeEventListener("focus", load);
    };
  }, [root, projects, wanted]);

  return edited;
}
