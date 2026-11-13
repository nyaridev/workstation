import { describe, expect, it } from "vitest";
import { progressOf } from "./milestones";

const m = (name: string, done: boolean) => ({ name, done });

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
