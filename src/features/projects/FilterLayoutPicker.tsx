// FilterLayoutPicker: a floating, dev-only switch between the three filter-bar layouts (`filterLayout.ts`).
// shortcut: temporary; delete it with the layouts that lose.

import { Panel, Segmented } from "iro-ui";
import { type FilterLayout, setFilterLayout, useFilterLayout } from "./filterLayout";

// ── Constants ─────────────────────────────
const OPTIONS: { value: FilterLayout; label: string }[] = [
  { value: "menu", label: "1 · Filters menu" },
  { value: "kinds", label: "2 · Kinds first" },
  { value: "rail", label: "3 · Side rail" },
];

// ── Public API ────────────────────────────
/** The picker, in the window's bottom-right corner. */
export function FilterLayoutPicker() {
  const layout = useFilterLayout();
  return (
    <Panel className="dev-layout-picker" padded={false}>
      <span className="dev-layout-label">Filter layout (dev)</span>
      <Segmented
        size="sm"
        aria-label="Filter layout"
        options={OPTIONS}
        value={layout}
        onValueChange={setFilterLayout}
      />
    </Panel>
  );
}
