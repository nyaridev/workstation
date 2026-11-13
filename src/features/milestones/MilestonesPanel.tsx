// MilestonesPanel: a project's plans in a side sheet, from its `milestones` in projects.json. A project with several
// tracks gets a tab for each. A plan shows what's being worked on with its progress, then every milestone in order:
// done ones checked, the current one flagged, the rest numbered. Reads only.

import { Badge, Icon, ListItem, Panel, ProgressBar, SectionTitle, Sheet, Tabs } from "iro-ui";
import { CheckCircleIcon, FlagIcon } from "iro-ui/icons";
import { useState } from "react";
import { useSettings } from "../../app/SettingsProvider";
import type { Project } from "../../lib/types";
import { type Track, tracksOf } from "../projects/milestones";
import "./milestones.css";

interface Props {
  project: Project;
  /** The track to show first (the row line that was clicked); otherwise the first still in progress. */
  track: string | null;
  onClose: () => void;
}

// A tab value for a track; the unnamed plan of a single-plan project never has tabs.
const keyOf = (track: Track) => track.name ?? "";

// One plan: where it stands, then its milestones.
function Plan({ track }: { track: Track }) {
  const { milestones, progress } = track;
  const done = milestones.filter((m) => m.done).length;
  return (
    <div className="plan">
      <Panel className="plan-now">
        <span className="plan-label">{progress ? "Working on" : "Finished"}</span>
        <span className="plan-current">{progress ? progress.current.name : "Every milestone is done"}</span>
        {progress?.current.description && <span className="plan-description">{progress.current.description}</span>}
        <span className="plan-progress">
          <ProgressBar
            size="sm"
            tone={progress ? "accent" : "success"}
            value={done / milestones.length}
            label={`${track.name ?? "Milestones"} done`}
          />
          <span className="plan-count">
            {done} of {milestones.length} done
          </span>
        </span>
      </Panel>
      <section aria-labelledby="plan-steps">
        <SectionTitle id="plan-steps">Milestones</SectionTitle>
        <ol className="plan-steps">
          {milestones.map((m, i) => {
            const state = m.done ? "done" : i === progress?.index ? "current" : "waiting";
            return (
              <ListItem
                // biome-ignore lint/suspicious/noArrayIndexKey: two milestones may share a name; their place is theirs
                key={i}
                as="li"
                data-state={state}
                start={
                  state === "done" ? (
                    <Icon icon={CheckCircleIcon} />
                  ) : state === "current" ? (
                    <Icon icon={FlagIcon} />
                  ) : (
                    <span className="plan-number">{i + 1}</span>
                  )
                }
                title={m.name}
                description={m.description}
                wrap
                meta={state === "current" && <Badge tone="accent">now</Badge>}
              />
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/** Opens from the right; Escape, the close button or a click beside it closes it. */
export function MilestonesPanel({ project, track, onClose }: Props) {
  const { settings, savePanelWidth } = useSettings();
  const tracks = tracksOf(project.milestones);
  const first = tracks.find((t) => t.name === track) ?? tracks.find((t) => t.progress) ?? tracks[0];
  const [tab, setTab] = useState(first ? keyOf(first) : "");

  return (
    <Sheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={project.name}
      closeLabel="Close the milestones"
      resizable
      defaultWidth={settings?.panelWidths.milestones}
      onWidthChange={(width) => savePanelWidth("milestones", width)}
      className="milestones"
    >
      {tracks.length > 1 ? (
        <Tabs
          aria-label="Plans"
          value={tab}
          onValueChange={setTab}
          tabs={tracks.map((t) => ({
            value: keyOf(t),
            label: t.name ?? "Other",
            badge: (
              <span className="plan-tab-count">
                {t.milestones.filter((m) => m.done).length}/{t.milestones.length}
              </span>
            ),
            content: <Plan track={t} />,
          }))}
        />
      ) : (
        first && <Plan track={first} />
      )}
    </Sheet>
  );
}
