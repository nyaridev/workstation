// InlineTags: tag editing 2 (tagEditMode.ts): the row's tags column. Clicking it (or the tag icon) turns it into a tag
// field in place; Enter on an empty field or ✓ saves, Escape or ✕ cancels.

import { Button, Chip, Icon, IconButton, TagInput as TagField, Tooltip } from "iro-ui";
import { CheckIcon, CloseIcon } from "iro-ui/icons";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Project } from "../../lib/types";
import { toTag } from "./fields";
import { useSaveTags } from "./useSaveTags";

interface Props {
  root: string;
  project: Project;
  /** Only registered projects have tags to edit. */
  canEdit: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onSaved: () => void;
}

// The field, mounted while editing, so it starts from the project's tags each time.
function Editor({ root, project, onEditingChange, onSaved }: Omit<Props, "canEdit" | "editing">) {
  const [tags, setDraft] = useState(project.tags);
  const { save, saving, error } = useSaveTags(root, project.path, onSaved);
  const box = useRef<HTMLSpanElement>(null);
  // The field takes the focus as it opens, so typing goes straight in.
  useEffect(() => box.current?.querySelector("input")?.focus(), []);
  const finish = async () => {
    if (await save(tags)) onEditingChange(false);
  };
  const keys = (event: KeyboardEvent) => {
    if (event.key === "Escape") onEditingChange(false);
    // Enter adds what's typed; on an empty field it saves.
    if (event.key === "Enter" && (event.target as HTMLInputElement).value === "") void finish();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the keys only add shortcuts to the field and buttons inside.
    <span className="row-tags-edit" ref={box} onKeyDown={keys}>
      <Tooltip content={error ?? "Enter adds a tag; Enter on an empty field saves, Escape cancels"}>
        <TagField
          size="sm"
          aria-label={`Tags of ${project.name}`}
          invalid={error !== null}
          value={tags}
          onValueChange={(next) => setDraft([...new Set(next.map(toTag).filter(Boolean))])}
        />
      </Tooltip>
      <IconButton size="sm" icon={<Icon icon={CheckIcon} />} label="Save tags" loading={saving} onClick={finish} />
      <IconButton size="sm" icon={<Icon icon={CloseIcon} />} label="Cancel" onClick={() => onEditingChange(false)} />
    </span>
  );
}

/** The tags column: the chips, or the field while editing. */
export function InlineTags({ canEdit, editing, ...rest }: Props) {
  if (editing && canEdit) return <Editor {...rest} />;
  const chips = rest.project.tags.map((tag) => (
    <Chip key={tag} size="sm">
      #{tag}
    </Chip>
  ));
  if (!canEdit) return <span className="row-tags">{chips}</span>;
  return (
    <Button
      size="sm"
      variant="ghost"
      className="row-tags row-tags-button"
      aria-label={`Edit the tags of ${rest.project.name}`}
      onClick={() => rest.onEditingChange(true)}
    >
      {chips.length > 0 ? chips : <span className="muted small">Add tags</span>}
    </Button>
  );
}
