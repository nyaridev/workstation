// SettingsProvider: the settings Rust keeps, shared by the backdrop and the Settings view, so a switch applies at once.

import { toast } from "iro-ui";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { getSettings, setFilters, setLook, setPanelWidth, setPreferences } from "../lib/backend";
import type { Look, Preferences, Settings } from "../lib/types";

// ── Types ─────────────────────────────────
interface SettingsState {
  /** `null` until Rust answers. */
  settings: Settings | null;
  saveLook: (look: Look) => void;
  savePreferences: (preferences: Preferences) => void;
  /** Saves a workstation's list filters; a failure only loses them for the next start, so it stays quiet. */
  saveFilters: (root: string, filters: unknown) => void;
  /** Saves a side panel's width (null: back to the default); like the filters, a failure stays quiet. */
  savePanelWidth: (panel: string, width: number | null) => void;
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
  const saveFilters = (root: string, filters: unknown) => {
    setSettings((old) => old && { ...old, filters: { ...old.filters, [root]: filters } });
    void setFilters(root, filters).catch(() => {});
  };
  const savePanelWidth = (panel: string, width: number | null) => {
    setSettings((old) => {
      if (!old) return old;
      const { [panel]: _old, ...rest } = old.panelWidths;
      return { ...old, panelWidths: width === null ? rest : { ...rest, [panel]: width } };
    });
    void setPanelWidth(panel, width).catch(() => {});
  };

  return (
    <SettingsContext value={{ settings, saveLook, savePreferences, saveFilters, savePanelWidth }}>
      {children}
    </SettingsContext>
  );
}

/** The settings and ways to save the look, the preferences and the list filters. Only inside `SettingsProvider`. */
export function useSettings(): SettingsState {
  const state = useContext(SettingsContext);
  if (!state) throw new Error("useSettings needs a SettingsProvider above it");
  return state;
}
