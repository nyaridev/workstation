// AboutSettings: which build is running, and its own updates from GitHub (the status, Check now, Update and restart,
// and whether it checks on its own: ADR-0014).

import { Button, Icon, Panel, ProgressBar, PropertyList, SectionTitle, Switch } from "iro-ui";
import { ArrowUpCircleIcon, InfoIcon, RefreshIcon } from "iro-ui/icons";
import { useState } from "react";
import { useSettings } from "../../app/SettingsProvider";
import { useUpdate } from "../../app/useUpdate";
import { checkForUpdate, installUpdate } from "../../lib/backend";
import type { UpdateStatus } from "../../lib/types";
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
  const { settings, savePreferences } = useSettings();
  const status = useUpdate();
  const [installError, setInstallError] = useState<string | null>(null);
  const preferences = settings?.preferences;
  const busy = status?.step != null;
  const failed = Boolean(status?.error || installError);

  async function install() {
    setInstallError(null);
    await installUpdate().catch((error) => setInstallError(String(error)));
  }

  return (
    <Panel as="section" className="settings-section">
      <SectionTitle icon={<Icon icon={InfoIcon} />}>About</SectionTitle>
      <PropertyList properties={[{ label: "Version", value: status?.current, mono: true }]} />
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
      <div className="settings-row">
        <Switch
          label="Check for updates"
          checked={preferences?.checkForUpdates ?? false}
          disabled={!preferences}
          onCheckedChange={(checkForUpdates) => preferences && savePreferences({ ...preferences, checkForUpdates })}
        />
        <p className="settings-hint">Checks at start and every 6 hours.</p>
      </div>
    </Panel>
  );
}
