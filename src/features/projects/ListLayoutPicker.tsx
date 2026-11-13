// ListLayoutPicker: a floating, dev-only switch between the trial list layouts (`listLayout.ts`).
// shortcut: temporary; delete it with the layouts that lose.

import { Panel, Segmented } from "iro-ui";
import { type ListLayout, setListLayout, useListLayout } from "./listLayout";

// ── Constants ─────────────────────────────
const OPTIONS: { value: ListLayout; label: string }[] = [
  { value: "cards", label: "1 · Cards" },
  { value: "compact", label: "2 · Compact" },
  { value: "tiles", label: "3 · Tiles" },
  { value: "table", label: "4 · Table" },
];

// ── Public API ────────────────────────────
/** The picker, in the window's bottom-right corner. */
export function ListLayoutPicker() {
  const layout = useListLayout();
  return (
    <Panel className="dev-layout-picker" padded={false}>
      <span className="dev-layout-label">List layout (dev)</span>
      <Segmented size="sm" aria-label="List layout" options={OPTIONS} value={layout} onValueChange={setListLayout} />
    </Panel>
  );
}
