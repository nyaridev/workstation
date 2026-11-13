// Tag edit mode: which of the three trial ways to edit a project's tags the rows use, picked from the dev-only
// floating picker. shortcut: a temporary comparison; once the owner picks one, delete this file, TagEditModePicker and
// the other two editors.

import { useSyncExternalStore } from "react";

// ── Types ─────────────────────────────────
/** `popover`: from the tag icon, saves each change; `inline`: a tags column edited in place; `dialog`: every tag. */
export type TagEditMode = "popover" | "inline" | "dialog";

// ── Constants ─────────────────────────────
const KEY = "workstation.tagEditMode";
const MODES: TagEditMode[] = ["popover", "inline", "dialog"];

// ── Private helpers ───────────────────────
function saved(): TagEditMode {
  try {
    const value = localStorage.getItem(KEY) as TagEditMode | null;
    return value && MODES.includes(value) ? value : "popover";
  } catch {
    return "popover";
  }
}

// ── State ─────────────────────────────────
let current = saved();
const listeners = new Set<() => void>();

// ── Public API ────────────────────────────
/** The mode in use; re-renders when the picker changes it. */
export function useTagEditMode(): TagEditMode {
  return useSyncExternalStore(
    (change) => {
      listeners.add(change);
      return () => void listeners.delete(change);
    },
    () => current,
  );
}

/** Switches the mode and remembers it in this browser when it can. */
export function setTagEditMode(mode: TagEditMode) {
  current = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // Not remembered; it still applies until a reload.
  }
  for (const change of listeners) change();
}
