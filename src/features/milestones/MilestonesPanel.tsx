// MilestonesPanel: a project's plan in a side sheet, from its `milestones` in projects.json: every milestone in
// order, the done ones checked and the one being worked on (the first not done) marked. Reads only.

import { ProgressBar, Sheet, Stepper } from "iro-ui";
import type { Project } from "../../lib/types";

interface Props {
  project: Project;
  onClose: () => void;
}

/** Opens from the right; Escape, the close button or a click beside it closes it. */
export function MilestonesPanel({ project, onClose }: Props) {
  const { milestones } = project;
  const done = milestones.filter((m) => m.done).length;
  // Stepper marks everything before `current` done; with every milestone done, that's past the end.
  const current = milestones.findIndex((m) => !m.done);

  return (
    <Sheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={project.name}
      closeLabel="Close the milestones"
      resizable
      className="milestones"
    >
      <div className="milestones-head">
        <ProgressBar value={milestones.length ? done / milestones.length : 0} label="Milestones done" />
        <span className="muted small">
          {done === milestones.length ? "Every milestone is done" : `${done} of ${milestones.length} done`}
        </span>
      </div>
      <Stepper
        orientation="vertical"
        steps={milestones.map((m) => ({ label: m.name }))}
        current={current < 0 ? milestones.length : current}
      />
    </Sheet>
  );
}
