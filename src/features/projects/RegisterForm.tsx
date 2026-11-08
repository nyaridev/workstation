// RegisterForm: adds a projects.json entry for a project folder that has none, prefilled from what's on disk.

import { type FormEvent, useEffect, useState } from "react";
import { guessStack, registerProject } from "../../lib/backend";
import type { GitStatus, NewEntry, Project } from "../../lib/types";
import { KINDS, STATUSES } from "./fields";
import { TagInput } from "./TagInput";

interface Props {
  root: string;
  project: Project;
  /** The project's repo status; its remote's owner prefills Owner. */
  git: GitStatus | undefined;
  suggestions: string[];
  onDone: (saved: boolean) => void;
}

const input = "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm";
const label = "mb-1 block text-xs text-zinc-400";

/** The entry fields; Rust checks them again before writing. */
export function RegisterForm({ root, project, git, suggestions, onDone }: Props) {
  const [entry, setEntry] = useState<NewEntry>({
    name: project.name,
    path: project.path,
    kind: project.kind,
    stack: [],
    // As projects-json.md says: the remote's owner, "local" for a repo without one, empty for a plain folder.
    owner: git ? (git.owner ?? "local") : "",
    status: "prototyping",
    description: "",
    tags: [],
  });
  const [stackText, setStackText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (change: Partial<NewEntry>) => setEntry((e) => ({ ...e, ...change }));

  useEffect(() => {
    guessStack(root, project.path).then(
      (stack) => setStackText(stack.join(", ")),
      () => {},
    );
  }, [root, project.path]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const stack = stackText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await registerProject(root, { ...entry, stack, owner: entry.owner?.trim() || null });
      onDone(true);
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  const id = (field: string) => `register-${project.path}-${field}`;
  return (
    <form
      onSubmit={submit}
      className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-zinc-800 bg-zinc-900/60 p-3"
    >
      <div>
        <label htmlFor={id("name")} className={label}>
          Name
        </label>
        <input
          id={id("name")}
          required
          value={entry.name}
          onChange={(e) => set({ name: e.target.value })}
          className={input}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id("kind")} className={label}>
            Kind
          </label>
          <select id={id("kind")} value={entry.kind} onChange={(e) => set({ kind: e.target.value })} className={input}>
            {KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("status")} className={label}>
            Status
          </label>
          <select
            id={id("status")}
            value={entry.status}
            onChange={(e) => set({ status: e.target.value })}
            className={input}
          >
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="col-span-2">
        <label htmlFor={id("description")} className={label}>
          Description: one sentence, what it is
        </label>
        <input
          id={id("description")}
          required
          value={entry.description}
          onChange={(e) => set({ description: e.target.value })}
          className={input}
        />
      </div>
      <div>
        <label htmlFor={id("stack")} className={label}>
          Stack, comma-separated (guessed from its files)
        </label>
        <input id={id("stack")} value={stackText} onChange={(e) => setStackText(e.target.value)} className={input} />
      </div>
      <div>
        <label htmlFor={id("owner")} className={label}>
          Owner: GitHub owner, "local", or empty for plain folders
        </label>
        <input
          id={id("owner")}
          value={entry.owner ?? ""}
          onChange={(e) => set({ owner: e.target.value })}
          className={input}
        />
      </div>
      <div className="col-span-2">
        <TagInput label="Tags" tags={entry.tags} suggestions={suggestions} onChange={(tags) => set({ tags })} />
      </div>
      {error && (
        <p role="alert" className="col-span-2 text-red-300 text-sm">
          {error}
        </p>
      )}
      <div className="col-span-2 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-200 px-3 py-1 font-medium text-sm text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          Add to projects.json
        </button>
        <button type="button" onClick={() => onDone(false)} className="rounded-md px-3 py-1 text-sm hover:bg-zinc-800">
          Cancel
        </button>
      </div>
    </form>
  );
}
