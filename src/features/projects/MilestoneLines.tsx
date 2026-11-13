// MilestoneLines: a project row's second lines, one per plan still in progress: the milestone being worked on, a bar
// and "N of M done", on the row's own columns. Each line is one quiet button that opens that plan's milestones.

import { Button, Icon, ProgressBar } from "iro-ui";
import { FlagIcon } from "iro-ui/icons";
import type { Milestone } from "../../lib/types";
import { tracksOf } from "./milestones";

interface Props {
  milestones: Milestone[];
  /** Opens the milestones panel on this plan's tab. */
  onOpen: (track: string | null) => void;
}

/** The lines, or nothing once every plan is done (the row is one line then). */
export function MilestoneLines({ milestones, onOpen }: Props) {
  const working = tracksOf(milestones).flatMap(({ name, progress }) => (progress ? [{ name, progress }] : []));
  if (working.length === 0) return null;
  return (
    <span className="row-milestones">
      {working.map(({ name: track, progress }) => (
        <Button
          key={track ?? ""}
          size="sm"
          variant="ghost"
          className="row-milestone"
          aria-label={`${track ?? "Milestones"}: ${progress.current.name}, ${progress.done} of ${progress.total} done`}
          onClick={() => onOpen(track)}
        >
          <span className="row-milestone-name">
            <Icon icon={FlagIcon} />
            <span className="row-milestone-text">
              {track && <span className="row-milestone-track">{track} · </span>}
              {progress.current.name}
            </span>
          </span>
          <ProgressBar size="sm" value={progress.done / progress.total} className="row-milestone-bar" />
          <span className="row-milestone-count">
            {progress.done} of {progress.total} done
          </span>
        </Button>
      ))}
    </span>
  );
}
