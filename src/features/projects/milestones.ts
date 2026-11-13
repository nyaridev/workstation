// Milestones: where a project stands in its plans, for its row and the milestones panel. A project has one plan, or
// several tracks of milestones ("Server", "Rewrite") named by each milestone's `track`.

import type { Milestone } from "../../lib/types";

/** A plan's progress: the milestone being worked on (the first not done), its place, and how many are done. */
export interface Progress {
  current: Milestone;
  /** From 0. */
  index: number;
  done: number;
  total: number;
}

/** One plan of a project: its milestones in order and where it stands. */
export interface Track {
  /** Null for a project's single, unnamed plan. */
  name: string | null;
  milestones: Milestone[];
  /** Null once every milestone is done. */
  progress: Progress | null;
}

/** Where a plan stands, or null when there's no plan or every milestone is done. */
export function progressOf(milestones: Milestone[]): Progress | null {
  const index = milestones.findIndex((m) => !m.done);
  const current = milestones[index];
  if (!current) return null;
  return { current, index, done: milestones.filter((m) => m.done).length, total: milestones.length };
}

/** The project's milestones split by track, in the order each track first shows up. */
export function tracksOf(milestones: Milestone[]): Track[] {
  const byName = new Map<string | null, Milestone[]>();
  for (const m of milestones) byName.set(m.track, [...(byName.get(m.track) ?? []), m]);
  return [...byName].map(([name, list]) => ({ name, milestones: list, progress: progressOf(list) }));
}
