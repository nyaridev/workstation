// ProjectRow: one project on one line (ADR-0018), in the same columns as every row: the name (its description and
// path as a tooltip, its flags and what's inside), the status, the git badges and the remote's owner/name; then its
// actions (register it in projects.json, edit its tags in a dialog, pull it, open the folder) as icon buttons. A suite or home
// opens to show the projects and important folders inside it; a repo opens its git overview. A right click offers the
// same actions.

import { Badge, Button, ContextMenu, Icon, IconButton, ListItem, type MenuEntry, ProgressBar, Tooltip } from "iro-ui";
import { ArrowDownIcon, FilePlusIcon, FlagIcon, FolderOpenIcon, TagIcon } from "iro-ui/icons";
import { type CSSProperties, useRef, useState } from "react";
import type { GitStatuses, Project } from "../../lib/types";
import { FolderRow } from "./FolderRow";
import { statusColor } from "./fields";
import { gitOf, registryFlag } from "./filter";
import { GitBadges } from "./GitBadges";
import { tracksOf } from "./milestones";
import { RegisterForm } from "./RegisterForm";
import { TagDialog } from "./TagDialog";

interface Props {
  root: string;
  project: Project;
  /** Projects inside other projects (a suite's repos), by the parent's path. */
  inside: Map<string, Project[]>;
  /** Git status by path; a project or folder without one isn't a repo (or git couldn't read it). */
  git: GitStatuses;
  /** Tags already in use, suggested while editing. */
  suggestions: string[];
  /** False while projects.json can't be read, so nothing is offered that would write it. */
  canWrite: boolean;
  onOpen: (path: string) => void;
  /** Pulls the repo at a path by fast-forward (ADR-0018); the row shows it working until it settles. */
  onPull: (path: string, name: string) => Promise<void>;
  /** Opens a repo's remote page in the browser. */
  onOpenPage: (path: string) => void;
  /** Opens the git overview of a repo (by path), with the name to show. */
  onHistory: (path: string, name: string) => void;
  /** Opens a project's milestones, on a track's tab when one is named. */
  onMilestones: (project: Project, track?: string | null) => void;
  onSaved: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// A status badge tinted with its palette color; on-hold and unknown statuses stay neutral.
function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  const style = color
    ? ({ "--status": `var(--iro-${color})`, "--status-ink": `var(--iro-${color}-ink)` } as CSSProperties)
    : undefined;
  return (
    <Badge className={color ? "status status-colored" : "status"} style={style}>
      {status}
    </Badge>
  );
}

/** A project line; its tags toggle the tag filter. */
export function ProjectRow(props: Props) {
  const {
    root,
    project: p,
    inside,
    git,
    suggestions,
    canWrite,
    onOpen,
    onPull,
    onOpenPage,
    onHistory,
    onMilestones,
    onSaved,
  } = props;
  // The milestone being worked on; none once the last one is done, and then the row has no second line.
  // One line per plan still in progress; none once every milestone is done.
  const working = tracksOf(p.milestones).filter((t) => t.progress);
  const [editing, setEditing] = useState<"register" | null>(null);
  // The tag dialog is open.
  const [tagsOpen, setTagsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pulling, setPulling] = useState(false);
  const name = useRef<HTMLSpanElement>(null);
  // How far a long name pans while its row is hovered, and how long that takes (`.row-name` in styles.css).
  const measureName = () => {
    const box = name.current?.parentElement;
    if (!box) return;
    const hidden = Math.max(0, box.scrollWidth - box.clientWidth);
    box.style.setProperty("--name-pan", `${hidden}px`);
    box.style.setProperty("--name-time", `${2 + hidden / 30}s`);
  };
  const done = (saved: boolean) => {
    setEditing(null);
    if (saved) onSaved();
  };

  const flag = registryFlag(p);
  const inner = inside.get(p.path) ?? [];
  const summary = [
    inner.length > 0 && plural(inner.length, "project"),
    p.folders.length > 0 && plural(p.folders.length, "folder"),
  ].filter(Boolean);
  const openable = summary.length > 0;
  // A repo of its own (not a home that holds one) opens its git overview instead.
  const hasHistory = !openable && p.repo && git[p.path] !== undefined;

  const toggle = () => setExpanded(!expanded);
  const history = () => onHistory(p.path, p.name);
  // Its own repo (a game home's `game/`), not the totals of the repos inside a suite.
  const own = p.repo ? git[p.path] : undefined;
  // Only when the remote has commits this copy lacks (as of the last fetch).
  const canPull = p.onDisk && (own?.behind ?? 0) > 0;
  const pull = async () => {
    setPulling(true);
    await onPull(p.path, p.name);
    setPulling(false);
  };
  const menu: MenuEntry[] = [
    ...(openable ? [{ label: expanded ? "Hide what's inside" : "Show what's inside", onSelect: toggle }] : []),
    ...(hasHistory ? [{ label: "Git overview", onSelect: history }] : []),
    ...(p.milestones.length > 0 ? [{ label: "Milestones", onSelect: () => onMilestones(p) }] : []),
    ...(canPull ? [{ label: "Pull from the remote", onSelect: () => void pull(), disabled: pulling }] : []),
    { label: "Open folder", onSelect: () => onOpen(p.path), disabled: !p.onDisk },
    ...(own?.owner ? [{ label: "Open in browser", onSelect: () => onOpenPage(p.path) }] : []),
    ...(canWrite && !p.registered && !p.archived
      ? [{ label: "Register…", onSelect: () => setEditing("register") }]
      : []),
    ...(canWrite && p.registered ? [{ label: "Edit tags", onSelect: () => setTagsOpen(true) }] : []),
  ];

  const remote = own && (own.owner ? `${own.owner}/${own.repo ?? "?"}` : "no remote");

  return (
    <li className="project" onMouseEnter={measureName}>
      <ContextMenu items={menu}>
        <ListItem
          stretched
          expanded={openable ? expanded : undefined}
          onClick={openable ? toggle : hasHistory ? history : undefined}
          title={
            <span className="row-cells">
              <span className="row-cell">
                <Tooltip
                  content={
                    <span className="row-tip">
                      {p.description && <span>{p.description}</span>}
                      <code>{p.path}</code>
                    </span>
                  }
                >
                  <span className="row-name">
                    <span ref={name}>{p.name}</span>
                  </span>
                </Tooltip>
                {flag && <Badge tone={p.onDisk ? "warning" : "danger"}>{flag}</Badge>}
                {openable && <span className="muted small">{summary.join(" · ")}</span>}
              </span>
              <span className="row-cell">{p.status && <StatusBadge status={p.status} />}</span>
              <span className="row-cell">
                <GitBadges git={gitOf(p, git, inside)} />
              </span>
              <span className="row-cell row-remote">{remote}</span>
            </span>
          }
          description={
            working.length > 0 && (
              <span className="row-milestones">
                {working.map(({ name: track, progress }) =>
                  progress ? (
                    // One button from the flag to the count, so a click anywhere on the line opens that plan.
                    <Button
                      key={track ?? ""}
                      size="sm"
                      variant="ghost"
                      className="row-milestone"
                      aria-label={`${track ?? "Milestones"}: ${progress.current.name}, ${progress.done} of ${progress.total} done`}
                      onClick={() => onMilestones(p, track)}
                    >
                      <span className="row-milestone-name">
                        <Icon icon={FlagIcon} />
                        <span className="row-milestone-text">
                          {track && <span className="row-milestone-track">{track} · </span>}
                          {progress.current.name}
                        </span>
                      </span>
                      <ProgressBar size="sm" value={progress.done / progress.total} className="row-milestone-bar" />
                      <span className="row-milestone-count">
                        {progress.done} of {progress.total} done
                      </span>
                    </Button>
                  ) : null,
                )}
              </span>
            )
          }
          actions={
            <>
              {canWrite && !p.registered && !p.archived && (
                <IconButton
                  size="sm"
                  icon={<Icon icon={FilePlusIcon} />}
                  label="Register in projects.json…"
                  onClick={() => setEditing("register")}
                  disabled={editing !== null}
                />
              )}
              {canWrite && p.registered && (
                <IconButton
                  size="sm"
                  icon={<Icon icon={TagIcon} />}
                  label="Edit tags"
                  onClick={() => setTagsOpen(true)}
                />
              )}
              {canPull && (
                <IconButton
                  size="sm"
                  icon={<Icon icon={ArrowDownIcon} />}
                  label="Pull from the remote"
                  loading={pulling}
                  onClick={() => void pull()}
                />
              )}
              <IconButton
                size="sm"
                icon={<Icon icon={FolderOpenIcon} />}
                label="Open folder"
                disabled={!p.onDisk}
                onClick={() => onOpen(p.path)}
              />
            </>
          }
        />
      </ContextMenu>
      {editing === "register" && (
        <RegisterForm root={root} project={p} git={git[p.path]} suggestions={suggestions} onDone={done} />
      )}
      {canWrite && p.registered && (
        <TagDialog
          root={root}
          project={p}
          suggestions={suggestions}
          open={tagsOpen}
          onOpenChange={setTagsOpen}
          onSaved={onSaved}
        />
      )}
      {expanded && (
        <ul className="rows nested">
          {inner.map((child) => (
            <ProjectRow key={child.path} {...props} project={child} />
          ))}
          {p.folders.map((folder) => (
            <FolderRow
              key={folder.path}
              folder={folder}
              git={git[folder.path]}
              onOpen={onOpen}
              onPull={() => onPull(folder.path, `${p.name} / ${folder.name}`)}
              onOpenPage={() => onOpenPage(folder.path)}
              onHistory={() => onHistory(folder.path, `${p.name} / ${folder.name}`)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
