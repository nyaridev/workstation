// useProjects: scans the open workstation when it opens, again whenever its projects change on disk, and on request
// (after the app itself wrote a .workstation, so the list updates even if the watcher isn't running).

import { useCallback, useEffect, useRef, useState } from "react";
import { onProjectsChanged, scanWorkstation } from "../../lib/backend";
import type { Scan } from "../../lib/types";

/** The scan of `root`, or null while the first scan loads; `error` when a scan itself failed; `reload` rescans. */
export function useProjects(root: string) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    // A scan of the previous workstation that finishes late must not overwrite this one.
    let current = true;
    const load = () =>
      void scanWorkstation(root).then(
        (result) => {
          if (current) {
            setScan(result);
            setError(null);
          }
        },
        (e) => {
          if (current) setError(String(e));
        },
      );
    loadRef.current = load;

    setScan(null);
    setError(null);
    load();
    // Rescans keep the current list on screen until the new one arrives, so filters and scrolling stay put.
    const stop = onProjectsChanged((changed) => {
      if (changed === root) load();
    });
    return () => {
      current = false;
      stop();
    };
  }, [root]);

  const reload = useCallback(() => loadRef.current(), []);
  return { scan, error, reload };
}
