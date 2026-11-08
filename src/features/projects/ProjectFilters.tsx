// ProjectFilters: the bar above the list: search, the tag dropdown, status, owner and stack pickers, the kind tabs,
// the "has changes" and "needs attention" switches, and the picked tags as removable chips.

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

const picker = (on: boolean) =>
  `h-8 rounded-md border px-2 text-sm ${on ? "border-sky-700 bg-sky-950/40 text-sky-200" : "border-zinc-700 bg-zinc-900 text-zinc-300"}`;

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
  const tabs = [{ label: ANY, count: groups.reduce((sum, g) => sum + g.count, 0) }, ...groups];

  return (
    <div className="space-y-2.5 border-zinc-800 border-b px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Search projects"
          placeholder="Search name, description, path, stack, notes…"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          className="h-8 min-w-56 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm placeholder:text-zinc-500"
        />
        <TagPicker tags={tags} selected={filters.tags} onToggle={toggleTag} />
        {pickers.map((p) => (
          <select
            key={p.key}
            aria-label={p.label}
            value={p.value}
            onChange={(e) => set({ [p.key]: e.target.value })}
            className={picker(p.value !== ANY)}
          >
            <option value={ANY}>{p.any}</option>
            {p.values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">Kind</legend>
          {tabs.map((tab) => {
            const on = filters.group === tab.label;
            return (
              <button
                key={tab.label}
                type="button"
                aria-pressed={on}
                onClick={() => set({ group: tab.label })}
                className={`rounded-full px-2.5 py-0.5 text-xs ${on ? "bg-zinc-200 text-zinc-900" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
              >
                {tab.label || "All"} <span className={on ? "text-zinc-600" : "text-zinc-500"}>{tab.count}</span>
              </button>
            );
          })}
        </fieldset>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <label className="flex items-center gap-1.5 text-zinc-300">
            <input
              type="checkbox"
              checked={filters.changed}
              onChange={(e) => set({ changed: e.target.checked })}
              className="accent-sky-400"
            />
            Has changes
          </label>
          <label className="flex items-center gap-1.5 text-zinc-300">
            <input
              type="checkbox"
              checked={filters.flagged}
              onChange={(e) => set({ flagged: e.target.checked })}
              className="accent-sky-400"
            />
            Needs attention
          </label>
          <span className="text-zinc-500" aria-live="polite">
            {shown === total ? `${total} projects` : `${shown} of ${total}`}
          </span>
          {active && (
            <button
              type="button"
              onClick={() => onChange(NO_FILTERS)}
              className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      {filters.tags.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Picked tags">
          {filters.tags.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                aria-label={`Stop filtering by ${tag}`}
                onClick={() => toggleTag(tag)}
                className="flex items-center gap-1 rounded-full bg-sky-950/60 py-0.5 pr-1.5 pl-2.5 text-sky-200 text-xs hover:bg-sky-900/60"
              >
                #{tag}
                <svg width="8" height="8" viewBox="0 0 8 8" stroke="currentColor" aria-hidden="true">
                  <path d="M1 1l6 6M7 1 1 7" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
