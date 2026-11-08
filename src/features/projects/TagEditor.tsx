// TagEditor: changes a registered project's tags and saves them to projects.json.

import { useState } from "react";
import { setTags } from "../../lib/backend";
import type { Project } from "../../lib/types";
import { TagInput } from "./TagInput";

interface Props {
  root: string;
  project: Project;
  suggestions: string[];
  onDone: (saved: boolean) => void;
}

/** Tag chips with Save and Cancel; errors from Rust show under them. */
export function TagEditor({ root, project, suggestions, onDone }: Props) {
  const [tags, setDraft] = useState(project.tags);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await setTags(root, project.path, tags);
      onDone(true);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3">
      <TagInput label={`Tags of ${project.name}`} tags={tags} suggestions={suggestions} onChange={setDraft} />
      {error && (
        <p role="alert" className="text-red-300 text-sm">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-md bg-zinc-200 px-3 py-1 font-medium text-sm text-zinc-900 hover:bg-white disabled:opacity-50"
        >
          Save tags
        </button>
        <button type="button" onClick={() => onDone(false)} className="rounded-md px-3 py-1 text-sm hover:bg-zinc-800">
          Cancel
        </button>
      </div>
    </div>
  );
}
