// Filter layout: which of the three filter-bar layouts the list shows, picked from the dev-only floating picker.
// shortcut: a temporary comparison; once the owner picks one, delete this file, FilterLayoutPicker and the other two.

import { useSyncExternalStore } from "react";

// ── Types ─────────────────────────────────
/** `menu`: search and a Filters menu; `kinds`: kind chips first, compact filters; `rail`: kinds in a side column. */
export type FilterLayout = "menu" | "kinds" | "rail";

// ── Constants ─────────────────────────────
const KEY = "workstation.filterLayout";
const LAYOUTS: FilterLayout[] = ["menu", "kinds", "rail"];

// ── Private helpers ───────────────────────
function saved(): FilterLayout {
  try {
    const value = localStorage.getItem(KEY) as FilterLayout | null;
    return value && LAYOUTS.includes(value) ? value : "menu";
  } catch {
    return "menu";
  }
}

// ── State ─────────────────────────────────
let current = saved();
const listeners = new Set<() => void>();

// ── Public API ────────────────────────────
/** The layout in use; re-renders when the picker changes it. */
export function useFilterLayout(): FilterLayout {
  return useSyncExternalStore(
    (change) => {
      listeners.add(change);
      return () => void listeners.delete(change);
    },
    () => current,
  );
}

/** Switches the layout and remembers it in this browser when it can. */
export function setFilterLayout(layout: FilterLayout) {
  current = layout;
  try {
    localStorage.setItem(KEY, layout);
  } catch {
    // Not remembered; it still applies until a reload.
  }
  for (const change of listeners) change();
}
