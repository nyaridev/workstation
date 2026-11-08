// WorkstationSwitcher: picks the open workstation, adds or sets up one, or removes the open one from the list.

import type { Listing, Workstation } from "../lib/types";

interface Props {
  listing: Listing;
  current: Workstation;
  onOpen: (root: string) => void;
  onAdd: () => void;
  onSetup: () => void;
  onRemove: (root: string) => void;
}

/** The header controls for switching workstations. */
export function WorkstationSwitcher({ listing, current, onOpen, onAdd, onSetup, onRemove }: Props) {
  const confirmRemove = () => {
    const question = `Remove "${current.name}" from the list?\nIts folder and files stay as they are.`;
    if (window.confirm(question)) onRemove(current.root);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="workstation" className="text-sm text-zinc-400">
        Workstation
      </label>
      <select
        id="workstation"
        value={current.root}
        onChange={(e) => onOpen(e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
      >
        {listing.workstations.map((w) => (
          <option key={w.root} value={w.root}>
            {w.available ? w.name : `${w.name} (not found)`}
          </option>
        ))}
      </select>
      <button type="button" onClick={onAdd} className="rounded-md bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700">
        Add…
      </button>
      <button type="button" onClick={onSetup} className="rounded-md bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700">
        Set up new…
      </button>
      <button
        type="button"
        onClick={confirmRemove}
        className="rounded-md px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        Remove from list
      </button>
    </div>
  );
}
