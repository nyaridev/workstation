import { describe, expect, it } from "vitest";
import { toTag } from "./fields";

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
