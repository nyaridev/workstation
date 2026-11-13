// ProjectFilters: the bar above the list: search, the tag dropdown, status, owner and stack pickers, the kind chips,
// "has changes" and "needs attention", the count, and the picked filters as removable chips. It's laid out in one of
// three ways while the owner picks one (`filterLayout.ts`); in the `rail` layout the kinds sit in `KindRail` instead.

import { Button, Checkbox, Chip, CountBubble, Field, Icon, Popover, Select, TextField } from "iro-ui";
import { SearchIcon, SlidersIcon } from "iro-ui/icons";
import { ANY, type Filters, NO_FILTERS } from "./filter";
import type { FilterLayout } from "./filterLayout";
import { groupIcon } from "./groupIcons";
import { TagPicker } from "./TagPicker";

interface Props {
  layout: FilterLayout;
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
  const { layout, filters, groups, tags, statuses, owners, stacks, shown, total, onChange } = props;
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
  // What the Filters menu holds that's set: the badge on its button.
  const inMenu =
    filters.tags.length +
    pickers.filter((p) => p.value !== ANY).length +
    Number(filters.changed) +
    Number(filters.flagged);

  // ── Pieces ──────────────────────────────
  const search = (
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
  );
  const tagPicker = <TagPicker tags={tags} selected={filters.tags} onToggle={toggleTag} />;
  const selects = pickers.map((p) => (
    <Select
      key={p.key}
      aria-label={p.label}
      size="sm"
      className="picker"
      options={[{ value: ANY, label: p.any }, ...p.values.map((value) => ({ value, label: value }))]}
      value={p.value}
      onValueChange={(value) => set({ [p.key]: value ?? ANY })}
    />
  ));
  const checkboxes = (
    <>
      <Checkbox label="Has changes" checked={filters.changed} onCheckedChange={(changed) => set({ changed })} />
      <Checkbox label="Needs attention" checked={filters.flagged} onCheckedChange={(flagged) => set({ flagged })} />
    </>
  );
  const kindChips = (
    <fieldset className="kinds">
      <legend className="sr-only">Kind</legend>
      {kinds.map((kind) => (
        <Chip
          key={kind.label}
          icon={layout === "kinds" ? <Icon icon={groupIcon(kind.label)} /> : undefined}
          selected={filters.group === kind.label}
          count={kind.count}
          onClick={() => set({ group: kind.label })}
        >
          {kind.label || "All"}
        </Chip>
      ))}
    </fieldset>
  );
  const count = (
    <span className="muted small filters-count" aria-live="polite">
      {shown === total ? `${total} projects` : `${shown} of ${total}`}
    </span>
  );
  const clear = active && (
    <Button size="sm" variant="ghost" onClick={() => onChange(NO_FILTERS)}>
      Clear filters
    </Button>
  );
  const tagChips = filters.tags.map((tag) => (
    <li key={tag}>
      <Chip size="sm" selected onRemove={() => toggleTag(tag)} removeLabel={`Stop filtering by ${tag}`}>
        #{tag}
      </Chip>
    </li>
  ));

  // ── 1 · Search and a Filters menu ───────
  if (layout === "menu") {
    const picked = [
      ...pickers
        .filter((p) => p.value !== ANY)
        .map((p) => ({ key: p.key, label: `${p.label}: ${p.value}`, remove: () => set({ [p.key]: ANY }) })),
      ...(filters.changed ? [{ key: "changed", label: "Has changes", remove: () => set({ changed: false }) }] : []),
      ...(filters.flagged ? [{ key: "flagged", label: "Needs attention", remove: () => set({ flagged: false }) }] : []),
    ];
    return (
      <div className="filters">
        <div className="filters-line">
          {search}
          <Popover
            align="end"
            className="filters-menu"
            title="Filters"
            trigger={
              <Button size="sm" icon={<Icon icon={SlidersIcon} />}>
                Filters
                <CountBubble count={inMenu} tone="accent" />
              </Button>
            }
          >
            <Field label="Tags">{tagPicker}</Field>
            {pickers.map((p, i) => (
              <Field key={p.key} label={p.label}>
                {selects[i]}
              </Field>
            ))}
            <div className="filters-menu-checks">{checkboxes}</div>
          </Popover>
          {count}
        </div>
        <div className="filters-line">{kindChips}</div>
        {(picked.length > 0 || filters.tags.length > 0) && (
          <ul className="chips" aria-label="Filters in use">
            {picked.map((p) => (
              <li key={p.key}>
                <Chip size="sm" selected onRemove={p.remove} removeLabel={`Remove ${p.label}`}>
                  {p.label}
                </Chip>
              </li>
            ))}
            {tagChips}
            <li>{clear}</li>
          </ul>
        )}
      </div>
    );
  }

  // ── 2 · Kinds first, compact filters ────
  if (layout === "kinds") {
    return (
      <div className="filters">
        <div className="filters-line">
          {kindChips}
          <div className="filters-end">
            <Chip selected={filters.changed} onClick={() => set({ changed: !filters.changed })}>
              Has changes
            </Chip>
            <Chip selected={filters.flagged} onClick={() => set({ flagged: !filters.flagged })}>
              Needs attention
            </Chip>
            {count}
            {clear}
          </div>
        </div>
        <div className="filters-line">
          {search}
          {tagPicker}
          {selects}
        </div>
        {filters.tags.length > 0 && (
          <ul className="chips" aria-label="Picked tags">
            {tagChips}
          </ul>
        )}
      </div>
    );
  }

  // ── 3 · Kinds in a side rail (KindRail), the rest on one line ──
  return (
    <div className="filters">
      <div className="filters-line">
        {search}
        {tagPicker}
        {selects}
      </div>
      <div className="filters-line">
        {checkboxes}
        <div className="filters-end">
          {count}
          {clear}
        </div>
      </div>
      {filters.tags.length > 0 && (
        <ul className="chips" aria-label="Picked tags">
          {tagChips}
        </ul>
      )}
    </div>
  );
}
