import { describe, expect, it } from "vitest";
import { fakeProjects } from "../../lib/fakeProjects";
import { filterProjects, groupProjects, NO_FILTERS, tagsInUse } from "./filter";

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

  it("keeps only repos with changes when asked", () => {
    const git = {
      "games/roblox/fish-dive/": { branch: "main", uncommitted: 0, unpushed: 0, owner: null },
      "games/godot/swamp/": { branch: "main", uncommitted: 0, unpushed: 3, owner: null },
      "tools/rename/": { branch: "main", uncommitted: 2, unpushed: null, owner: null },
    };
    expect(names(filterProjects(fakeProjects, { ...all, changed: true }, git))).toEqual(["Swamp", "rename"]);
  });
});

describe("groupProjects", () => {
  it("orders groups by kind and puts the archive last", () => {
    const groups = groupProjects(fakeProjects);
    expect(groups.map((g) => g.label)).toEqual(["Games", "Apps", "Tools", "Research", "Archive"]);
    expect(names(groups[0].projects)).toEqual(["Swamp", "Fish Dive"]);
  });
});

describe("tagsInUse", () => {
  it("lists the most used tags first", () => {
    expect(tagsInUse(fakeProjects).slice(0, 2)).toEqual(["roblox", "co-op"]);
  });
});
