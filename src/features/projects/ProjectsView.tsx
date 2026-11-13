// ProjectsView: the open workstation's project list, or why it can't be shown.

import { EmptyState } from "iro-ui";
import { useSettings } from "../../app/SettingsProvider";
import type { ViewProps } from "../../app/views";
import { ProjectList } from "./ProjectList";

/** The project list of the open workstation. */
export function ProjectsView({ workstation }: ViewProps) {
  const { settings } = useSettings();
  if (!workstation.available) {
    return (
      <div className="center">
        <EmptyState tone="warning" title={`${workstation.root} wasn't found, or it has no .workstation file any more.`}>
          Plug the drive back in, or remove it from the list.
        </EmptyState>
      </div>
    );
  }
  // The list starts from its saved filters, so it waits the moment the settings take to load.
  if (!settings) return null;
  // The key starts the list over, from that workstation's own filters, when switching.
  return <ProjectList key={workstation.root} root={workstation.root} saved={settings.filters[workstation.root]} />;
}
