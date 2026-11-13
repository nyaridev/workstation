// TagPicker: the Tags dropdown in the filter bar: a search box and a checkbox per tag in use, with its count. Its
// trigger looks like the Select dropdowns beside it.

import { Checkbox, Icon, Popover, TextField } from "iro-ui";
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
      align="start"
      className="tag-picker"
      trigger={
        // shortcut: borrows iro-ui's Select classes, since its MultiSelect has no search or counts; switch when it does.
        <button type="button" className="iro-select picker" data-size="sm" aria-label="Tags">
          <span className="iro-select-value">
            {selected.length === 0 ? "Any tag" : `${selected.length} ${selected.length === 1 ? "tag" : "tags"}`}
          </span>
          <span className="iro-select-icon">
            <Icon icon={ChevronDownIcon} />
          </span>
        </button>
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
