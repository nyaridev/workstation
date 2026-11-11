// ProjectFilters: the bar above the list: search, the tag dropdown, status, owner and stack pickers, the kind chips,
// the "has changes" and "needs attention" checkboxes, and the picked tags as removable chips.

import { Button, Checkbox, Chip, Icon, Select, TextField } from "iro-ui";
import { SearchIcon } from "iro-ui/icons";
import { ANY, type Filters, NO_FILTERS } from "./filter";
import { TagPicker } from "./TagPicker";

interface Props {
  filters: Filters;
  /** The kind groups with how many projects each holds under the other filters. */
  groups: { label: string; count: number }[];
  tags: [tag: string, count: number][];
  statuses: string[];
  owners: string[];
  stacks: string[];
  shown: number;
  total: number;
  onChange: (filters: Filters) => void;
}

/** Every filter control; a project must pass all of them. */
export function ProjectFilters(props: Props) {
  const { filters, groups, tags, statuses, owners, stacks, shown, total, onChange } = props;
  const set = (change: Partial<Filters>) => onChange({ ...filters, ...change });
  const toggleTag = (tag: string) =>
    set({ tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag] });
  const active = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);
  const pickers = [
    { label: "Status", any: "Any status", value: filters.status, values: statuses, key: "status" },
    { label: "Owner", any: "Any owner", value: filters.owner, values: owners, key: "owner" },
    { label: "Stack", any: "Any stack", value: filters.stack, values: stacks, key: "stack" },
  ] as const;
  const kinds = [{ label: ANY, count: groups.reduce((sum, g) => sum + g.count, 0) }, ...groups];

  return (
    <div className="filters">
      <div className="filters-line">
        <TextField
          type="search"
          size="sm"
          className="search"
          aria-label="Search projects"
          placeholder="Search name, description, path, stack, notes…"
          start={<Icon icon={SearchIcon} />}
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
        />
        <TagPicker tags={tags} selected={filters.tags} onToggle={toggleTag} />
        {pickers.map((p) => (
          <Select
            key={p.key}
            aria-label={p.label}
            size="sm"
            className="picker"
            options={[{ value: ANY, label: p.any }, ...p.values.map((value) => ({ value, label: value }))]}
            value={p.value}
            onValueChange={(value) => set({ [p.key]: value ?? ANY })}
          />
        ))}
      </div>
      <div className="filters-line">
        <fieldset className="kinds">
          <legend className="sr-only">Kind</legend>
          {kinds.map((kind) => (
            <Chip
              key={kind.label}
              selected={filters.group === kind.label}
              count={kind.count}
              onClick={() => set({ group: kind.label })}
            >
              {kind.label || "All"}
            </Chip>
          ))}
        </fieldset>
        <div className="filters-end">
          <Checkbox label="Has changes" checked={filters.changed} onCheckedChange={(changed) => set({ changed })} />
          <Checkbox label="Needs attention" checked={filters.flagged} onCheckedChange={(flagged) => set({ flagged })} />
          <span className="muted small" aria-live="polite">
            {shown === total ? `${total} projects` : `${shown} of ${total}`}
          </span>
          {active && (
            <Button size="sm" variant="ghost" onClick={() => onChange(NO_FILTERS)}>
              Clear filters
            </Button>
          )}
        </div>
      </div>
      {filters.tags.length > 0 && (
        <ul className="chips" aria-label="Picked tags">
          {filters.tags.map((tag) => (
            <li key={tag}>
              <Chip size="sm" selected onRemove={() => toggleTag(tag)} removeLabel={`Stop filtering by ${tag}`}>
                #{tag}
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
