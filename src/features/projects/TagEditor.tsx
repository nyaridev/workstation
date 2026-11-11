// TagEditor: changes a registered project's tags and saves them to projects.json.

import { Button, Notice, Panel } from "iro-ui";
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
    <Panel className="editor">
      <TagInput label={`Tags of ${project.name}`} tags={tags} suggestions={suggestions} onChange={setDraft} />
      {error && (
        <Notice tone="danger" role="alert">
          {error}
        </Notice>
      )}
      <div className="buttons">
        <Button variant="primary" loading={saving} onClick={save}>
          Save tags
        </Button>
        <Button variant="ghost" onClick={() => onDone(false)}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
