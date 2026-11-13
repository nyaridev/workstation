// AboutSettings: which build is running. Updates join it in M15 (ADR-0014).

import { Icon, Panel, PropertyList, SectionTitle } from "iro-ui";
import { InfoIcon } from "iro-ui/icons";
import { useEffect, useState } from "react";
import { appInfo } from "../../lib/backend";
import type { AppInfo } from "../../lib/types";

// ── Public API ────────────────────────────
/** The About section of Settings. */
export function AboutSettings() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  useEffect(() => void appInfo().then(setInfo), []);

  return (
    <Panel as="section" className="settings-section">
      <SectionTitle icon={<Icon icon={InfoIcon} />}>About</SectionTitle>
      <PropertyList properties={[{ label: "Version", value: info?.version, mono: true }]} />
    </Panel>
  );
}
