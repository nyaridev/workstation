// useGitOverview: one repo's git overview, read a page at a time so a big repo opens as fast as a small one: the
// branch and file list first, then the shown files' diffs and the first commits, each as it arrives, and more of
// either on request. A refresh (the button, or the window coming back into focus) rereads what's on screen.

import { useCallback, useEffect, useRef, useState } from "react";
import { gitCommits, gitDiffs, gitOverview } from "../../lib/backend";
import type { Commit, FileDiff, GitOverview } from "../../lib/types";

// ── Constants ─────────────────────────────
/** Files and commits shown at first, and added by each "Load more". */
export const PAGE = 20;

// ── Public API ────────────────────────────
/** The overview of the repo at `path`, with what's loaded of its diffs and commits. */
export function useGitOverview(root: string, path: string) {
  const [overview, setOverview] = useState<GitOverview | null>(null);
  const [diffs, setDiffs] = useState<Map<string, FileDiff>>(new Map());
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped for each repo and each refresh, so answers for an older one are dropped.
  const generation = useRef(0);
  // How much is on screen, so a refresh reads the same again.
  const sizes = useRef({ files: PAGE, commits: PAGE });

  const readDiffs = useCallback(
    (token: number, files: string[]) => {
      if (files.length === 0) return;
      gitDiffs(root, path, files).then(
        (found) => {
          if (token !== generation.current) return;
          setDiffs((old) => new Map([...old, ...found.map((d): [string, FileDiff] => [d.path, d])]));
        },
        (e) => token === generation.current && setError(String(e)),
      );
    },
    [root, path],
  );

  const refresh = useCallback(() => {
    const token = ++generation.current;
    gitOverview(root, path).then(
      (found) => {
        if (token !== generation.current) return;
        setOverview(found);
        setError(null);
        readDiffs(
          token,
          found.changes.slice(0, sizes.current.files).map((c) => c.path),
        );
        gitCommits(root, path, 0, sizes.current.commits).then(
          (page) => token === generation.current && setCommits(page),
          (e) => token === generation.current && setError(String(e)),
        );
      },
      (e) => token === generation.current && setError(String(e)),
    );
  }, [root, path, readDiffs]);

  useEffect(() => {
    setOverview(null);
    setDiffs(new Map());
    setCommits(null);
    setShown(PAGE);
    setError(null);
    sizes.current = { files: PAGE, commits: PAGE };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  /** Shows the next page of files and reads their diffs. */
  const moreFiles = () => {
    if (!overview) return;
    const next = shown + PAGE;
    readDiffs(
      generation.current,
      overview.changes.slice(shown, next).map((c) => c.path),
    );
    sizes.current.files = next;
    setShown(next);
  };

  /** Reads the next page of commits. */
  const moreCommits = () => {
    if (!commits) return;
    const token = generation.current;
    setLoadingCommits(true);
    gitCommits(root, path, commits.length, PAGE)
      .then(
        (page) => {
          if (token !== generation.current) return;
          sizes.current.commits = commits.length + page.length;
          setCommits([...commits, ...page]);
        },
        (e) => token === generation.current && setError(String(e)),
      )
      .finally(() => setLoadingCommits(false));
  };

  return { overview, diffs, commits, shown, loadingCommits, error, refresh, moreFiles, moreCommits };
}
