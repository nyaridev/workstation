// Milestones: where a project stands in its plan, for its row and the milestones panel.

import type { Milestone } from "../../lib/types";

/** The plan's progress: the milestone being worked on (the first not done), its place, and how many are done. */
export interface Progress {
  current: Milestone;
  /** From 0. */
  index: number;
  done: number;
  total: number;
}

/** Where the plan stands, or null when there's no plan or every milestone is done. */
export function progressOf(milestones: Milestone[]): Progress | null {
  const index = milestones.findIndex((m) => !m.done);
  const current = milestones[index];
  if (!current) return null;
  return { current, index, done: milestones.filter((m) => m.done).length, total: milestones.length };
}
