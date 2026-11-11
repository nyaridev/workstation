// TagPicker: the Tags dropdown in the filter bar: a search box and a checkbox per tag in use, with its count.

import { Button, Checkbox, Icon, Popover, TextField } from "iro-ui";
import { ChevronDownIcon } from "iro-ui/icons";
import { useState } from "react";

interface Props {
  /** Every tag in use and how many projects have it, most used first. */
  tags: [tag: string, count: number][];
  selected: string[];
  onToggle: (tag: string) => void;
}

/** A button that opens the tag list; the popover closes on Escape or a click outside. */
export function TagPicker({ tags, selected, onToggle }: Props) {
  const [search, setSearch] = useState("");
  const shown = tags.filter(([tag]) => tag.includes(search.trim().toLowerCase()));

  return (
    <Popover
      align="end"
      className="tag-picker"
      trigger={
        <Button size="sm" iconEnd={<Icon icon={ChevronDownIcon} />}>
          Tags{selected.length > 0 && ` · ${selected.length}`}
        </Button>
      }
    >
      <TextField
        type="search"
        size="sm"
        aria-label="Find a tag"
        placeholder="Find a tag…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <fieldset className="tag-list">
        <legend className="sr-only">Show projects with every checked tag</legend>
        {shown.map(([tag, count]) => (
          <Checkbox
            key={tag}
            label={
              <span className="tag-option">
                <span>{tag}</span>
                <span className="muted small">{count}</span>
              </span>
            }
            checked={selected.includes(tag)}
            onCheckedChange={() => onToggle(tag)}
          />
        ))}
        {shown.length === 0 && <p className="muted small">No tag matches.</p>}
      </fieldset>
    </Popover>
  );
}
