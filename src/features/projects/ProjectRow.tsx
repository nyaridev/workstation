// ProjectRow: one project in the list — name, flags, description, tags, stack, and its actions (open the folder,
// register it in projects.json, or edit its tags). A suite or home opens to show the projects and important folders
// inside it.

import { useState } from "react";
import type { GitStatuses, Project } from "../../lib/types";
import { FolderRow } from "./FolderRow";
import { hasChanges, registryFlag } from "./filter";
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
  onSaved: () => void;
}

const action =
  "rounded-md bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** A project line; its tags toggle the tag filter. */
export function ProjectRow(props: Props) {
  const { root, project: p, inside, git, selectedTags, suggestions, canWrite, onTag, onOpen, onSaved } = props;
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
  const changed = [...inner.map((c) => c.path), ...p.folders.map((f) => f.path)].filter((path) =>
    hasChanges(git[path]),
  ).length;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-zinc-100">{p.name}</span>
            {p.status && <span className="text-xs text-zinc-500">{p.status}</span>}
            <GitBadges git={git[p.path]} />
            {flag && (
              <span
                className={`rounded px-1.5 text-xs ${p.onDisk ? "bg-amber-900/50 text-amber-300" : "bg-red-900/50 text-red-300"}`}
              >
                {flag}
              </span>
            )}
            {summary.length > 0 && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 self-center rounded-full bg-zinc-800/80 py-0.5 pr-2.5 pl-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                  className={expanded ? "rotate-90" : ""}
                >
                  <path d="M3.5 2 6.5 5 3.5 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {summary.join(" · ")}
                {changed > 0 && <span className="text-amber-300">· changes in {changed}</span>}
              </button>
            )}
          </div>
          {p.description && <p className="mt-0.5 text-sm text-zinc-400">{p.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
            <code>{p.path}</code>
            {p.stack.length > 0 && <span>{p.stack.join(" · ")}</span>}
            {p.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={selectedTags.includes(tag)}
                onClick={() => onTag(tag)}
                className="text-sky-400/80 hover:text-sky-300"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {canWrite && !p.registered && !p.archived && (
            <button type="button" onClick={() => setEditing("register")} disabled={editing !== null} className={action}>
              Register…
            </button>
          )}
          {canWrite && p.registered && (
            <button type="button" onClick={() => setEditing("tags")} disabled={editing !== null} className={action}>
              Edit tags
            </button>
          )}
          <button type="button" disabled={!p.onDisk} onClick={() => onOpen(p.path)} className={action}>
            Open folder
          </button>
        </div>
      </div>
      {editing === "register" && (
        <RegisterForm root={root} project={p} git={git[p.path]} suggestions={suggestions} onDone={done} />
      )}
      {editing === "tags" && <TagEditor root={root} project={p} suggestions={suggestions} onDone={done} />}
      {expanded && (
        <ul className="mt-3 -mr-4 ml-1 divide-y divide-zinc-900 border-zinc-800 border-l">
          {inner.map((child) => (
            <ProjectRow key={child.path} {...props} project={child} />
          ))}
          {p.folders.map((folder) => (
            <FolderRow key={folder.path} folder={folder} git={git[folder.path]} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </li>
  );
}
