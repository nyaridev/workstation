// TagEditModePicker: a floating, dev-only switch between the three trial tag editors (`tagEditMode.ts`).
// shortcut: temporary; delete it with the editors that lose.

import { Panel, Segmented } from "iro-ui";
import { setTagEditMode, type TagEditMode, useTagEditMode } from "./tagEditMode";

// ── Constants ─────────────────────────────
const OPTIONS: { value: TagEditMode; label: string }[] = [
  { value: "popover", label: "1 · Popover" },
  { value: "inline", label: "2 · In place" },
  { value: "dialog", label: "3 · Dialog" },
];

// ── Public API ────────────────────────────
/** The picker, in the window's bottom-right corner. */
export function TagEditModePicker() {
  const mode = useTagEditMode();
  return (
    <Panel className="dev-layout-picker" padded={false}>
      <span className="dev-layout-label">Tag editing (dev)</span>
      <Segmented size="sm" aria-label="Tag editing" options={OPTIONS} value={mode} onValueChange={setTagEditMode} />
    </Panel>
  );
}
