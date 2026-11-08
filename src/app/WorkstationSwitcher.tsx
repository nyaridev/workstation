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

const action = "h-7 rounded-md px-2.5 text-xs hover:bg-zinc-800";

/** The title bar's controls for switching workstations. */
export function WorkstationSwitcher({ listing, current, onOpen, onAdd, onSetup, onRemove }: Props) {
  const confirmRemove = () => {
    const question = `Remove "${current.name}" from the list?\nIts folder and files stay as they are.`;
    if (window.confirm(question)) onRemove(current.root);
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      <label htmlFor="workstation" className="sr-only">
        Workstation
      </label>
      <select
        id="workstation"
        value={current.root}
        onChange={(e) => onOpen(e.target.value)}
        className="mr-1 h-7 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm"
      >
        {listing.workstations.map((w) => (
          <option key={w.root} value={w.root}>
            {w.available ? w.name : `${w.name} (not found)`}
          </option>
        ))}
      </select>
      <button type="button" onClick={onAdd} className={`${action} text-zinc-300`}>
        Add…
      </button>
      <button type="button" onClick={onSetup} className={`${action} text-zinc-300`}>
        Set up new…
      </button>
      <button type="button" onClick={confirmRemove} className={`${action} text-zinc-500 hover:text-zinc-200`}>
        Remove from list
      </button>
    </div>
  );
}
