// Types shared with Rust, matching the serde names of the Rust structs.

/** A saved workstation (`workstations::Entry`). */
export interface Workstation {
  name: string;
  root: string;
  /** False when the folder is gone or no longer a workstation. */
  available: boolean;
}

/** Every workstation and which one is open (`workstations::Listing`). */
export interface Listing {
  workstations: Workstation[];
  open: string | null;
}

/** What setting up a workstation did (`commands::SetupResult`). */
export interface SetupResult {
  listing: Listing;
  /** Kit files written. */
  written: number;
  /** Kit files left alone because they were already there. */
  skipped: number;
}

/** A project, merged from the disk and `projects.json` (`scan::Project`). */
export interface Project {
  /** From the workstation root, forward slashes, trailing slash. */
  path: string;
  name: string;
  kind: string;
  archived: boolean;
  stack: string[];
  owner: string | null;
  /** Empty for unregistered projects. */
  status: string;
  description: string;
  tags: string[];
  notes: string | null;
  /** False when `projects.json` lists it but the folder doesn't exist. */
  onDisk: boolean;
  /** False when the folder exists but `projects.json` has no entry for it. */
  registered: boolean;
  /** True when the folder is a git repo itself; a game home isn't (its repo is `game/`), nor is a suite. */
  repo: boolean;
  /** Important folders inside a project that isn't a repo itself; projects of their own aren't repeated here. */
  folders: Folder[];
  /** Its plan in order (`milestones` in projects.json); the first not done is the one being worked on. */
  milestones: Milestone[];
}

/** One step of a project's plan (`scan::Milestone`). */
export interface Milestone {
  name: string;
  done: boolean;
}

/** A folder inside a project worth showing: a repo, or one with its own docs or rules (`scan::Folder`). */
export interface Folder {
  path: string;
  name: string;
  repo: boolean;
}

/** What git says about a project's repo (`git::Status`). */
export interface GitStatus {
  branch: string;
  uncommitted: number;
  /** Null when the branch has no upstream. */
  unpushed: number | null;
  /** Commits on the upstream that aren't here, as of the last fetch; null when the branch has no upstream. */
  behind: number | null;
  /** The owner in the origin URL; null without a remote. */
  owner: string | null;
  /** The repo's name in the origin URL; null without a remote. */
  repo: string | null;
}

/** Git status by project path; projects that aren't repos have no key. */
export type GitStatuses = Record<string, GitStatus>;

/** A new `projects.json` entry (`scan::Entry`), in the documented key order. */
export interface NewEntry {
  name: string;
  path: string;
  kind: string;
  stack: string[];
  owner: string | null;
  status: string;
  description: string;
  tags: string[];
}

/** Every project of a workstation (`scan::Scan`). */
export interface Scan {
  projects: Project[];
  /** Why `projects.json` couldn't be read; the folders on disk are still listed. */
  registryError: string | null;
}

/** What the updater is doing (`update::UpdateStep`). */
export type UpdateStep = "checking" | "downloading" | "installing";

/** The running version and what GitHub has (`update::UpdateStatus`, ADR-0014). */
export interface UpdateStatus {
  current: string;
  /** A newer version, once a check found one. */
  latest: string | null;
  step: UpdateStep | null;
  /** How much of the update has downloaded, 0 to 1, while it does. */
  progress: number | null;
  /** Why the last check or install failed. */
  error: string | null;
  /** A release build; a debug build never checks. */
  canUpdate: boolean;
  /** When the last check finished, in Unix seconds. */
  checkedAt: number | null;
}

/** One commit (`git::Commit`). */
export interface Commit {
  hash: string;
  short: string;
  subject: string;
  author: string;
  /** ISO 8601. */
  date: string;
  /** Not on the upstream branch (or, without one, on no remote). */
  unpushed: boolean;
}

/** A repo's overview (`git::Overview`): where it stands, what isn't committed, and how many commits it has. Diffs
 * and commits come a page at a time (`gitDiffs`, `gitCommits`). */
export interface GitOverview {
  branch: string;
  /** `origin/main`; null when the branch tracks nothing. */
  upstream: string | null;
  /** Commits behind the upstream as of the last fetch; null without an upstream. */
  behind: number | null;
  /** Commits not on the upstream (or, without one, on no remote). */
  unpushed: number;
  /** Uncommitted files: `code` is git's two status letters (` M`, `??`…). */
  changes: { code: string; path: string }[];
  /** Commits on the branch. */
  commits: number;
}

/** One uncommitted file's changes (`git::FileDiff`); all null for untracked files, `diff` null for binary ones. */
export interface FileDiff {
  path: string;
  added: number | null;
  removed: number | null;
  diff: string | null;
}

/**
 * How the window is framed (`window::Frame`): `custom` draws its own title bar, `overlay` has macOS's buttons over the
 * header, `native` has the system's title bar.
 */
export type Frame = "custom" | "overlay" | "native";

/** The running version, the system and the window's frame (`commands::AppInfo`). */
export interface AppInfo {
  version: string;
  /** `windows`, `macos` or `linux`. */
  os: string;
  frame: Frame;
}

/** How the window looks (`settings::Look`). */
export interface Look {
  /** The system's own title bar; applies at the next start. */
  nativeFrame: boolean;
  /** iro-ui's flowing liquid behind the window. */
  liquidBackground: boolean;
}

/** How the app behaves (`settings::Preferences`). */
export interface Preferences {
  /** Look for a newer release at start and every 6 hours. */
  checkForUpdates: boolean;
  /** Start, minimized, when the user signs in. */
  startWithSystem: boolean;
  /** Closing the window hides it in the tray. */
  closeToTray: boolean;
}

/** The app's settings (`settings::Settings`). */
export interface Settings {
  look: Look;
  preferences: Preferences;
  /** Each workstation's list filters by its root, as the window saved them (`restoreFilters` checks them). */
  filters: Record<string, unknown>;
}
