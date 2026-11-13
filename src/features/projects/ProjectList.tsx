// ProjectList: the projects of the open workstation, grouped by kind, with search, tag and status filters.

import { Button, EmptyState, Icon, Notice, Panel, SectionTitle, Spinner, toast } from "iro-ui";
import { useCallback, useMemo, useState } from "react";
import { NoticeBanner } from "../../app/NoticeBanner";
import { gitPull, openFolder } from "../../lib/backend";
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
import { groupIcon } from "./groupIcons";
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

  // Pulls a repo by fast-forward (ADR-0018), says how it went, then rescans so its badges catch up.
  const pull = (path: string, name: string) =>
    gitPull(root, path).then(
      (pulled) => {
        toast({
          tone: "success",
          title:
            pulled === 0 ? `${name} is up to date` : `Pulled ${pulled} commit${pulled === 1 ? "" : "s"} into ${name}`,
        });
        reload();
      },
      (error) => {
        toast({ tone: "error", title: `Couldn't pull ${name}`, description: String(error) });
      },
    );

  const open = (path: string) =>
    openFolder(root, path).then(
      () => setOpenError(null),
      (e) => setOpenError(String(e)),
    );

  if (error)
    return (
      <div className="center">
        <Notice tone="danger" role="alert" className="selectable">
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

  const list = (
    <>
      <ProjectFilters
        filters={filters}
        groups={kinds}
        tags={counts}
        statuses={valuesInUse(projects, (p) => [p.status]).sort((a, b) => statusOrder(a) - statusOrder(b))}
        owners={valuesInUse(projects, (p) => [p.owner])}
        stacks={valuesInUse(projects, (p) => p.stack)}
        onChange={setFilters}
      />
      <div className="project-scroll">
        {groups.length === 0 && <EmptyState title="No project matches these filters." />}
        {groups.map((group) => (
          <Panel
            as="section"
            padded={false}
            key={group.label}
            className="group"
            aria-labelledby={`group-${group.label}`}
          >
            <SectionTitle
              level={2}
              id={`group-${group.label}`}
              className="group-title"
              icon={<Icon icon={groupIcon(group.label)} />}
            >
              <span className="group-name">
                {group.label}
                <span className="group-count">{group.projects.length}</span>
              </span>
            </SectionTitle>
            <ul className="rows">
              {group.projects.map((project) => (
                <ProjectRow
                  key={project.path}
                  root={root}
                  project={project}
                  inside={inside}
                  git={git}
                  suggestions={tags}
                  canWrite={scan.registryError === null}
                  onOpen={open}
                  onPull={pull}
                  onHistory={showHistory}
                  onSaved={reload}
                />
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );

  return (
    <div className="projects">
      {[scan.registryError, openError].filter(Boolean).map((message) => (
        <NoticeBanner key={message} tone="danger" role="alert">
          <span className="selectable">{message}</span>
        </NoticeBanner>
      ))}
      {flagged > 0 && (
        <NoticeBanner
          tone="warning"
          actions={
            // Always a button, so the banner keeps its height when it switches.
            <Button size="sm" onClick={() => setFilters({ ...filters, flagged: !filters.flagged })}>
              {filters.flagged ? "Show all" : "Show them"}
            </Button>
          }
        >
          {flagged} project{flagged === 1 ? " doesn't" : "s don't"} match projects.json.
        </NoticeBanner>
      )}
      {list}
      {history && <HistoryPanel root={root} path={history.path} name={history.name} onClose={closeHistory} />}
    </div>
  );
}
