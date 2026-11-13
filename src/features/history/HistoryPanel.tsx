// HistoryPanel: a repo's git overview in a side sheet: branch and upstream, what's unpushed or behind, the
// uncommitted files with their diffs, and the commits with the unpushed ones marked, both a page at a time
// (useGitOverview); its header opens the repo's folder and page. Reads only; it never fetches.

import {
  Accordion,
  Badge,
  Button,
  Icon,
  IconButton,
  Notice,
  SectionTitle,
  Sheet,
  Spinner,
  Timeline,
  Tooltip,
} from "iro-ui";
import { BranchIcon, ExternalLinkIcon, FolderOpenIcon, RefreshIcon } from "iro-ui/icons";
import { ChangeDiff } from "./ChangeDiff";
import { ago, changeLabel } from "./format";
import { PAGE, useGitOverview } from "./useGitOverview";

interface Props {
  root: string;
  /** The repo's path in the workstation (a project, or a repo folder inside one). */
  path: string;
  name: string;
  /** Opens the repo's remote page; left out when it has no remote. */
  onOpenPage?: () => void;
  /** Opens the repo's folder. */
  onOpenFolder: () => void;
  onClose: () => void;
}

// The "Load more" button's text for `left` more items.
const moreLabel = (left: number) => (left > PAGE ? `Load ${PAGE} more (${left} left)` : `Load the last ${left}`);

/** Opens from the right; Escape, the close button or a click beside it closes it. */
export function HistoryPanel({ root, path, name, onOpenPage, onOpenFolder, onClose }: Props) {
  const { overview, diffs, commits, shown, loadingCommits, error, refresh, moreFiles, moreCommits } = useGitOverview(
    root,
    path,
  );

  return (
    <Sheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={name}
      closeLabel="Close the git overview"
      resizable
      actions={
        <>
          <IconButton size="sm" icon={<Icon icon={FolderOpenIcon} />} label="Open folder" onClick={onOpenFolder} />
          {onOpenPage && (
            <IconButton
              size="sm"
              icon={<Icon icon={ExternalLinkIcon} />}
              label="Open in browser"
              onClick={onOpenPage}
            />
          )}
        </>
      }
      className="history"
    >
      <div className="history-head">
        <code className="muted small selectable path-end">
          <bdi>{path}</bdi>
        </code>
        <Button size="sm" variant="ghost" icon={<Icon icon={RefreshIcon} />} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error && (
        <Notice tone="danger" role="alert" className="selectable">
          {error}
        </Notice>
      )}
      {!overview && !error && <Spinner label="Reading the repo" />}
      {overview && (
        <>
          <section aria-label="Branch" className="badges">
            <Badge className="mono" icon={<Icon icon={BranchIcon} size={12} />}>
              {overview.branch}
            </Badge>
            <span className="muted small">
              {overview.upstream ? `tracks ${overview.upstream}` : "tracks no remote branch"}
            </span>
            {overview.unpushed > 0 && <Badge tone="info">{overview.unpushed} unpushed</Badge>}
            {(overview.behind ?? 0) > 0 && <Badge tone="accent">{overview.behind} behind (as of the last fetch)</Badge>}
          </section>

          <section aria-labelledby="history-changes">
            <SectionTitle id="history-changes">Uncommitted ({overview.changes.length})</SectionTitle>
            {overview.changes.length === 0 ? (
              <p className="muted small">Nothing to commit.</p>
            ) : (
              <Accordion
                multiple
                className="changes"
                items={overview.changes.slice(0, shown).map((change) => {
                  const diff = diffs.get(change.path);
                  return {
                    value: change.path,
                    title: (
                      <span className="change-title">
                        <span className="change-code">{changeLabel(change.code)}</span>
                        <code className="change-path path-end">
                          <bdi>{change.path}</bdi>
                        </code>
                        {diff?.added != null && (
                          <span className="change-count">
                            <span className="count-add">+{diff.added}</span>{" "}
                            <span className="count-del">−{diff.removed}</span>
                          </span>
                        )}
                      </span>
                    ),
                    content: <ChangeDiff code={change.code} diff={diff} />,
                  };
                })}
              />
            )}
            {overview.changes.length > shown && (
              <Button size="sm" variant="ghost" className="load-more" onClick={moreFiles}>
                {moreLabel(overview.changes.length - shown)}
              </Button>
            )}
          </section>

          <section aria-labelledby="history-commits">
            <SectionTitle id="history-commits">Commits ({overview.commits})</SectionTitle>
            {overview.commits === 0 && <p className="muted small">No commits yet.</p>}
            {!commits && overview.commits > 0 && <Spinner label="Reading the commits" />}
            <Timeline
              items={(commits ?? []).map((commit) => ({
                id: commit.hash,
                title: (
                  <>
                    {commit.subject} {commit.unpushed && <Badge tone="info">unpushed</Badge>}
                  </>
                ),
                time: (
                  <Tooltip content={new Date(commit.date).toLocaleString()}>
                    <time dateTime={commit.date}>{ago(commit.date)}</time>
                  </Tooltip>
                ),
                description: (
                  <>
                    <code>{commit.short}</code> · {commit.author}
                  </>
                ),
                tone: commit.unpushed ? "info" : "neutral",
              }))}
            />
            {commits && overview.commits > commits.length && (
              <Button size="sm" variant="ghost" className="load-more" loading={loadingCommits} onClick={moreCommits}>
                {moreLabel(overview.commits - commits.length)}
              </Button>
            )}
          </section>
        </>
      )}
    </Sheet>
  );
}
