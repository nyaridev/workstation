// TagPopover: tag editing 1 (tagEditMode.ts): the tag icon opens a popover with the project's tags, a field for a new
// one and the most used tags; each change saves at once, so there's no Save button.

import { Icon, IconButton, Notice, Popover } from "iro-ui";
import { TagIcon } from "iro-ui/icons";
import { useState } from "react";
import type { Project } from "../../lib/types";
import { TagInput } from "./TagInput";
import { useSaveTags } from "./useSaveTags";

interface Props {
  root: string;
  project: Project;
  suggestions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// The popover's inside, mounted while it's open, so it starts from the project's tags each time.
function Body({ root, project, suggestions, onSaved }: Omit<Props, "open" | "onOpenChange">) {
  const [tags, setDraft] = useState(project.tags);
  const { save, error } = useSaveTags(root, project.path, onSaved);
  const change = (next: string[]) => {
    setDraft(next);
    void save(next);
  };
  return (
    <>
      <TagInput label="Tags" tags={tags} suggestions={suggestions} onChange={change} />
      {error && (
        <Notice tone="danger" role="alert" className="selectable">
          {error}
        </Notice>
      )}
    </>
  );
}

/** The tag icon and its popover. */
export function TagPopover({ open, onOpenChange, ...rest }: Props) {
  return (
    <Popover
      align="end"
      className="tag-popover"
      title={`Tags of ${rest.project.name}`}
      open={open}
      onOpenChange={onOpenChange}
      trigger={<IconButton size="sm" icon={<Icon icon={TagIcon} />} label="Edit tags" />}
    >
      {open && <Body {...rest} />}
    </Popover>
  );
}
