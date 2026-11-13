import { describe, expect, it } from "vitest";
import { progressOf, tracksOf } from "./milestones";

const m = (name: string, done: boolean, track: string | null = null) => ({ name, done, track, description: null });

describe("progressOf", () => {
  it("works on the first milestone not done", () => {
    expect(progressOf([m("M1", true), m("M2", true), m("M3", false), m("M4", false)])).toEqual({
      current: m("M3", false),
      index: 2,
      done: 2,
      total: 4,
    });
  });

  it("counts a later milestone done out of order", () => {
    expect(progressOf([m("M1", false), m("M2", true)])).toMatchObject({ index: 0, done: 1, total: 2 });
  });

  it("has nothing to show without a plan or once every milestone is done", () => {
    expect(progressOf([])).toBeNull();
    expect(progressOf([m("M1", true), m("M2", true)])).toBeNull();
  });
});

describe("tracksOf", () => {
  it("splits by track in the order they first show up, each with its own progress", () => {
    const tracks = tracksOf([
      m("S1", true, "Server"),
      m("R1", true, "Rewrite"),
      m("S2", false, "Server"),
      m("R2", true, "Rewrite"),
    ]);
    expect(tracks.map((t) => [t.name, t.milestones.map((x) => x.name), t.progress?.current.name ?? null])).toEqual([
      ["Server", ["S1", "S2"], "S2"],
      ["Rewrite", ["R1", "R2"], null],
    ]);
  });

  it("keeps a single plan as one unnamed track, and none without milestones", () => {
    expect(tracksOf([m("M1", false)]).map((t) => t.name)).toEqual([null]);
    expect(tracksOf([])).toEqual([]);
  });
});
