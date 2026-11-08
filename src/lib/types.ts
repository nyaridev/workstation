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
