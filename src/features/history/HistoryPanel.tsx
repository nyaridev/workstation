// HistoryPanel: a repo's git overview in a side sheet: branch and upstream, what's unpushed or behind, the
// uncommitted files, and the latest commits with the unpushed ones marked. Reads only; it never fetches.

import { Badge, Button, Icon, Notice, SectionTitle, Sheet, Spinner, Timeline } from "iro-ui";
import { BranchIcon, RefreshIcon } from "iro-ui/icons";
import { useCallback, useEffect, useState } from "react";
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

/** Opens from the right; Escape, the close button or a click beside it closes it. */
export function HistoryPanel({ root, path, name, onClose }: Props) {
  const [history, setHistory] = useState<GitHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  const unpushed = history?.commits.filter((c) => c.unpushed).length ?? 0;

  return (
    <Sheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={name}
      closeLabel="Close the git overview"
      className="history"
    >
      <div className="history-head">
        <code className="muted small">{path}</code>
        <Button size="sm" variant="ghost" icon={<Icon icon={RefreshIcon} />} onClick={load}>
          Refresh
        </Button>
      </div>

      {error && (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      )}
      {!history && !error && <Spinner label="Reading the repo" />}
      {history && (
        <>
          <section aria-label="Branch" className="badges">
            <Badge className="mono" icon={<Icon icon={BranchIcon} size={12} />}>
              {history.branch}
            </Badge>
            <span className="muted small">
              {history.upstream ? `tracks ${history.upstream}` : "tracks no remote branch"}
            </span>
            {unpushed > 0 && <Badge tone="info">{unpushed} unpushed</Badge>}
            {(history.behind ?? 0) > 0 && <Badge tone="accent">{history.behind} behind (as of the last fetch)</Badge>}
          </section>

          <section aria-labelledby="history-changes">
            <SectionTitle id="history-changes">Uncommitted ({history.changes.length})</SectionTitle>
            {history.changes.length === 0 ? (
              <p className="muted small">Nothing to commit.</p>
            ) : (
              <ul className="changes">
                {history.changes.map((change) => (
                  <li key={change.path}>
                    <span className="change-code">{changeLabel(change.code)}</span>
                    <code>{change.path}</code>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="history-commits">
            <SectionTitle id="history-commits">Commits</SectionTitle>
            {history.commits.length === 0 && <p className="muted small">No commits yet.</p>}
            <Timeline
              items={history.commits.map((commit) => ({
                id: commit.hash,
                title: (
                  <>
                    {commit.subject} {commit.unpushed && <Badge tone="info">unpushed</Badge>}
                  </>
                ),
                time: (
                  <time dateTime={commit.date} title={new Date(commit.date).toLocaleString()}>
                    {ago(commit.date)}
                  </time>
                ),
                description: (
                  <>
                    <code>{commit.short}</code> · {commit.author}
                  </>
                ),
                tone: commit.unpushed ? "info" : "neutral",
              }))}
            />
            {history.commits.length === LIMIT && <p className="muted small">The latest {LIMIT} commits.</p>}
          </section>
        </>
      )}
    </Sheet>
  );
}
