// HistoryPanel: a repo's git overview in a side panel: branch and upstream, what's unpushed or behind, the
// uncommitted files, and the latest commits with the unpushed ones marked. Reads only; it never fetches.

import { useCallback, useEffect, useRef, useState } from "react";
import { gitHistory } from "../../lib/backend";
import type { GitHistory } from "../../lib/types";
import { ago, changeLabel } from "./format";

interface Props {
  root: string;
  /** The repo's path in the workstation (a project, or a repo folder inside one). */
  path: string;
  name: string;
  onClose: () => void;
}

/** How many commits Rust sends at most (`HISTORY_LIMIT` in commands.rs). */
const LIMIT = 200;

/** Opens over the right side of the list; Escape, the close button or a click beside it closes it. */
export function HistoryPanel({ root, path, name, onClose }: Props) {
  const [history, setHistory] = useState<GitHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const close = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    gitHistory(root, path).then(
      (result) => {
        setHistory(result);
        setError(null);
      },
      (e) => setError(String(e)),
    );
  }, [root, path]);

  useEffect(() => {
    setHistory(null);
    load();
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("focus", load);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("focus", load);
    };
  }, [load, onClose]);

  const unpushed = history?.commits.filter((c) => c.unpushed).length ?? 0;

  return (
    <div className="fixed inset-x-0 top-11 bottom-0 z-30 flex justify-end">
      <button
        type="button"
        aria-label="Close the git overview"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <aside
        aria-labelledby="history-title"
        className="relative flex h-full w-[min(560px,100%)] flex-col border-zinc-800 border-l bg-zinc-950 shadow-2xl"
      >
        <header className="flex items-start gap-3 border-zinc-800 border-b px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="history-title" className="font-semibold text-zinc-100">
              {name}
            </h2>
            <code className="block truncate text-xs text-zinc-500">{path}</code>
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-md px-2.5 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Refresh
          </button>
          <button
            ref={close}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" aria-hidden="true">
              <path d="M1 1l8 8M9 1 1 9" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {error && (
          <p role="alert" className="px-5 py-4 text-red-300 text-sm">
            {error}
          </p>
        )}
        {!history && !error && <p className="px-5 py-4 text-sm text-zinc-400">Reading the repo…</p>}
        {history && (
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <section aria-label="Branch" className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-zinc-800 px-1.5 font-mono text-xs text-zinc-300">{history.branch}</span>
              {history.upstream ? (
                <span className="text-zinc-500">tracks {history.upstream}</span>
              ) : (
                <span className="text-zinc-500">tracks no remote branch</span>
              )}
              {unpushed > 0 && (
                <span className="rounded bg-sky-900/40 px-1.5 text-sky-300 text-xs">{unpushed} unpushed</span>
              )}
              {(history.behind ?? 0) > 0 && (
                <span className="rounded bg-violet-900/40 px-1.5 text-violet-300 text-xs">
                  {history.behind} behind (as of the last fetch)
                </span>
              )}
            </section>

            <section aria-labelledby="history-changes">
              <h3 id="history-changes" className="mb-2 font-semibold text-xs text-zinc-500 uppercase tracking-wide">
                Uncommitted ({history.changes.length})
              </h3>
              {history.changes.length === 0 ? (
                <p className="text-sm text-zinc-500">Nothing to commit.</p>
              ) : (
                <ul className="max-h-48 space-y-0.5 overflow-y-auto text-sm">
                  {history.changes.map((change) => (
                    <li key={change.path} className="flex gap-3">
                      <span className="w-24 shrink-0 text-amber-300/90 text-xs leading-5">
                        {changeLabel(change.code)}
                      </span>
                      <code className="min-w-0 truncate text-xs text-zinc-300 leading-5">{change.path}</code>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="history-commits">
              <h3 id="history-commits" className="mb-2 font-semibold text-xs text-zinc-500 uppercase tracking-wide">
                Commits
              </h3>
              {history.commits.length === 0 && <p className="text-sm text-zinc-500">No commits yet.</p>}
              <ol className="border-zinc-800 border-l">
                {history.commits.map((commit) => (
                  <li key={commit.hash} className="relative py-2 pl-5">
                    <span
                      aria-hidden="true"
                      className={`absolute top-3.5 -left-[5px] size-2.5 rounded-full border-2 border-zinc-950 ${commit.unpushed ? "bg-sky-400" : "bg-zinc-600"}`}
                    />
                    <p className="text-sm text-zinc-200">
                      {commit.subject}
                      {commit.unpushed && (
                        <span className="ml-2 rounded bg-sky-900/40 px-1.5 align-middle text-sky-300 text-xs">
                          unpushed
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 flex gap-3 text-xs text-zinc-500">
                      <code>{commit.short}</code>
                      <span>{commit.author}</span>
                      <time dateTime={commit.date} title={new Date(commit.date).toLocaleString()}>
                        {ago(commit.date)}
                      </time>
                    </p>
                  </li>
                ))}
              </ol>
              {history.commits.length === LIMIT && (
                <p className="mt-2 text-xs text-zinc-500">The latest {LIMIT} commits.</p>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
