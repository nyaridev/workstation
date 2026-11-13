// WorkstationSwitcher: the header's dropdown that opens another saved workstation. Adding, setting up and removing
// workstations are in Settings (ADR-0012).

import { Select } from "iro-ui";
import type { Listing, Workstation } from "../lib/types";

interface Props {
  listing: Listing;
  current: Workstation;
  onOpen: (root: string) => void;
}

/** The open workstation, picked from the saved ones. */
export function WorkstationSwitcher({ listing, current, onOpen }: Props) {
  const options = listing.workstations.map((w) => ({
    value: w.root,
    label: w.available ? w.name : `${w.name} (not found)`,
  }));

  return (
    <Select
      aria-label="Workstation"
      size="sm"
      className="switcher-select"
      options={options}
      value={current.root}
      onValueChange={(root) => root && onOpen(root)}
    />
  );
}
