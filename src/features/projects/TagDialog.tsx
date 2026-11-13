// TagDialog: edits a registered project's tags: every tag in use as a toggle chip, the project's own first and on,
// and a field for a new one; Save writes them to projects.json, Cancel leaves them.

import { Button, Chip, Dialog, Notice, TextField } from "iro-ui";
import { useState } from "react";
import type { Project } from "../../lib/types";
import { toTag } from "./fields";
import { useSaveTags } from "./useSaveTags";

interface Props {
  root: string;
  project: Project;
  /** Every tag in use, most used first. */
  suggestions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// The dialog's inside, mounted while it's open, so it starts from the project's tags each time.
function Body({ root, project, suggestions, onOpenChange, onSaved }: Omit<Props, "open">) {
  const [tags, setDraft] = useState(project.tags);
  const [typed, setTyped] = useState("");
  const { save, saving, error } = useSaveTags(root, project.path, onSaved);
  // The order is set when the dialog opens (the project's own tags first), so chips never move while toggling; a
  // typed tag joins at the end and stays there even when unticked.
  const [order, setOrder] = useState(() => [...new Set([...project.tags, ...suggestions])]);
  const toggle = (tag: string) => setDraft(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  const add = () => {
    const tag = toTag(typed);
    if (tag && !order.includes(tag)) setOrder([...order, tag]);
    if (tag && !tags.includes(tag)) setDraft([...tags, tag]);
    setTyped("");
  };

  return (
    <>
      <fieldset className="chips tag-dialog-chips">
        <legend className="sr-only">Tags</legend>
        {order.map((tag) => (
          <Chip key={tag} size="sm" selected={tags.includes(tag)} onClick={() => toggle(tag)}>
            #{tag}
          </Chip>
        ))}
      </fieldset>
      <TextField
        size="sm"
        aria-label="New tag"
        placeholder="New tag, then Enter"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") add();
        }}
      />
      {error && (
        <Notice tone="danger" role="alert" className="selectable">
          {error}
        </Notice>
      )}
      <div className="buttons tag-dialog-buttons">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={saving}
          onClick={async () => {
            if (await save(tags)) onOpenChange(false);
          }}
        >
          Save tags
        </Button>
      </div>
    </>
  );
}

/** The dialog; opened by the row's tag icon or menu. */
export function TagDialog({ open, ...rest }: Props) {
  return (
    <Dialog
      title={`Tags of ${rest.project.name}`}
      description="Click a tag to add or remove it."
      open={open}
      onOpenChange={rest.onOpenChange}
    >
      {open && <Body {...rest} />}
    </Dialog>
  );
}
