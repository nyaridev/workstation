import { describe, expect, it } from "vitest";
import { STATUSES, startingStatus, statusStyle, toTag } from "./fields";

describe("statuses", () => {
  it("gives each status its own pill and a grey one to the unknown", () => {
    const styles = STATUSES.map(statusStyle);
    expect(new Set(styles).size).toBe(STATUSES.length);
    expect(statusStyle("shipped")).toContain("zinc");
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
