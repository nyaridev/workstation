// ProjectRow: one project in the list — name, flags, description, tags, stack, and its actions (open the folder,
// register it in projects.json, or edit its tags), as an iro-ui ListItem whose button lies under its chips (ADR-0011).
// A suite or home opens to show the projects and important folders inside it; a repo opens its git overview. A right
// click offers the same actions.

import { Badge, Chip, ContextMenu, Icon, IconButton, ListItem, type MenuEntry } from "iro-ui";
import { FilePlusIcon, FolderOpenIcon, TagIcon } from "iro-ui/icons";
import { type CSSProperties, useState } from "react";
import type { GitStatuses, Project } from "../../lib/types";
import { FolderRow } from "./FolderRow";
import { statusColor } from "./fields";
import { gitOf, registryFlag } from "./filter";
import { GitBadges } from "./GitBadges";
import { useListLayout } from "./listLayout";
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
  const layout = useListLayout();
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
  const menu: MenuEntry[] = [
    ...(openable ? [{ label: expanded ? "Hide what's inside" : "Show what's inside", onSelect: toggle }] : []),
    ...(hasHistory ? [{ label: "Git overview", onSelect: history }] : []),
    { label: "Open folder", onSelect: () => onOpen(p.path), disabled: !p.onDisk },
    ...(canWrite && !p.registered && !p.archived
      ? [{ label: "Register…", onSelect: () => setEditing("register") }]
      : []),
    ...(canWrite && p.registered ? [{ label: "Edit tags", onSelect: () => setEditing("tags") }] : []),
  ];

  const name = <span className="row-name">{p.name}</span>;
  const status = p.status && <StatusBadge status={p.status} />;
  const gitBadges = <GitBadges git={gitOf(p, git, inside)} />;
  const flagBadge = flag && <Badge tone={p.onDisk ? "warning" : "danger"}>{flag}</Badge>;
  const summaryText = openable && <span className="muted small">{summary.join(" · ")}</span>;
  const path = <code className="selectable">{p.path}</code>;
  const stack = p.stack.length > 0 && <span>{p.stack.join(" · ")}</span>;
  const tagChips = p.tags.map((tag) => (
    <Chip key={tag} size="sm" selected={selectedTags.includes(tag)} onClick={() => onTag(tag)}>
      #{tag}
    </Chip>
  ));
  // shortcut: one row per trial layout (listLayout.ts); keep the picked one's branch, delete the rest.
  const content =
    layout === "compact"
      ? {
          title: (
            <>
              {name}
              {status}
              {gitBadges}
              {flagBadge}
              {summaryText}
            </>
          ),
          meta: path,
        }
      : layout === "tiles"
        ? {
            title: (
              <>
                {name}
                {status}
              </>
            ),
            description: (
              <>
                {p.description && <span className="row-desc">{p.description}</span>}
                <span className="row-meta">
                  {gitBadges}
                  {flagBadge}
                  {summaryText}
                </span>
                <span className="row-meta">{tagChips}</span>
              </>
            ),
          }
        : layout === "table"
          ? {
              title: (
                <span className="row-cells">
                  <span className="row-cell">
                    {name}
                    {flagBadge}
                    {summaryText}
                  </span>
                  <span className="row-cell">{status}</span>
                  <span className="row-cell">{gitBadges}</span>
                  <span className="row-cell muted small">{stack}</span>
                  <span className="row-cell">{tagChips}</span>
                </span>
              ),
            }
          : {
              title: (
                <>
                  {name}
                  {status}
                  {gitBadges}
                  {flagBadge}
                  {summaryText}
                </>
              ),
              description: (
                <>
                  {p.description && <span className="row-desc">{p.description}</span>}
                  <span className="row-meta">
                    {path}
                    {stack}
                    {tagChips}
                  </span>
                </>
              ),
            };

  return (
    <li className="project" data-open={expanded || editing !== null ? "" : undefined}>
      <ContextMenu items={menu}>
        <ListItem
          stretched
          wrap={layout === "cards" || layout === "tiles"}
          expanded={openable ? expanded : undefined}
          onClick={openable ? toggle : hasHistory ? history : undefined}
          title={content.title}
          description={content.description}
          meta={content.meta}
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
                  onClick={() => setEditing("tags")}
                  disabled={editing !== null}
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
