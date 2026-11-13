// SettingsView: the look (the liquid background, the system title bar) and which build is running.

import { Icon, PropertyList, SectionTitle, Switch } from "iro-ui";
import { InfoIcon, PaletteIcon } from "iro-ui/icons";
import { useEffect, useState } from "react";
import { useSettings } from "../../app/SettingsProvider";
import { appInfo } from "../../lib/backend";
import type { AppInfo } from "../../lib/types";
import "./settings.css";

/** Settings. */
export function SettingsView() {
  const { settings, saveLook } = useSettings();
  const [info, setInfo] = useState<AppInfo | null>(null);
  useEffect(() => void appInfo().then(setInfo), []);
  const look = settings?.look;

  return (
    <div className="settings">
      <section className="settings-section">
        <SectionTitle icon={<Icon icon={PaletteIcon} />}>Look</SectionTitle>
        <Switch
          label="Liquid background"
          checked={look?.liquidBackground ?? false}
          disabled={!look}
          onCheckedChange={(on) => look && saveLook({ ...look, liquidBackground: on })}
        />
        <div className="settings-row">
          <Switch
            label="Use the system title bar"
            checked={look?.nativeFrame ?? false}
            disabled={!look}
            onCheckedChange={(on) => look && saveLook({ ...look, nativeFrame: on })}
          />
          <p className="settings-hint">Applies after a restart.</p>
        </div>
      </section>

      <section className="settings-section">
        <SectionTitle icon={<Icon icon={InfoIcon} />}>About</SectionTitle>
        <PropertyList properties={[{ label: "Version", value: info?.version, mono: true }]} />
      </section>
    </div>
  );
}
