// WorkstationSwitcher: picks the open workstation, adds or sets up one, or removes the open one from the list.

import { AlertDialog, Button, Select } from "iro-ui";
import type { Listing, Workstation } from "../lib/types";

interface Props {
  listing: Listing;
  current: Workstation;
  onOpen: (root: string) => void;
  onAdd: () => void;
  onSetup: () => void;
  onRemove: (root: string) => void;
}

/** The title bar's controls for switching workstations. */
export function WorkstationSwitcher({ listing, current, onOpen, onAdd, onSetup, onRemove }: Props) {
  const options = listing.workstations.map((w) => ({
    value: w.root,
    label: w.available ? w.name : `${w.name} (not found)`,
  }));

  return (
    <div className="switcher">
      <Select
        aria-label="Workstation"
        size="sm"
        className="switcher-select"
        options={options}
        value={current.root}
        onValueChange={(root) => root && onOpen(root)}
      />
      <Button size="sm" variant="ghost" onClick={onAdd}>
        Add…
      </Button>
      <Button size="sm" variant="ghost" onClick={onSetup}>
        Set up new…
      </Button>
      <AlertDialog
        trigger={
          <Button size="sm" variant="ghost">
            Remove from list
          </Button>
        }
        title={`Remove "${current.name}" from the list?`}
        description="Its folder and files stay as they are."
        confirmLabel="Remove"
        onConfirm={() => onRemove(current.root)}
      />
    </div>
  );
}
