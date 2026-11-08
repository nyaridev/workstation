// Filter: the pure logic behind the project list — search, tag and status filters, grouping and the tag list.

import type { GitStatus, GitStatuses, Project } from "../../lib/types";

// ── Constants ─────────────────────────────
/** Group headings in display order; archived projects always go to the last group. */
const GROUPS: [kinds: string[], label: string][] = [
  [["game"], "Games"],
  [["mod"], "Mods"],
  [["emulator"], "Emulators"],
  [["app"], "Apps"],
  [["tool"], "Tools"],
  [["suite", "framework"], "Frameworks"],
  [["asset-pack"], "Asset packs"],
  [["research"], "Research"],
  [["idea"], "Ideas"],
  [["external"], "External"],
];

/** The status filter value for "every status". */
export const ANY_STATUS = "";

// ── Types ─────────────────────────────────
export interface Filters {
  query: string;
  /** A project must have every selected tag. */
  tags: string[];
  status: string;
  /** Only repos with uncommitted changes or unpushed commits. */
  changed: boolean;
}

export interface Group {
  label: string;
  projects: Project[];
}

// ── Public API ────────────────────────────
/** The filters that show everything. */
export const NO_FILTERS: Filters = { query: "", tags: [], status: ANY_STATUS, changed: false };

/** True when a repo has uncommitted changes or unpushed commits. */
export function hasChanges(git: GitStatus | undefined): boolean {
  return !!git && (git.uncommitted > 0 || (git.unpushed ?? 0) > 0);
}

/** The projects that match the search text, every selected tag, the status, and the "has changes" switch. */
export function filterProjects(projects: Project[], filters: Filters, git: GitStatuses = {}): Project[] {
  const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter((p) => {
    if (filters.status !== ANY_STATUS && p.status !== filters.status) return false;
    if (filters.changed && !hasChanges(git[p.path])) return false;
    if (!filters.tags.every((tag) => p.tags.includes(tag))) return false;
    const text = [p.name, p.path, p.description, p.notes ?? "", ...p.tags, ...p.stack].join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** Projects grouped by kind in a fixed order, then "Other" and "Archive"; empty groups are left out. */
export function groupProjects(projects: Project[]): Group[] {
  const groups = GROUPS.map(([kinds, label]) => ({
    label,
    projects: projects.filter((p) => !p.archived && kinds.includes(p.kind)),
  }));
  const known = GROUPS.flatMap(([kinds]) => kinds);
  groups.push({ label: "Other", projects: projects.filter((p) => !p.archived && !known.includes(p.kind)) });
  groups.push({ label: "Archive", projects: projects.filter((p) => p.archived) });
  return groups.filter((g) => g.projects.length > 0);
}

/** Every tag in use, most used first, then by name. */
export function tagsInUse(projects: Project[]): string[] {
  const counts = new Map<string, number>();
  for (const tag of projects.flatMap((p) => p.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

/** Every status in use, sorted. */
export function statusesInUse(projects: Project[]): string[] {
  return [...new Set(projects.map((p) => p.status).filter(Boolean))].sort();
}
