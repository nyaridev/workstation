// ProjectList: the projects of the open workstation, grouped by kind, with search, tag and status filters.

import { useMemo, useState } from "react";
import { openFolder } from "../../lib/backend";
import { type Filters, filterProjects, groupProjects, NO_FILTERS, statusesInUse, tagsInUse } from "./filter";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectRow } from "./ProjectRow";
import { useGitStatus } from "./useGitStatus";
import { useProjects } from "./useProjects";

interface Props {
  root: string;
}

/** Scans `root` and lists its projects. */
export function ProjectList({ root }: Props) {
  const { scan, error, reload } = useProjects(root);
  const git = useGitStatus(root, scan?.projects);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openError, setOpenError] = useState<string | null>(null);

  const projects = scan?.projects ?? [];
  const shown = useMemo(() => filterProjects(projects, filters, git), [projects, filters, git]);
  const groups = useMemo(() => groupProjects(shown), [shown]);
  const tags = useMemo(() => tagsInUse(projects), [projects]);
  const flagged = projects.filter((p) => !p.registered || !p.onDisk).length;

  const toggleTag = (tag: string) =>
    setFilters((f) => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag] }));
  const open = (path: string) =>
    openFolder(root, path).then(
      () => setOpenError(null),
      (e) => setOpenError(String(e)),
    );

  if (error) return <Message tone="error">{error}</Message>;
  if (!scan) return <Message>Scanning…</Message>;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {[scan.registryError, openError].filter(Boolean).map((message) => (
        <p key={message} role="alert" className="border-red-900 border-b bg-red-950/40 px-4 py-2 text-red-300 text-sm">
          {message}
        </p>
      ))}
      {flagged > 0 && (
        <p className="border-amber-900/60 border-b bg-amber-950/30 px-4 py-2 text-amber-200 text-sm">
          {flagged} project{flagged === 1 ? " doesn't" : "s don't"} match projects.json: look for the flags below.
        </p>
      )}
      <ProjectFilters
        filters={filters}
        tags={tags}
        statuses={statusesInUse(projects)}
        shown={shown.length}
        total={projects.length}
        onChange={setFilters}
      />
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 && <Message>No project matches these filters.</Message>}
        {groups.map((group) => (
          <section key={group.label} aria-labelledby={`group-${group.label}`}>
            <h2
              id={`group-${group.label}`}
              className="sticky top-0 bg-zinc-950/95 px-4 pt-4 pb-1 font-semibold text-xs text-zinc-500 uppercase tracking-wide"
            >
              {group.label} <span className="font-normal">({group.projects.length})</span>
            </h2>
            <ul className="divide-y divide-zinc-900">
              {group.projects.map((project) => (
                <ProjectRow
                  key={project.path}
                  root={root}
                  project={project}
                  git={git[project.path]}
                  selectedTags={filters.tags}
                  suggestions={tags}
                  canWrite={scan.registryError === null}
                  onTag={toggleTag}
                  onOpen={open}
                  onSaved={reload}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Message({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <p
      role={tone === "error" ? "alert" : undefined}
      className={`p-6 text-center text-sm ${tone ? "text-red-300" : "text-zinc-400"}`}
    >
      {children}
    </p>
  );
}
