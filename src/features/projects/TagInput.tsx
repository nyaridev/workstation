// TagInput: edits a list of tags with iro-ui's tag field (Enter or a comma adds one), turns each into a proper tag,
// and offers the most used tags not yet picked as chips to add with a click.

import { Chip, Field, Icon, TagInput as TagField } from "iro-ui";
import { PlusIcon } from "iro-ui/icons";
import { toTag } from "./fields";

interface Props {
  label: string;
  tags: string[];
  /** Tags in use, most used first. */
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

/** How many suggested tags to show. */
const SUGGESTED = 12;

/** The tag field, then a row of suggested tags. */
export function TagInput({ label, tags, suggestions, onChange }: Props) {
  const change = (next: string[]) => onChange([...new Set(next.map(toTag).filter(Boolean))]);
  const unused = suggestions.filter((tag) => !tags.includes(tag)).slice(0, SUGGESTED);

  return (
    <div className="tag-input">
      <Field label={label}>
        <TagField value={tags} onValueChange={change} placeholder="Type a tag, then Enter" />
      </Field>
      {unused.length > 0 && (
        <fieldset className="chips suggested">
          <legend className="sr-only">Tags in use</legend>
          {unused.map((tag) => (
            <Chip key={tag} size="sm" icon={<Icon icon={PlusIcon} size={12} />} onClick={() => change([...tags, tag])}>
              <span className="sr-only">Add </span>
              {tag}
            </Chip>
          ))}
        </fieldset>
      )}
    </div>
  );
}
