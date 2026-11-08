// TagPicker: the Tags dropdown in the filter bar: a search box and a checkbox per tag in use, with its count.

import { useEffect, useId, useRef, useState } from "react";

interface Props {
  /** Every tag in use and how many projects have it, most used first. */
  tags: [tag: string, count: number][];
  selected: string[];
  onToggle: (tag: string) => void;
}

/** A button that opens the tag list; closes on Escape or a click outside. */
export function TagPicker({ tags, selected, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const panel = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = tags.filter(([tag]) => tag.includes(search.trim().toLowerCase()));

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen(!open)}
        className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm ${selected.length > 0 ? "border-sky-700 bg-sky-950/40 text-sky-200" : "border-zinc-700 bg-zinc-900 text-zinc-300"} hover:border-zinc-500`}
      >
        Tags{selected.length > 0 && ` · ${selected.length}`}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M2 3.5 5 6.5 8 3.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          id={panel}
          className="absolute top-full right-0 z-20 mt-1 w-64 rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-black/50 shadow-lg"
        >
          <input
            type="search"
            aria-label="Find a tag"
            placeholder="Find a tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // biome-ignore lint/a11y/noAutofocus: the panel opens to type a tag; focus follows the click that opened it.
            autoFocus
            className="mb-2 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm placeholder:text-zinc-500"
          />
          <fieldset className="max-h-64 overflow-y-auto">
            <legend className="sr-only">Show projects with every checked tag</legend>
            {shown.map(([tag, count]) => (
              <label
                key={tag}
                className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(tag)}
                  onChange={() => onToggle(tag)}
                  className="accent-sky-400"
                />
                <span className="flex-1 truncate">{tag}</span>
                <span className="text-xs text-zinc-500">{count}</span>
              </label>
            ))}
            {shown.length === 0 && <p className="px-1.5 py-1 text-sm text-zinc-500">No tag matches.</p>}
          </fieldset>
        </div>
      )}
    </div>
  );
}
