// Backend: every call to Rust (invoke and listen), with fake data when running in a plain browser.
// In `pnpm dev`, add `?empty` to the URL to see the first-run screen, `?broken` for an unreadable projects.json,
// `?update` for a newer release, `?native` for the system title bar.

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { fakeProjects } from "./fakeProjects";
import type {
  AppInfo,
  GitHistory,
  GitStatuses,
  Listing,
  Look,
  NewEntry,
  Scan,
  Settings,
  SetupResult,
  UpdateCheck,
} from "./types";

// ── Fake backend ──────────────────────────
const inTauri = "__TAURI_INTERNALS__" in window;

let fake: Listing = new URLSearchParams(location.search).has("empty")
  ? { workstations: [], open: null }
  : {
      workstations: [
        { name: "WORKSTATION", root: "C:/path/to/WORKSTATION", available: true },
        { name: "work", root: "D:/work", available: false },
      ],
      open: "C:/path/to/WORKSTATION",
    };

function fakeAdd(root: string): Listing {
  if (!fake.workstations.some((w) => w.root === root)) {
    const name = root.split(/[\\/]/).filter(Boolean).pop() ?? root;
    fake = { ...fake, workstations: [...fake.workstations, { name, root, available: true }] };
  }
  fake = { ...fake, open: root };
  return fake;
}

let fakeList = fakeProjects;

function fakeRegister(entry: NewEntry) {
  fakeList = fakeList.map((p) => (p.path === entry.path ? { ...p, ...entry, notes: null, registered: true } : p));
}

const nativeFrame = new URLSearchParams(location.search).has("native");
let fakeSettings: Settings = { look: { nativeFrame, liquidBackground: true } };

function fakeRemove(root: string): Listing {
  const workstations = fake.workstations.filter((w) => w.root !== root);
  fake = { workstations, open: fake.open === root ? (workstations[0]?.root ?? null) : fake.open };
  return fake;
}

// ── App and settings ──────────────────────
/** The running version and the frame the window got at start. */
export async function appInfo(): Promise<AppInfo> {
  return inTauri ? invoke("app_info") : { version: "0.1.0", frame: nativeFrame ? "native" : "custom" };
}

/** The saved settings. */
export async function getSettings(): Promise<Settings> {
  return inTauri ? invoke("get_settings") : fakeSettings;
}

/** Saves a new look and returns the settings; the frame applies at the next start. */
export async function setLook(look: Look): Promise<Settings> {
  if (inTauri) return invoke("set_look", { look });
  fakeSettings = { ...fakeSettings, look };
  return fakeSettings;
}

// ── Workstations ──────────────────────────
/** The saved workstations and which one is open. */
export async function listWorkstations(): Promise<Listing> {
  return inTauri ? invoke("list_workstations") : fake;
}

/** Adds a workstation root and opens it. Rejects with a message when the folder isn't a workstation. */
export async function addWorkstation(root: string): Promise<Listing> {
  if (inTauri) return invoke("add_workstation", { root });
  // The fake treats only folders named like a workstation as one, so the setup offer can be tried.
  if (!/workstation/i.test(root)) throw `${root} isn't a workstation: it has no projects.json.`;
  return fakeAdd(root);
}

/** Writes the starter kit into `root` (never overwriting a file), adds it as a workstation and opens it. */
export async function setupWorkstation(root: string): Promise<SetupResult> {
  if (inTauri) return invoke("setup_workstation", { root });
  return { listing: fakeAdd(root), written: 108, skipped: 0 };
}

/** Forgets a workstation; its folder is untouched. */
export async function removeWorkstation(root: string): Promise<Listing> {
  return inTauri ? invoke("remove_workstation", { root }) : fakeRemove(root);
}

/** Switches to another listed workstation. */
export async function openWorkstation(root: string): Promise<Listing> {
  if (inTauri) return invoke("open_workstation", { root });
  fake = { ...fake, open: root };
  return fake;
}

// ── Projects ──────────────────────────────
/** Every project of the workstation at `root`. */
export async function scanWorkstation(root: string): Promise<Scan> {
  if (inTauri) return invoke("scan_workstation", { root });
  const broken = new URLSearchParams(location.search).has("broken");
  return broken
    ? { projects: fakeList.filter((p) => !p.registered), registryError: "projects.json can't be read: line 3" }
    : { projects: fakeList, registryError: null };
}

/** Git status of the repos among `paths`; plain folders are left out. */
export async function gitStatus(root: string, paths: string[]): Promise<GitStatuses> {
  if (inTauri) return invoke("git_status", { root, paths });
  return {
    "apps/desktop/workstation/": { branch: "main", uncommitted: 4, unpushed: 2, owner: "nyaridev" },
    "games/roblox/fish-dive/": { branch: "main", uncommitted: 0, unpushed: 0, owner: "nari-games" },
    "tools/rename/": { branch: "feature/batch", uncommitted: 1, unpushed: null, owner: "nyaridev" },
    "frameworks/kit/kit-core/": { branch: "main", uncommitted: 0, unpushed: 0, owner: "nyaridev" },
    "frameworks/kit/kit-ui/": { branch: "main", uncommitted: 3, unpushed: 1, owner: "nyaridev" },
    // A game home reads as its game/ repo, as the real backend reports it.
    "games/godot/swamp/": { branch: "main", uncommitted: 0, unpushed: 2, owner: "local" },
    "games/godot/swamp/game/": { branch: "main", uncommitted: 0, unpushed: 2, owner: "local" },
    "games/godot/swamp/wiki/": { branch: "main", uncommitted: 5, unpushed: 0, owner: "local" },
  };
}

/** The git overview of the repo at `path`: branch, upstream, uncommitted files and the latest commits. */
export async function gitHistory(root: string, path: string): Promise<GitHistory> {
  if (inTauri) return invoke("git_history", { root, path });
  const day = 24 * 60 * 60 * 1000;
  const commit = (n: number, subject: string, unpushed: boolean) => ({
    hash: `${n}`.padStart(40, "a"),
    short: `${n}`.padStart(7, "a"),
    subject,
    author: "Nari",
    date: new Date(Date.now() - n * day).toISOString(),
    unpushed,
  });
  return {
    branch: "main",
    upstream: "origin/main",
    behind: 1,
    changes: [
      { code: " M", path: "src/app/App.tsx" },
      { code: "??", path: "docs/notes.md" },
    ],
    commits: [
      commit(0, "Open a git overview from a repo's row", true),
      commit(1, "Totals for homes and suites", true),
      commit(2, "Suites open to their repos", false),
      commit(5, "More filters", false),
      commit(9, "Initial scaffold", false),
    ],
  };
}

/** A guess at a project's stack from its files. */
export async function guessStack(root: string, path: string): Promise<string[]> {
  return inTauri ? invoke("guess_stack", { root, path }) : ["Rust"];
}

/** Adds a `projects.json` entry for an unregistered project. Rejects with a message when Rust refuses it. */
export async function registerProject(root: string, entry: NewEntry): Promise<void> {
  if (inTauri) return invoke("register_project", { root, entry });
  if (!entry.description.trim()) throw "A project needs a name and a one-sentence description.";
  fakeRegister(entry);
}

/** Replaces a project's tags in `projects.json`. */
export async function setTags(root: string, path: string, tags: string[]): Promise<void> {
  if (inTauri) return invoke("set_tags", { root, path, tags });
  fakeList = fakeList.map((p) => (p.path === path ? { ...p, tags } : p));
}

/** Calls `onChange` with the workstation root whenever its projects may have changed; returns a function that stops. */
export function onProjectsChanged(onChange: (root: string) => void): () => void {
  if (!inTauri) return () => {};
  const unlisten = listen<string>("projects-changed", (event) => onChange(event.payload));
  return () => void unlisten.then((stop) => stop());
}

/** Opens a project folder (`path` relative to `root`) in the file explorer. */
export async function openFolder(root: string, path: string): Promise<void> {
  if (inTauri) return invoke("open_folder", { root, path });
  window.alert(`Would open ${root}/${path}`);
}

// ── Updates ───────────────────────────────
/** The running version, and the newest release on GitHub when it's newer. */
export async function checkUpdate(): Promise<UpdateCheck> {
  if (inTauri) return invoke("check_update");
  const page = "https://github.com/nyaridev/workstation/releases/tag/v0.2.0";
  return {
    current: "0.1.0",
    latest: new URLSearchParams(location.search).has("update") ? { version: "0.2.0", page } : null,
  };
}

/** Downloads and checks `version`, swaps it in for the running app and restarts. Rejects with why it can't. */
export async function installUpdate(version: string): Promise<void> {
  if (inTauri) return invoke("install_update", { version });
  throw "This is the browser preview, so it can't install anything.";
}

/** Opens a release page of this app in the browser. */
export async function openReleasePage(url: string): Promise<void> {
  if (inTauri) return invoke("open_release_page", { url });
  window.open(url, "_blank", "noopener");
}

// ── Window ────────────────────────────────
/** Minimizes the window (the title bar draws its own buttons). Does nothing in a browser. */
export async function minimizeWindow(): Promise<void> {
  if (inTauri) await getCurrentWindow().minimize();
}

/** Maximizes the window, or restores it when it's maximized. */
export async function toggleMaximizeWindow(): Promise<void> {
  if (inTauri) await getCurrentWindow().toggleMaximize();
}

/** Closes the window, which quits the app. */
export async function closeWindow(): Promise<void> {
  if (inTauri) await getCurrentWindow().close();
}

/** Calls `onChange` now and whenever the window is maximized or restored; returns a function that stops. */
export function onMaximizedChange(onChange: (maximized: boolean) => void): () => void {
  if (!inTauri) return () => {};
  const win = getCurrentWindow();
  const update = () => void win.isMaximized().then(onChange);
  update();
  const unlisten = win.onResized(update);
  return () => void unlisten.then((stop) => stop());
}

/** Asks for a folder; null when cancelled. */
export async function pickFolder(): Promise<string | null> {
  if (!inTauri) return window.prompt("Workstation folder", "C:/path/to/another");
  const picked = await open({ directory: true, title: "Pick a workstation folder" });
  return typeof picked === "string" ? picked : null;
}
