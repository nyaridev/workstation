// AboutSettings: which build is running and on which system, its own updates from GitHub (the status, Check now,
// Update and restart: ADR-0014), and how it behaves: checking for updates, starting with the system and closing to the
// tray (ADR-0015).

import { Button, Icon, Panel, ProgressBar, PropertyList, SectionTitle, Switch } from "iro-ui";
import { ArrowUpCircleIcon, InfoIcon, RefreshIcon } from "iro-ui/icons";
import { useEffect, useState } from "react";
import { useSettings } from "../../app/SettingsProvider";
import { useUpdate } from "../../app/useUpdate";
import { appInfo, checkForUpdate, installUpdate } from "../../lib/backend";
import type { AppInfo, Preferences, UpdateStatus } from "../../lib/types";
import { ago } from "../history/format";

// ── Private helpers ───────────────────────
/** One line on where updates stand. */
function updateLine(status: UpdateStatus): string {
  if (!status.canUpdate) return "Development builds don't update.";
  if (status.step === "checking") return "Checking for updates";
  if (status.step === "downloading") return `Downloading Workstation ${status.latest ?? ""}`;
  if (status.step === "installing") return "Installing; Workstation restarts";
  if (status.error) return status.error;
  if (status.latest) return `Workstation ${status.latest} is out.`;
  return status.checkedAt
    ? `Up to date. Checked ${ago(new Date(status.checkedAt * 1000).toISOString())}.`
    : "Not checked yet.";
}

// ── Public API ────────────────────────────
/** The About section of Settings. */
export function AboutSettings() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const { settings, savePreferences } = useSettings();
  const status = useUpdate();
  const [installError, setInstallError] = useState<string | null>(null);
  useEffect(() => void appInfo().then(setInfo), []);
  const preferences = settings?.preferences;
  const busy = status?.step != null;
  const failed = Boolean(status?.error || installError);
  const startLabel = info?.os === "windows" ? "Start with Windows" : "Open at login";
  const trayLabel = info?.os === "macos" ? "Close to the menu bar" : "Close to tray";
  const toTray = preferences?.closeToTray ?? false;

  /** Saves one switch; a start entry the system refuses comes back as the save's error toast. */
  const save = (change: Partial<Preferences>) => preferences && savePreferences({ ...preferences, ...change });

  async function install() {
    setInstallError(null);
    await installUpdate().catch((error) => setInstallError(String(error)));
  }

  return (
    <Panel as="section" className="settings-section">
      <SectionTitle icon={<Icon icon={InfoIcon} />}>About</SectionTitle>
      <PropertyList
        properties={[
          { label: "Version", value: status?.current ?? info?.version, mono: true },
          { label: "System", value: info?.os },
        ]}
      />
      {status && (
        <div className="settings-update">
          <span
            className={failed ? "settings-update-line selectable" : "settings-update-line"}
            data-tone={failed ? "danger" : undefined}
          >
            {installError ?? updateLine(status)}
          </span>
          {status.step === "downloading" && <ProgressBar value={status.progress} label="Downloading the update" />}
          {status.canUpdate && (
            <div className="settings-update-actions">
              <Button
                size="sm"
                icon={<Icon icon={RefreshIcon} />}
                loading={status.step === "checking"}
                disabled={busy}
                onClick={() => void checkForUpdate()}
              >
                Check now
              </Button>
              {status.latest && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Icon icon={ArrowUpCircleIcon} />}
                  loading={status.step === "downloading" || status.step === "installing"}
                  disabled={busy}
                  onClick={() => void install()}
                >
                  Update and restart
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="settings-switches">
        <Switch
          label="Check for updates"
          checked={preferences?.checkForUpdates ?? false}
          disabled={!preferences}
          onCheckedChange={(checkForUpdates) => save({ checkForUpdates })}
        />
        <Switch
          label={startLabel}
          checked={preferences?.startWithSystem ?? false}
          disabled={!preferences}
          onCheckedChange={(startWithSystem) => save({ startWithSystem })}
        />
        <Switch
          label={trayLabel}
          checked={toTray}
          disabled={!preferences}
          onCheckedChange={(closeToTray) => save({ closeToTray })}
        />
      </div>
      <p className="settings-hint">
        Checks at start and every 6 hours. {startLabel} opens Workstation {toTray ? "in the tray" : "minimized"}.
        {toTray && " Quit from the tray icon's menu."}
      </p>
    </Panel>
  );
}
