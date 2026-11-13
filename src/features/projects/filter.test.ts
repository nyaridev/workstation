import { describe, expect, it } from "vitest";
import { fakeProjects } from "../../lib/fakeProjects";
import type { Project } from "../../lib/types";
import {
  filterProjects,
  gitOf,
  groupProjects,
  NO_FILTERS,
  nestProjects,
  registryFlag,
  restoreFilters,
  sortProjects,
  tagCounts,
  tagsInUse,
  valuesInUse,
} from "./filter";

const all = NO_FILTERS;
const names = (projects: { name: string }[]) => projects.map((p) => p.name);

describe("filterProjects", () => {
  it("keeps everything with no filters", () => {
    expect(filterProjects(fakeProjects, all)).toHaveLength(fakeProjects.length);
  });

  it("needs every word of the search, in any field", () => {
    expect(names(filterProjects(fakeProjects, { ...all, query: "ROBLOX upgrade" }))).toEqual(["Fish Dive"]);
    expect(names(filterProjects(fakeProjects, { ...all, query: "spacewar" }))).toEqual(["Swamp"]);
  });

  it("needs every selected tag and the status", () => {
    expect(names(filterProjects(fakeProjects, { ...all, tags: ["roblox", "game-design"] }))).toEqual([
      "Roblox Game Loops",
    ]);
    expect(names(filterProjects(fakeProjects, { ...all, tags: ["roblox"], status: "prototyping" }))).toEqual([
      "Fish Dive",
    ]);
  });

  it("filters by kind group, owner, stack and flags", () => {
    expect(names(filterProjects(fakeProjects, { ...all, group: "Games" }))).toEqual(["Swamp", "Fish Dive"]);
    expect(names(filterProjects(fakeProjects, { ...all, group: "Archive" }))).toEqual(["obby"]);
    expect(names(filterProjects(fakeProjects, { ...all, owner: "nari-games" }))).toEqual(["Fish Dive"]);
    expect(names(filterProjects(fakeProjects, { ...all, stack: "Tauri" }))).toEqual(["Workstation"]);
    expect(names(filterProjects(fakeProjects, { ...all, flagged: true }))).toEqual(["Old Site", "rename"]);
    expect(names(filterProjects(fakeProjects, { ...all, planned: true }))).toEqual(["Workstation", "Swamp"]);
  });

  it("keeps only repos with changes when asked", () => {
    const git = {
      "games/roblox/fish-dive/": { branch: "main", uncommitted: 0, unpushed: 0, behind: 0, owner: null, repo: null },
      "games/godot/swamp/game/": { branch: "main", uncommitted: 0, unpushed: 3, behind: 0, owner: null, repo: null },
      "tools/rename/": { branch: "main", uncommitted: 2, unpushed: null, behind: null, owner: null, repo: null },
    };
    expect(names(filterProjects(fakeProjects, { ...all, changed: true }, git))).toEqual(["Swamp", "rename"]);
  });
});

describe("groupProjects", () => {
  it("orders groups by kind and puts the archive last", () => {
    const groups = groupProjects(fakeProjects);
    expect(groups.map((g) => g.label)).toEqual(["Games", "Apps", "Tools", "Frameworks", "Research", "Archive"]);
    expect(names(groups[0].projects)).toEqual(["Swamp", "Fish Dive"]);
  });
});

describe("registryFlag", () => {
  it("flags drift, but never an archived folder without an entry", () => {
    const flags = Object.fromEntries(fakeProjects.map((p) => [p.path, registryFlag(p)]));
    expect(flags["archive/games/roblox/obby/"]).toBeNull();
    expect(flags["apps/web/old-site/"]).toBe("folder missing");
    expect(flags["tools/rename/"]).toBe("not in projects.json");
    expect(flags["games/godot/swamp/"]).toBeNull();
    const listed = fakeProjects.find((p) => p.archived);
    expect(listed && registryFlag({ ...listed, registered: true })).toBe("archived: remove from projects.json");
  });
});

describe("tagsInUse", () => {
  it("lists the most used tags first", () => {
    expect(tagsInUse(fakeProjects).slice(0, 2)).toEqual(["kit", "roblox"]);
    expect(tagCounts(fakeProjects)[0]).toEqual(["kit", 3]);
  });
});

describe("nestProjects", () => {
  it("puts a suite's repos under the suite, and keeps the parent when an inner project matches", () => {
    const { top, inside } = nestProjects(fakeProjects);
    expect(top.map((p) => p.path)).not.toContain("frameworks/kit/kit-ui/");
    expect(names(inside.get("frameworks/kit/") ?? [])).toEqual(["kit-core", "kit-ui"]);
    expect(names(filterProjects(top, { ...all, stack: "TypeScript" }, {}, inside))).toEqual(["Kit"]);
    expect(names(filterProjects(top, { ...all, stack: "TypeScript" }))).toEqual([]);
  });
});

describe("gitOf", () => {
  it("sums the repos inside a project that isn't a repo, and ignores its own entry", () => {
    const swamp = fakeProjects.find((p) => p.name === "Swamp");
    const git = {
      "games/godot/swamp/": { branch: "main", uncommitted: 9, unpushed: 9, behind: 0, owner: null, repo: null },
      "games/godot/swamp/game/": { branch: "main", uncommitted: 1, unpushed: 2, behind: 0, owner: null, repo: null },
      "games/godot/swamp/wiki/": {
        branch: "main",
        uncommitted: 3,
        unpushed: null,
        behind: null,
        owner: null,
        repo: null,
      },
    };
    expect(swamp && gitOf(swamp, git, new Map())).toEqual({
      branch: "",
      uncommitted: 4,
      unpushed: 2,
      behind: 0,
      owner: null,
      repo: null,
    });
    const repo = fakeProjects.find((p) => p.repo);
    expect(repo && gitOf(repo, {}, new Map())).toBeUndefined();
  });
});

describe("valuesInUse", () => {
  it("lists each value once, sorted, without empty ones", () => {
    expect(valuesInUse(fakeProjects, (p) => [p.owner])).toEqual(["local", "nari-games", "nyaridev"]);
    expect(valuesInUse(fakeProjects, (p) => p.stack)).toContain("Godot 4.7");
  });
});

describe("sortProjects", () => {
  const projects = fakeProjects.slice(0, 4);
  const sorted = (by: "name" | "edited", edited: Record<string, number> = {}) =>
    sortProjects(projects, by, edited).map((p) => p.name);

  it("sorts by name, numbers in order", () => {
    expect(sorted("name")).toEqual(projects.map((p) => p.name).sort((a, b) => a.localeCompare(b)));
  });

  it("puts the last edited first, and those without a time last by name", () => {
    const [a, b, c, d] = projects as [Project, Project, Project, Project];
    const order = sorted("edited", { [c.path]: 300, [a.path]: 100, [d.path]: 200 });
    expect(order).toEqual([c.name, d.name, a.name, b.name]);
  });
});

describe("restoreFilters", () => {
  it("keeps what's valid and drops the rest, with an empty search", () => {
    const saved = { query: "old", tags: ["game", 3], status: "shipped", changed: "yes", sort: "edited", junk: 1 };
    expect(restoreFilters(saved)).toEqual({ ...NO_FILTERS, tags: ["game"], status: "shipped", sort: "edited" });
  });

  it("gives the defaults for nothing or for junk", () => {
    expect(restoreFilters(undefined)).toEqual(NO_FILTERS);
    expect(restoreFilters("text")).toEqual(NO_FILTERS);
    expect(restoreFilters({ sort: "size" }).sort).toBe("name");
  });
});
