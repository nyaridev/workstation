// List layout: which of the trial layouts the project list shows, picked from the dev-only floating picker.
// shortcut: a temporary comparison; once the owner picks one, delete this file, ListLayoutPicker and the others.

import { useSyncExternalStore } from "react";

// ── Types ─────────────────────────────────
/** `cards`: rows in a card per group; `compact`: one line per project; `tiles`: a grid; `table`: aligned columns. */
export type ListLayout = "cards" | "compact" | "tiles" | "table";

// ── Constants ─────────────────────────────
const KEY = "workstation.listLayout";
const LAYOUTS: ListLayout[] = ["cards", "compact", "tiles", "table"];

// ── Private helpers ───────────────────────
function saved(): ListLayout {
  try {
    const value = localStorage.getItem(KEY) as ListLayout | null;
    return value && LAYOUTS.includes(value) ? value : "cards";
  } catch {
    return "cards";
  }
}

// ── State ─────────────────────────────────
let current = saved();
const listeners = new Set<() => void>();

// ── Public API ────────────────────────────
/** The layout in use; re-renders when the picker changes it. */
export function useListLayout(): ListLayout {
  return useSyncExternalStore(
    (change) => {
      listeners.add(change);
      return () => void listeners.delete(change);
    },
    () => current,
  );
}

/** Switches the layout and remembers it in this browser when it can. */
export function setListLayout(layout: ListLayout) {
  current = layout;
  try {
    localStorage.setItem(KEY, layout);
  } catch {
    // Not remembered; it still applies until a reload.
  }
  for (const change of listeners) change();
}
