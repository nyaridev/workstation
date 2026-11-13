// ProjectFilters: the bar above the list. One line holds the search and a square Filters button whose menu has the
// order (name or last edited), tags, status, owner, stack, "has changes" and "needs attention" (lit while a filter is
// set); the kind chips go under it, then the filters in use as removable chips, only when there are any.

import { Button, Checkbox, Chip, Field, Icon, IconButton, Popover, Segmented, Select, TextField } from "iro-ui";
import { SearchIcon, SlidersIcon } from "iro-ui/icons";
import { ANY, type Filters, NO_FILTERS, type SortBy } from "./filter";
import { TagPicker } from "./TagPicker";

interface Props {
  filters: Filters;
  /** The kind groups with how many projects each holds under the other filters. */
  groups: { label: string; count: number }[];
  tags: [tag: string, count: number][];
  statuses: string[];
  owners: string[];
  stacks: string[];
  onChange: (filters: Filters) => void;
}

/** Every filter control; a project must pass all of them. */
export function ProjectFilters(props: Props) {
  const { filters, groups, tags, statuses, owners, stacks, onChange } = props;
  const set = (change: Partial<Filters>) => onChange({ ...filters, ...change });
  const toggleTag = (tag: string) =>
    set({ tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag] });
  const pickers = [
    { label: "Status", any: "Any status", value: filters.status, values: statuses, key: "status" },
    { label: "Owner", any: "Any owner", value: filters.owner, values: owners, key: "owner" },
    { label: "Stack", any: "Any stack", value: filters.stack, values: stacks, key: "stack" },
  ] as const;
  const kinds = [{ label: ANY, count: groups.reduce((sum, g) => sum + g.count, 0) }, ...groups];
  // The menu's filters that are set, each a removable chip under the kinds.
  const picked = [
    ...pickers
      .filter((p) => p.value !== ANY)
      .map((p) => ({ key: p.key, label: `${p.label}: ${p.value}`, remove: () => set({ [p.key]: ANY }) })),
    ...(filters.changed ? [{ key: "changed", label: "Has changes", remove: () => set({ changed: false }) }] : []),
    ...(filters.flagged ? [{ key: "flagged", label: "Needs attention", remove: () => set({ flagged: false }) }] : []),
  ];
  const inMenu = picked.length + filters.tags.length;

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
        <Popover
          align="end"
          className="filters-menu"
          title="Filters"
          trigger={
            <IconButton
              size="sm"
              className="filters-button"
              icon={<Icon icon={SlidersIcon} />}
              label={inMenu > 0 ? `Filters (${inMenu} set)` : "Filters"}
              active={inMenu > 0}
            />
          }
        >
          <Field label="Sort by">
            <Segmented<SortBy>
              size="sm"
              full
              aria-label="Sort by"
              options={[
                { value: "name", label: "Name" },
                { value: "edited", label: "Last edited" },
              ]}
              value={filters.sort}
              onValueChange={(sort) => set({ sort })}
            />
          </Field>
          <Field label="Tags">
            <TagPicker tags={tags} selected={filters.tags} onToggle={toggleTag} />
          </Field>
          {pickers.map((p) => (
            <Field key={p.key} label={p.label}>
              <Select
                size="sm"
                className="picker"
                options={[{ value: ANY, label: p.any }, ...p.values.map((value) => ({ value, label: value }))]}
                value={p.value}
                onValueChange={(value) => set({ [p.key]: value ?? ANY })}
              />
            </Field>
          ))}
          <div className="filters-menu-checks">
            <Checkbox label="Has changes" checked={filters.changed} onCheckedChange={(changed) => set({ changed })} />
            <Checkbox
              label="Needs attention"
              checked={filters.flagged}
              onCheckedChange={(flagged) => set({ flagged })}
            />
          </div>
        </Popover>
      </div>
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
      {inMenu > 0 && (
        <ul className="chips" aria-label="Filters in use">
          {picked.map((p) => (
            <li key={p.key}>
              <Chip size="sm" selected onRemove={p.remove} removeLabel={`Remove ${p.label}`}>
                {p.label}
              </Chip>
            </li>
          ))}
          {filters.tags.map((tag) => (
            <li key={tag}>
              <Chip size="sm" selected onRemove={() => toggleTag(tag)} removeLabel={`Stop filtering by ${tag}`}>
                #{tag}
              </Chip>
            </li>
          ))}
          <li>
            <Button size="sm" variant="ghost" onClick={() => onChange({ ...NO_FILTERS, sort: filters.sort })}>
              Clear filters
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}
