// Filter: the pure logic behind the project list — the filters, grouping by kind, and the values in use for the
// pickers.

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

/** The value of a picker (kind, status, owner, stack) that lets everything through. */
export const ANY = "";

// ── Types ─────────────────────────────────
/** How projects are ordered inside their group. */
export type SortBy = "name" | "edited";

export interface Filters {
  query: string;
  /** A group label from `groupProjects` ("Games", "Archive"…), or ANY. */
  group: string;
  /** A project must have every selected tag. */
  tags: string[];
  status: string;
  /** A GitHub owner, "local", or ANY. */
  owner: string;
  /** One entry of a project's stack ("Roblox", "Tauri"), or ANY. */
  stack: string;
  /** Only repos with uncommitted changes or unpushed commits. */
  changed: boolean;
  /** Only projects missing their `.workstation` (`registryFlag`). */
  flagged: boolean;
  /** Only projects with a milestone not done yet (`progressOf`). */
  planned: boolean;
  /** Not a filter: the order inside each group. */
  sort: SortBy;
}

export interface Group {
  label: string;
  projects: Project[];
}

// ── Private helpers ───────────────────────
function groupOf(p: Project): string {
  if (p.archived) return "Archive";
  return GROUPS.find(([kinds]) => kinds.includes(p.kind))?.[1] ?? "Other";
}

// ── Public API ────────────────────────────
/** The filters that show everything. */
export const NO_FILTERS: Filters = {
  query: "",
  group: ANY,
  tags: [],
  status: ANY,
  owner: ANY,
  stack: ANY,
  changed: false,
  flagged: false,
  planned: false,
  sort: "name",
};

/** Saved filters (`settings.json`, which anyone could edit) as Filters: unknown or ill-typed values take the
 * defaults, and the search always starts empty. */
export function restoreFilters(saved: unknown): Filters {
  const s: Record<string, unknown> = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
  const text = (key: "group" | "status" | "owner" | "stack") => (typeof s[key] === "string" ? s[key] : NO_FILTERS[key]);
  const flag = (key: "changed" | "flagged" | "planned") => (typeof s[key] === "boolean" ? s[key] : NO_FILTERS[key]);
  return {
    query: "",
    group: text("group"),
    tags: Array.isArray(s.tags) ? s.tags.filter((t): t is string => typeof t === "string") : [],
    status: text("status"),
    owner: text("owner"),
    stack: text("stack"),
    changed: flag("changed"),
    flagged: flag("flagged"),
    planned: flag("planned"),
    sort: s.sort === "edited" ? "edited" : "name",
  };
}

/** The projects by name, or last edited first (`edited`: Unix seconds by path; those without a time go last, by
 * name). */
export function sortProjects(projects: Project[], by: SortBy, edited: Record<string, number>): Project[] {
  const byName = (a: Project, b: Project) => a.name.localeCompare(b.name, undefined, { numeric: true });
  const byEdited = (a: Project, b: Project) => (edited[b.path] ?? -1) - (edited[a.path] ?? -1) || byName(a, b);
  return [...projects].sort(by === "edited" ? byEdited : byName);
}

/** True when a repo has uncommitted changes or unpushed commits. */
export function hasChanges(git: GitStatus | undefined): boolean {
  return !!git && (git.uncommitted > 0 || (git.unpushed ?? 0) > 0);
}

/** A project's git status; for one that isn't a repo itself (a suite, a game home), the sums over the repos inside it,
 * with no branch. Undefined when there's nothing to show. */
export function gitOf(p: Project, git: GitStatuses, inside: Map<string, Project[]>): GitStatus | undefined {
  if (p.repo) return git[p.path];
  const paths = [...(inside.get(p.path) ?? []).map((c) => c.path), ...p.folders.map((f) => f.path)];
  const repos = paths.map((path) => git[path]).filter((s): s is GitStatus => !!s);
  if (repos.length === 0) return undefined;
  const sum = (count: (s: GitStatus) => number) => repos.reduce((total, s) => total + count(s), 0);
  return {
    branch: "",
    uncommitted: sum((s) => s.uncommitted),
    unpushed: sum((s) => s.unpushed ?? 0),
    behind: sum((s) => s.behind ?? 0),
    owner: null,
    repo: null,
  };
}

/** Why a project needs attention, or null when it doesn't: a project folder with no `.workstation`. Archived
 * folders are never flagged. */
export function registryFlag(p: Project): string | null {
  return p.registered || p.archived ? null : "no .workstation";
}

/** Splits the list into top-level projects and, by parent path, the projects inside them (a suite's repos). */
export function nestProjects(projects: Project[]): { top: Project[]; inside: Map<string, Project[]> } {
  const parentOf = (p: Project) =>
    projects
      .filter((other) => other !== p && p.path.startsWith(other.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
  const top: Project[] = [];
  const inside = new Map<string, Project[]>();
  for (const p of projects) {
    const parent = parentOf(p);
    if (!parent) top.push(p);
    else inside.set(parent.path, [...(inside.get(parent.path) ?? []), p]);
  }
  return { top, inside };
}

/** The projects that pass every filter, or have an inner project (in `inside`) that does. The search needs every
 * word somewhere in the project. */
export function filterProjects(
  projects: Project[],
  filters: Filters,
  git: GitStatuses = {},
  inside = new Map<string, Project[]>(),
): Project[] {
  const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  const passes = (p: Project) => {
    if (filters.group !== ANY && groupOf(p) !== filters.group) return false;
    if (filters.status !== ANY && p.status !== filters.status) return false;
    if (filters.owner !== ANY && p.owner !== filters.owner) return false;
    if (filters.stack !== ANY && !p.stack.includes(filters.stack)) return false;
    if (filters.changed && !hasChanges(gitOf(p, git, inside))) return false;
    if (filters.flagged && registryFlag(p) === null) return false;
    if (filters.planned && p.milestones.every((m) => m.done)) return false;
    if (!filters.tags.every((tag) => p.tags.includes(tag))) return false;
    const text = [p.name, p.path, p.description, p.notes ?? "", ...p.tags, ...p.stack].join(" ").toLowerCase();
    return words.every((word) => text.includes(word));
  };
  return projects.filter((p) => passes(p) || (inside.get(p.path) ?? []).some(passes));
}

/** Projects grouped by kind in a fixed order, then "Other" and "Archive"; empty groups are left out. */
export function groupProjects(projects: Project[]): Group[] {
  const labels = [...GROUPS.map(([, label]) => label), "Other", "Archive"];
  return labels
    .map((label) => ({ label, projects: projects.filter((p) => groupOf(p) === label) }))
    .filter((g) => g.projects.length > 0);
}

/** Every tag in use with how many projects have it, most used first, then by name. */
export function tagCounts(projects: Project[]): [tag: string, count: number][] {
  const counts = new Map<string, number>();
  for (const tag of projects.flatMap((p) => p.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Every tag in use, most used first. */
export function tagsInUse(projects: Project[]): string[] {
  return tagCounts(projects).map(([tag]) => tag);
}

/** The distinct non-empty values a field takes across the projects, sorted. */
export function valuesInUse(projects: Project[], field: (p: Project) => (string | null)[]): string[] {
  const values = projects.flatMap(field).filter((v): v is string => !!v);
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
