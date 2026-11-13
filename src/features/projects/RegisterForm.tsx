// RegisterForm: writes a .workstation into a project folder that has none, prefilled from what's on disk.

import { Button, Field, Notice, Panel, Select, TextField } from "iro-ui";
import { type FormEvent, useEffect, useState } from "react";
import { guessStack, registerProject } from "../../lib/backend";
import type { GitStatus, NewEntry, Project } from "../../lib/types";
import { KINDS, STATUSES, startingStatus } from "./fields";
import { TagInput } from "./TagInput";

interface Props {
  root: string;
  project: Project;
  /** The project's repo status; its remote's owner prefills Owner. */
  git: GitStatus | undefined;
  suggestions: string[];
  onDone: (saved: boolean) => void;
}

const options = (values: readonly string[]) => values.map((value) => ({ value, label: value }));

/** The entry fields; Rust checks them again before writing. */
export function RegisterForm({ root, project, git, suggestions, onDone }: Props) {
  const [entry, setEntry] = useState<NewEntry>({
    name: project.name,
    path: project.path,
    kind: project.kind,
    stack: [],
    // As workstation-file.md says: the remote's owner, "local" for a repo without one, empty for a plain folder.
    owner: git ? (git.owner ?? "local") : "",
    status: startingStatus(project.kind),
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

  return (
    <Panel className="editor">
      <form onSubmit={submit} className="register">
        <Field label="Name">
          <TextField required value={entry.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <div className="pair">
          <Field label="Kind">
            <Select options={options(KINDS)} value={entry.kind} onValueChange={(kind) => kind && set({ kind })} />
          </Field>
          <Field label="Status">
            <Select
              options={options(STATUSES)}
              value={entry.status}
              onValueChange={(status) => status && set({ status })}
            />
          </Field>
        </div>
        <Field className="wide" label="Description" hint="One sentence: what it is.">
          <TextField required value={entry.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="Stack" hint="Comma-separated, guessed from its files.">
          <TextField value={stackText} onChange={(e) => setStackText(e.target.value)} />
        </Field>
        <Field label="Owner" hint='GitHub owner, "local", or empty for plain folders.'>
          <TextField value={entry.owner ?? ""} onChange={(e) => set({ owner: e.target.value })} />
        </Field>
        <div className="wide">
          <TagInput label="Tags" tags={entry.tags} suggestions={suggestions} onChange={(tags) => set({ tags })} />
        </div>
        {error && (
          <Notice tone="danger" role="alert" className="wide selectable">
            {error}
          </Notice>
        )}
        <div className="wide buttons">
          <Button type="submit" variant="primary" loading={saving}>
            Create .workstation
          </Button>
          <Button variant="ghost" onClick={() => onDone(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
