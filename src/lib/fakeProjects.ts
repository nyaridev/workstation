// Fake projects for `pnpm dev` in a plain browser, covering every flag and a few kinds.

import type { Project } from "./types";

const base = {
  archived: false,
  owner: "local",
  notes: null,
  onDisk: true,
  registered: true,
  repo: true,
  folders: [],
  milestones: [],
};
// Each milestone as "name: what it covers".
const plan = (done: number, steps: string[], track: string | null = null) =>
  steps.map((step, i) => {
    const [name = step, description = null] = step.split(": ");
    return { name, done: i < done, track, description };
  });
const folder = (path: string, repo = false) => ({ path, name: path.split("/").at(-2) ?? path, repo });

/** A small made-up workstation. */
export const fakeProjects: Project[] = [
  {
    ...base,
    path: "apps/desktop/workstation/",
    name: "Workstation",
    kind: "app",
    stack: ["Tauri", "Rust", "React"],
    owner: "nyaridev",
    status: "prototyping",
    description: "Overseer for WORKSTATION folders.",
    tags: ["desktop", "workstation"],
    milestones: plan(3, [
      "M15 Settings tabs: Workstations and App, each a tab.",
      "M16 Tray and autostart: start with the system, close to the tray.",
      "M17 Installers: Windows, macOS and Linux from GitHub Actions.",
      "M18 Release v1.0.0: check everything by hand, then ship.",
    ]),
  },
  {
    ...base,
    path: "apps/web/old-site/",
    name: "Old Site",
    kind: "app",
    stack: ["HTML"],
    status: "on-hold",
    description: "A site whose folder was moved away.",
    tags: ["web"],
    onDisk: false,
  },
  {
    ...base,
    path: "archive/games/roblox/obby/",
    name: "obby",
    kind: "game",
    archived: true,
    stack: [],
    owner: null,
    status: "",
    description: "",
    tags: [],
    registered: false,
  },
  {
    ...base,
    path: "frameworks/kit/",
    name: "Kit",
    kind: "suite",
    stack: [],
    owner: null,
    status: "in-development",
    description: "A family of repos released together.",
    tags: ["kit"],
    repo: false,
    folders: [folder("frameworks/kit/notes/")],
  },
  {
    ...base,
    path: "frameworks/kit/kit-core/",
    name: "kit-core",
    kind: "framework",
    stack: ["Rust"],
    status: "released",
    description: "The core library.",
    tags: ["kit"],
  },
  {
    ...base,
    path: "frameworks/kit/kit-ui/",
    name: "kit-ui",
    kind: "framework",
    stack: ["TypeScript"],
    status: "in-development",
    description: "Widgets on top of the core.",
    tags: ["kit"],
  },
  {
    ...base,
    path: "games/godot/swamp/",
    name: "Swamp",
    kind: "game",
    stack: ["Godot 4.7", "GDScript"],
    status: "in-development",
    description: "Co-op swamp survival for up to 4 players.",
    tags: ["godot", "co-op", "survival"],
    notes: "Steam via Spacewar until its own AppID.",
    repo: false,
    // Two plans, so the row shows two milestone lines and the panel has tabs.
    milestones: [
      ...plan(
        2,
        [
          "S1 Login server: Accounts and the channel list.",
          "S2 World server: Maps, movement and NPCs.",
          "S3 Combat: Skills, damage and drops.",
          "S4 Raids",
        ],
        "Server",
      ),
      ...plan(
        1,
        [
          "R1 Engine: Window, input and the game loop.",
          "R2 Rendering: Maps and characters on screen.",
          "R3 Networking",
          "R4 UI",
          "R5 Content",
          "R6 Launch",
        ],
        "Rewrite",
      ),
    ],
    folders: [
      folder("games/godot/swamp/assets/"),
      folder("games/godot/swamp/docs/"),
      folder("games/godot/swamp/game/", true),
      folder("games/godot/swamp/wiki/", true),
    ],
  },
  {
    ...base,
    path: "games/roblox/fish-dive/",
    name: "Fish Dive",
    kind: "game",
    stack: ["Roblox", "ume"],
    owner: "nari-games",
    status: "prototyping",
    description: "Dive deeper, catch rarer fish, upgrade your gear.",
    tags: ["roblox", "ume", "simulator"],
  },
  {
    ...base,
    path: "research/2026-10-loops/",
    name: "Roblox Game Loops",
    kind: "research",
    stack: ["Markdown"],
    owner: null,
    status: "complete",
    description: "Core loops of top Roblox games.",
    tags: ["roblox", "game-design"],
  },
  {
    ...base,
    path: "tools/rename/",
    name: "rename",
    kind: "tool",
    stack: [],
    owner: null,
    status: "",
    description: "",
    tags: [],
    registered: false,
  },
];
