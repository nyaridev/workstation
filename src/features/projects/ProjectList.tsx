// ProjectList: the projects of the open workstation, grouped by kind, with search, tag and status filters.

import { Banner, Button, EmptyState, Notice, SectionTitle, Spinner } from "iro-ui";
import { useCallback, useMemo, useState } from "react";
import { openFolder } from "../../lib/backend";
import { HistoryPanel } from "../history/HistoryPanel";
import { STATUSES } from "./fields";
import {
  ANY,
  type Filters,
  filterProjects,
  groupProjects,
  NO_FILTERS,
  nestProjects,
  registryFlag,
  tagCounts,
  valuesInUse,
} from "./filter";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectRow } from "./ProjectRow";
import { useGitStatus } from "./useGitStatus";
import { useProjects } from "./useProjects";

interface Props {
  root: string;
}

// The status picker lists statuses from first idea to done; unknown ones go last.
const statusOrder = (status: string) => {
  const at = (STATUSES as readonly string[]).indexOf(status);
  return at < 0 ? STATUSES.length : at;
};

/** Scans `root` and lists its projects. */
export function ProjectList({ root }: Props) {
  const { scan, error, reload } = useProjects(root);
  const git = useGitStatus(root, scan?.projects);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openError, setOpenError] = useState<string | null>(null);
  // The repo whose git overview is open.
  const [history, setHistory] = useState<{ path: string; name: string } | null>(null);
  const showHistory = useCallback((path: string, name: string) => setHistory({ path, name }), []);
  const closeHistory = useCallback(() => setHistory(null), []);

  const projects = useMemo(() => scan?.projects ?? [], [scan]);
  // A suite's repos are listed inside the suite's row, not on their own.
  const { top, inside } = useMemo(() => nestProjects(projects), [projects]);
  const shown = useMemo(() => filterProjects(top, filters, git, inside), [top, filters, git, inside]);
  const groups = useMemo(() => groupProjects(shown), [shown]);
  // The kind tabs count what the other filters let through, so each tab says what clicking it shows.
  const kinds = useMemo(
    () =>
      groupProjects(filterProjects(top, { ...filters, group: ANY }, git, inside)).map((g) => ({
        label: g.label,
        count: g.projects.length,
      })),
    [top, inside, filters, git],
  );
  const counts = useMemo(() => tagCounts(projects), [projects]);
  const tags = useMemo(() => counts.map(([tag]) => tag), [counts]);
  const flagged = projects.filter((p) => registryFlag(p) !== null).length;

  const toggleTag = (tag: string) =>
    setFilters((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));
  const open = (path: string) =>
    openFolder(root, path).then(
      () => setOpenError(null),
      (e) => setOpenError(String(e)),
    );

  if (error)
    return (
      <div className="center">
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      </div>
    );
  if (!scan)
    return (
      <div className="center">
        <Spinner label="Scanning" />
      </div>
    );

  return (
    <div className="projects">
      {[scan.registryError, openError].filter(Boolean).map((message) => (
        <Banner key={message} tone="danger" role="alert">
          {message}
        </Banner>
      ))}
      {flagged > 0 && (
        <Banner
          tone="warning"
          actions={
            !filters.flagged && (
              <Button size="sm" onClick={() => setFilters({ ...filters, flagged: true })}>
                Show them
              </Button>
            )
          }
        >
          {flagged} project{flagged === 1 ? " doesn't" : "s don't"} match projects.json.
        </Banner>
      )}
      <ProjectFilters
        filters={filters}
        groups={kinds}
        tags={counts}
        statuses={valuesInUse(projects, (p) => [p.status]).sort((a, b) => statusOrder(a) - statusOrder(b))}
        owners={valuesInUse(projects, (p) => [p.owner])}
        stacks={valuesInUse(projects, (p) => p.stack)}
        shown={shown.length}
        total={top.length}
        onChange={setFilters}
      />
      <div className="project-scroll">
        {groups.length === 0 && <EmptyState title="No project matches these filters." />}
        {groups.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <SectionTitle level={2} id={`group-${group.label}`} className="group-title">
              {group.label} <span className="count">({group.projects.length})</span>
            </SectionTitle>
            <ul className="rows">
              {group.projects.map((project) => (
                <ProjectRow
                  key={project.path}
                  root={root}
                  project={project}
                  inside={inside}
                  git={git}
                  selectedTags={filters.tags}
                  suggestions={tags}
                  canWrite={scan.registryError === null}
                  onTag={toggleTag}
                  onOpen={open}
                  onHistory={showHistory}
                  onSaved={reload}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
      {history && <HistoryPanel root={root} path={history.path} name={history.name} onClose={closeHistory} />}
    </div>
  );
}
