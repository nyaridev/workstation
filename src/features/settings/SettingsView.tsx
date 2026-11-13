// SettingsView: Settings in tabs (ADR-0013), each section a card: Workstations (the saved ones, opening, adding,
// setting up and removing them: ADR-0017) and App (the look, and About: the build, updates, starting and closing).

import { Icon, type TabItem, Tabs } from "iro-ui";
import { FoldersIcon, InfoIcon } from "iro-ui/icons";
import { useState } from "react";
import { AboutSettings } from "./AboutSettings";
import { LookSettings } from "./LookSettings";
import { WorkstationSettings } from "./WorkstationSettings";
import "./settings.css";

// ── Types ─────────────────────────────────
type Tab = "workstations" | "app";

// ── Constants ─────────────────────────────
/** Each tab and its sections. */
const TABS: TabItem<Tab>[] = [
  {
    value: "workstations",
    label: "Workstations",
    icon: <Icon icon={FoldersIcon} />,
    content: <WorkstationSettings />,
  },
  {
    value: "app",
    label: "App",
    icon: <Icon icon={InfoIcon} />,
    content: (
      <>
        <LookSettings />
        <AboutSettings />
      </>
    ),
  },
];

// ── Public API ────────────────────────────
/** Settings. */
export function SettingsView() {
  const [tab, setTab] = useState<Tab>("workstations");
  return (
    <div className="settings-page">
      <div className="settings">
        <Tabs aria-label="Settings" tabs={TABS} value={tab} onValueChange={setTab} />
      </div>
    </div>
  );
}
