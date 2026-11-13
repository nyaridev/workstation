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
  /** The owner in the origin URL; null without a remote. */
  owner: string | null;
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

/** A release of the app (`update::Release`). */
export interface Release {
  /** `0.2.0`, without the `v`. */
  version: string;
  /** The release's page on GitHub. */
  page: string;
}

/** The running version, and the newest release when it's newer (`commands::UpdateCheck`). */
export interface UpdateCheck {
  current: string;
  latest: Release | null;
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

/** A repo's overview (`git::History`): where it stands, what isn't committed, and its latest commits. */
export interface GitHistory {
  branch: string;
  /** `origin/main`; null when the branch tracks nothing. */
  upstream: string | null;
  /** Commits behind the upstream as of the last fetch; null without an upstream. */
  behind: number | null;
  /** Uncommitted files: `code` is git's two status letters (` M`, `??`…). */
  changes: { code: string; path: string }[];
  /** Newest first. */
  commits: Commit[];
}

/** How the window is framed (`window::Frame`): `custom` draws its own title bar, `native` has the system's. */
export type Frame = "custom" | "native";

/** The running version and the window's frame (`commands::AppInfo`). */
export interface AppInfo {
  version: string;
  frame: Frame;
}

/** How the window looks (`settings::Look`). */
export interface Look {
  /** The system's own title bar; applies at the next start. */
  nativeFrame: boolean;
  /** iro-ui's flowing liquid behind the window. */
  liquidBackground: boolean;
}

/** The app's settings (`settings::Settings`). */
export interface Settings {
  look: Look;
}
