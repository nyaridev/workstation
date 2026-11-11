import { describe, expect, it } from "vitest";
import { STATUSES, startingStatus, statusColor, toTag } from "./fields";

describe("statuses", () => {
  it("gives each status but on-hold its own color, and none to on-hold or the unknown", () => {
    const colors = STATUSES.filter((s) => s !== "on-hold").map(statusColor);
    expect(colors).not.toContain(null);
    expect(new Set(colors).size).toBe(colors.length);
    expect(statusColor("on-hold")).toBeNull();
    expect(statusColor("shipped")).toBeNull();
  });

  it("starts ideas as concepts and research as researching", () => {
    expect(startingStatus("idea")).toBe("concept");
    expect(startingStatus("research")).toBe("researching");
    expect(startingStatus("game")).toBe("prototyping");
  });
});

describe("toTag", () => {
  it("makes lowercase kebab-case", () => {
    expect(toTag("Co Op!")).toBe("co-op");
    expect(toTag("  Game_Design  ")).toBe("game-design");
    expect(toTag("roblox")).toBe("roblox");
  });

  it("is empty when nothing usable is left", () => {
    expect(toTag(" -- ")).toBe("");
    expect(toTag("Świat")).toBe("wiat");
  });
});
