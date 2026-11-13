// SettingsProvider: the settings Rust keeps, shared by the backdrop and the Settings view, so a switch applies at once.

import { toast } from "iro-ui";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { getSettings, setLook, setPreferences } from "../lib/backend";
import type { Look, Preferences, Settings } from "../lib/types";

// ── Types ─────────────────────────────────
interface SettingsState {
  /** `null` until Rust answers. */
  settings: Settings | null;
  saveLook: (look: Look) => void;
  savePreferences: (preferences: Preferences) => void;
}

// ── State ─────────────────────────────────
const SettingsContext = createContext<SettingsState | null>(null);

// ── Public API ────────────────────────────
/** Loads the settings once and shares them with everything inside. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => void getSettings().then(setSettings), []);

  const save = (saving: Promise<Settings>) =>
    void saving.then(setSettings, (error) =>
      toast({ tone: "error", title: "Couldn't save the settings", description: String(error) }),
    );
  const saveLook = (look: Look) => save(setLook(look));
  const savePreferences = (preferences: Preferences) => save(setPreferences(preferences));

  return <SettingsContext value={{ settings, saveLook, savePreferences }}>{children}</SettingsContext>;
}

/** The settings and ways to save the look and the preferences. Only inside `SettingsProvider`. */
export function useSettings(): SettingsState {
  const state = useContext(SettingsContext);
  if (!state) throw new Error("useSettings needs a SettingsProvider above it");
  return state;
}
