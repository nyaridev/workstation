// Backend: every call to Rust (invoke and listen), with fake data when running in a plain browser.
// In `pnpm dev`, add `?empty` to the URL to see the first-run screen, `?broken` for an unreadable projects.json,
// `?update` for a newer release (`?update=downloading` while it downloads, `?update=error` for a failed check),
// `?native` for the system title bar, `?mac` for macOS (its overlay frame and words).

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-dialog";
import { fakeProjects } from "./fakeProjects";
import type {
  AppInfo,
  Commit,
  FileDiff,
  GitOverview,
  GitStatuses,
  Listing,
  Look,
  NewEntry,
  Preferences,
  Scan,
  Settings,
  SetupResult,
  UpdateStatus,
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
let fakeSettings: Settings = {
  look: { nativeFrame, liquidBackground: true },
  preferences: { checkForUpdates: true, startWithSystem: false, closeToTray: true },
};

const updateFlag = new URLSearchParams(location.search).get("update");
let fakeUpdate: UpdateStatus = {
  current: "0.1.0",
  latest: updateFlag === null ? null : "0.2.0",
  step: updateFlag === "downloading" ? "downloading" : null,
  progress: updateFlag === "downloading" ? 0.4 : null,
  error: updateFlag === "error" ? "Couldn't check for updates: GitHub didn't answer." : null,
  canUpdate: true,
  checkedAt: Math.floor(Date.now() / 1000) - 600,
};
const fakeUpdateHandlers = new Set<(status: UpdateStatus) => void>();

function setFakeUpdate(change: Partial<UpdateStatus>) {
  fakeUpdate = { ...fakeUpdate, ...change };
  for (const handler of fakeUpdateHandlers) handler(fakeUpdate);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fakeRemove(root: string): Listing {
  const workstations = fake.workstations.filter((w) => w.root !== root);
  fake = { workstations, open: fake.open === root ? (workstations[0]?.root ?? null) : fake.open };
  return fake;
}

// ── App and settings ──────────────────────
/** The running version and the frame the window got at start. */
export async function appInfo(): Promise<AppInfo> {
  if (inTauri) return invoke("app_info");
  const mac = new URLSearchParams(location.search).has("mac");
  return {
    version: "0.1.0",
    os: mac ? "macos" : "windows",
    frame: nativeFrame ? "native" : mac ? "overlay" : "custom",
  };
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

/** Saves how the app behaves and returns the settings. */
export async function setPreferences(preferences: Preferences): Promise<Settings> {
  if (inTauri) return invoke("set_preferences", { preferences });
  fakeSettings = { ...fakeSettings, preferences };
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
    "apps/desktop/workstation/": {
      branch: "main",
      uncommitted: 4,
      unpushed: 2,
      behind: 0,
      owner: "nyaridev",
      repo: "workstation",
    },
    "games/roblox/fish-dive/": {
      branch: "main",
      uncommitted: 0,
      unpushed: 0,
      behind: 0,
      owner: "nari-games",
      repo: "fish-dive",
    },
    "tools/rename/": {
      branch: "feature/batch",
      uncommitted: 1,
      unpushed: null,
      behind: null,
      owner: "nyaridev",
      repo: "rename",
    },
    "frameworks/kit/kit-core/": {
      branch: "main",
      uncommitted: 0,
      unpushed: 0,
      behind: 0,
      owner: "nyaridev",
      repo: "kit-core",
    },
    "frameworks/kit/kit-ui/": {
      branch: "main",
      uncommitted: 3,
      unpushed: 1,
      behind: 4,
      owner: "nyaridev",
      repo: "kit-ui",
    },
    // A game home reads as its game/ repo, as the real backend reports it.
    "games/godot/swamp/": { branch: "main", uncommitted: 0, unpushed: 2, behind: 0, owner: null, repo: null },
    "games/godot/swamp/game/": { branch: "main", uncommitted: 0, unpushed: 2, behind: 0, owner: null, repo: null },
    "games/godot/swamp/wiki/": {
      branch: "main",
      uncommitted: 5,
      unpushed: 0,
      behind: 2,
      owner: "nari-games",
      repo: "swamp-wiki",
    },
  };
}

/** Opens the web page of the repo at `path` (its remote) in the browser. */
export async function openRepoPage(root: string, path: string): Promise<void> {
  if (inTauri) return invoke("open_repo_page", { root, path });
  window.open(`https://github.com/example/${path.split("/").filter(Boolean).pop()}`, "_blank", "noopener");
}

/** Pulls the repo at `path` by fast-forward only (ADR-0018); answers how many commits came in. */
export async function gitPull(root: string, path: string): Promise<number> {
  if (inTauri) return invoke("git_pull", { root, path });
  await new Promise((resolve) => setTimeout(resolve, 700));
  return path.includes("fish-dive") ? 0 : 3;
}

// Fake overview data: enough files and commits that both lists page.
const FAKE_CHANGES = [
  { code: " M", path: "src/app/App.tsx" },
  { code: "??", path: "docs/notes.md" },
  ...Array.from({ length: 22 }, (_, i) => ({ code: "??", path: `assets/tiles/tile-${i + 1}.png` })),
];
const FAKE_SUBJECTS = [
  "Open a git overview from a repo's row",
  "Totals for homes and suites",
  "Suites open to their repos",
];

/** The git overview of the repo at `path`: branch, upstream, uncommitted files and how many commits. */
export async function gitOverview(root: string, path: string): Promise<GitOverview> {
  if (inTauri) return invoke("git_overview", { root, path });
  return { branch: "main", upstream: "origin/main", behind: 1, unpushed: 2, changes: FAKE_CHANGES, commits: 45 };
}

/** The diffs of some of the repo's uncommitted files (a page of the overview's list), in the same order. */
export async function gitDiffs(root: string, path: string, files: string[]): Promise<FileDiff[]> {
  if (inTauri) return invoke("git_diffs", { root, path, files });
  return files.map((file) =>
    file === "src/app/App.tsx"
      ? {
          path: file,
          added: 2,
          removed: 1,
          diff: '@@ -12,4 +12,5 @@ export function App() {\n   const [view, setView] = useState("home");\n-  const drag = frame === "custom";\n+  const drag = frame !== "native";\n+  const mac = frame === "overlay";\n   return (',
        }
      : { path: file, added: null, removed: null, diff: null },
  );
}

/** A page of the repo's commits, newest first: up to `limit` after skipping `skip`. */
export async function gitCommits(root: string, path: string, skip: number, limit: number): Promise<Commit[]> {
  if (inTauri) return invoke("git_commits", { root, path, skip, limit });
  const day = 24 * 60 * 60 * 1000;
  return Array.from({ length: Math.max(0, Math.min(limit, 45 - skip)) }, (_, i) => {
    const n = skip + i;
    return {
      hash: `${n}`.padStart(40, "a"),
      short: `${n}`.padStart(7, "a"),
      subject: FAKE_SUBJECTS[n % FAKE_SUBJECTS.length] ?? "",
      author: "Nari",
      date: new Date(Date.now() - n * day).toISOString(),
      unpushed: n < 2,
    };
  });
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
/** What the updater knows now (ADR-0014). */
export async function updateStatus(): Promise<UpdateStatus> {
  return inTauri ? invoke("update_status") : fakeUpdate;
}

/** Looks for a newer release now. */
export async function checkForUpdate(): Promise<UpdateStatus> {
  if (inTauri) return invoke("check_for_update");
  setFakeUpdate({ step: "checking", error: null });
  await wait(800);
  setFakeUpdate({ step: null, checkedAt: Math.floor(Date.now() / 1000) });
  return fakeUpdate;
}

/** Installs the update a check found; the app restarts into it. */
export async function installUpdate(): Promise<void> {
  if (inTauri) return invoke("install_update");
  for (let percent = 0; percent <= 100; percent += 10) {
    setFakeUpdate({ step: "downloading", progress: percent / 100 });
    await wait(200);
  }
  setFakeUpdate({ step: "installing", progress: null });
  await wait(800);
  setFakeUpdate({ current: fakeUpdate.latest ?? fakeUpdate.current, latest: null, step: null });
}

/** Calls `handler` whenever the updater's status changes; returns a function that stops. */
export function onUpdateChanged(handler: (status: UpdateStatus) => void): () => void {
  if (!inTauri) {
    fakeUpdateHandlers.add(handler);
    return () => void fakeUpdateHandlers.delete(handler);
  }
  const unlisten = listen<UpdateStatus>("update-changed", (event) => handler(event.payload));
  return () => void unlisten.then((stop) => stop());
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
