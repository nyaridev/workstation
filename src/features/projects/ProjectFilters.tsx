// ProjectFilters: the search box, the status picker, the "has changes" switch and the tag chips above the list.

import { ANY_STATUS, type Filters, NO_FILTERS } from "./filter";

interface Props {
  filters: Filters;
  tags: string[];
  statuses: string[];
  shown: number;
  total: number;
  onChange: (filters: Filters) => void;
}

/** Filter controls; tags toggle on click, and a project must have every selected tag. */
export function ProjectFilters({ filters, tags, statuses, shown, total, onChange }: Props) {
  const toggleTag = (tag: string) => {
    const selected = filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag];
    onChange({ ...filters, tags: selected });
  };
  const active = filters.query !== "" || filters.tags.length > 0 || filters.status !== ANY_STATUS || filters.changed;

  return (
    <div className="space-y-3 border-zinc-800 border-b px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          aria-label="Search projects"
          placeholder="Search name, description, path, stack, notes…"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          className="min-w-64 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm placeholder:text-zinc-500"
        />
        <select
          aria-label="Status"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
        >
          <option value={ANY_STATUS}>Any status</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={filters.changed}
            onChange={(e) => onChange({ ...filters, changed: e.target.checked })}
            className="accent-zinc-300"
          />
          Has changes
        </label>
        <span className="text-sm text-zinc-500" aria-live="polite">
          {shown === total ? `${total} projects` : `${shown} of ${total}`}
        </span>
        {active && (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="text-sm text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {tags.map((tag) => {
            const on = filters.tags.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-2.5 py-0.5 text-xs ${on ? "bg-zinc-200 text-zinc-900" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                >
                  {tag}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
