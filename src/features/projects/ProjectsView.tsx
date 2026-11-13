// ProjectsView: the open workstation's project list, or why it can't be shown.

import { EmptyState } from "iro-ui";
import type { ViewProps } from "../../app/views";
import { ProjectList } from "./ProjectList";

/** The project list of the open workstation. */
export function ProjectsView({ workstation }: ViewProps) {
  if (!workstation.available) {
    return (
      <div className="center">
        <EmptyState tone="warning" title={`${workstation.root} wasn't found, or it has no projects.json any more.`}>
          Plug the drive back in, or remove it from the list.
        </EmptyState>
      </div>
    );
  }
  // The key resets the filters when switching workstations.
  return <ProjectList key={workstation.root} root={workstation.root} />;
}
