// ProjectRow: one project in the list — name, flags, description, tags, stack, and its actions (open the folder,
// register it in projects.json, or edit its tags). A suite or home opens to show the projects and important folders
// inside it.

import { Badge, Button, Chip, Icon } from "iro-ui";
import { ChevronRightIcon } from "iro-ui/icons";
import { type CSSProperties, useState } from "react";
import type { GitStatuses, Project } from "../../lib/types";
import { FolderRow } from "./FolderRow";
import { statusColor } from "./fields";
import { gitOf, registryFlag } from "./filter";
import { GitBadges } from "./GitBadges";
import { RegisterForm } from "./RegisterForm";
import { TagEditor } from "./TagEditor";

interface Props {
  root: string;
  project: Project;
  /** Projects inside other projects (a suite's repos), by the parent's path. */
  inside: Map<string, Project[]>;
  /** Git status by path; a project or folder without one isn't a repo (or git couldn't read it). */
  git: GitStatuses;
  selectedTags: string[];
  /** Tags already in use, suggested while editing. */
  suggestions: string[];
  /** False while projects.json can't be read, so nothing is offered that would write it. */
  canWrite: boolean;
  onTag: (tag: string) => void;
  onOpen: (path: string) => void;
  /** Opens the git overview of a repo (by path), with the name to show. */
  onHistory: (path: string, name: string) => void;
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
    selectedTags,
    suggestions,
    canWrite,
    onTag,
    onOpen,
    onHistory,
    onSaved,
  } = props;
  const [editing, setEditing] = useState<"register" | "tags" | null>(null);
  const [expanded, setExpanded] = useState(false);
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

  return (
    <li className="project">
      <div className="row" data-clickable={openable || hasHistory || undefined}>
        {/* The whole row is clickable: this button lies under the row's content, which lets clicks through except on
            its own buttons. */}
        {openable && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} what's inside ${p.name}`}
            onClick={() => setExpanded(!expanded)}
            className="row-hit"
          />
        )}
        {hasHistory && (
          <button
            type="button"
            aria-label={`Show the git history of ${p.name}`}
            onClick={() => onHistory(p.path, p.name)}
            className="row-hit"
          />
        )}
        <div className="row-body">
          <div className="row-head">
            {openable && (
              <Icon icon={ChevronRightIcon} size={14} className="chevron" data-open={expanded || undefined} />
            )}
            <span className="row-name">{p.name}</span>
            {p.status && <StatusBadge status={p.status} />}
            <GitBadges git={gitOf(p, git, inside)} />
            {flag && <Badge tone={p.onDisk ? "warning" : "danger"}>{flag}</Badge>}
            {openable && <span className="muted small">{summary.join(" · ")}</span>}
          </div>
          {p.description && <p className="row-desc">{p.description}</p>}
          <div className="row-meta">
            <code>{p.path}</code>
            {p.stack.length > 0 && <span>{p.stack.join(" · ")}</span>}
            {p.tags.map((tag) => (
              <Chip
                key={tag}
                size="sm"
                className="hit"
                selected={selectedTags.includes(tag)}
                onClick={() => onTag(tag)}
              >
                #{tag}
              </Chip>
            ))}
          </div>
        </div>
        <div className="row-actions">
          {canWrite && !p.registered && !p.archived && (
            <Button size="sm" onClick={() => setEditing("register")} disabled={editing !== null}>
              Register…
            </Button>
          )}
          {canWrite && p.registered && (
            <Button size="sm" onClick={() => setEditing("tags")} disabled={editing !== null}>
              Edit tags
            </Button>
          )}
          <Button size="sm" disabled={!p.onDisk} onClick={() => onOpen(p.path)}>
            Open folder
          </Button>
        </div>
      </div>
      {editing === "register" && (
        <RegisterForm root={root} project={p} git={git[p.path]} suggestions={suggestions} onDone={done} />
      )}
      {editing === "tags" && <TagEditor root={root} project={p} suggestions={suggestions} onDone={done} />}
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
              onHistory={() => onHistory(folder.path, `${p.name} / ${folder.name}`)}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
