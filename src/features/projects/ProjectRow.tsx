// ProjectRow: one project in the list — name, flags, description, tags, stack, and its actions
// (open the folder, register it in projects.json, or edit its tags).

import { useState } from "react";
import type { GitStatus, Project } from "../../lib/types";
import { registryFlag } from "./filter";
import { GitBadges } from "./GitBadges";
import { RegisterForm } from "./RegisterForm";
import { TagEditor } from "./TagEditor";

interface Props {
  root: string;
  project: Project;
  /** Undefined when the project isn't a repo (or git couldn't read it). */
  git: GitStatus | undefined;
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

/** A project line; its tags toggle the tag filter. */
export function ProjectRow(props: Props) {
  const { root, project: p, git, selectedTags, suggestions, canWrite, onTag, onOpen, onSaved } = props;
  const [editing, setEditing] = useState<"register" | "tags" | null>(null);
  const flag = registryFlag(p);
  const done = (saved: boolean) => {
    setEditing(null);
    if (saved) onSaved();
  };

  return (
    <li className="px-4 py-3 hover:bg-zinc-900/60">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-zinc-100">{p.name}</span>
            {p.status && <span className="text-xs text-zinc-500">{p.status}</span>}
            <GitBadges git={git} />
            {flag && (
              <span
                className={`rounded px-1.5 text-xs ${p.onDisk ? "bg-amber-900/50 text-amber-300" : "bg-red-900/50 text-red-300"}`}
              >
                {flag}
              </span>
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
        <RegisterForm root={root} project={p} git={git} suggestions={suggestions} onDone={done} />
      )}
      {editing === "tags" && <TagEditor root={root} project={p} suggestions={suggestions} onDone={done} />}
    </li>
  );
}
