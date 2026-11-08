// TagInput: edits a list of tags as chips; Enter or a comma adds the typed tag, suggestions come from tags in use.

import { useId, useState } from "react";
import { toTag } from "./fields";

interface Props {
  label: string;
  tags: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

/** A chip list plus a text box with suggestions. */
export function TagInput({ label, tags, suggestions, onChange }: Props) {
  const id = useId();
  const [text, setText] = useState("");

  const add = (raw: string) => {
    const tag = toTag(raw);
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setText("");
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-zinc-400">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-zinc-700 py-0.5 pr-1 pl-2.5 text-xs">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="rounded-full px-1 text-zinc-400 hover:text-zinc-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          list={`${id}-suggestions`}
          value={text}
          placeholder={tags.length === 0 ? "Type a tag, then Enter" : ""}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && text === "" && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => text && add(text)}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
        />
        <datalist id={`${id}-suggestions`}>
          {suggestions
            .filter((tag) => !tags.includes(tag))
            .map((tag) => (
              <option key={tag} value={tag} />
            ))}
        </datalist>
      </div>
    </div>
  );
}
