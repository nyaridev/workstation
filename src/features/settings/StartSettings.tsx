// StartSettings: starting with the system and closing to the tray (ADR-0015). A start entry the system refuses comes
// back as the save's error, so the switch stays as it was.

import { Icon, Panel, SectionTitle, Switch } from "iro-ui";
import { PowerIcon } from "iro-ui/icons";
import { useEffect, useState } from "react";
import { useSettings } from "../../app/SettingsProvider";
import { appInfo } from "../../lib/backend";
import type { Preferences } from "../../lib/types";

// ── Public API ────────────────────────────
/** The Start section of Settings. */
export function StartSettings() {
  const { settings, savePreferences } = useSettings();
  const [os, setOs] = useState<string | null>(null);
  useEffect(() => void appInfo().then((info) => setOs(info.os)), []);
  const preferences = settings?.preferences;
  const startLabel = os === "windows" ? "Start with Windows" : "Open at login";
  const trayLabel = os === "macos" ? "Close to the menu bar" : "Close to tray";
  const toTray = preferences?.closeToTray ?? false;

  const save = (change: Partial<Preferences>) => preferences && savePreferences({ ...preferences, ...change });

  return (
    <Panel as="section" className="settings-section">
      <SectionTitle icon={<Icon icon={PowerIcon} />}>Start</SectionTitle>
      <Switch
        label={startLabel}
        checked={preferences?.startWithSystem ?? false}
        disabled={!preferences}
        onCheckedChange={(startWithSystem) => save({ startWithSystem })}
      />
      <div className="settings-row">
        <Switch
          label={trayLabel}
          checked={toTray}
          disabled={!preferences}
          onCheckedChange={(closeToTray) => save({ closeToTray })}
        />
        <p className="settings-hint">
          {startLabel} opens Workstation {toTray ? "in the tray" : "minimized"}.
          {toTray && " Quit from the tray icon's menu."}
        </p>
      </div>
    </Panel>
  );
}
