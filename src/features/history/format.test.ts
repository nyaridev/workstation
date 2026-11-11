import { describe, expect, it } from "vitest";
import { ago, changeLabel } from "./format";

describe("changeLabel", () => {
  it("names git's status letters", () => {
    expect(changeLabel(" M")).toBe("modified");
    expect(changeLabel("A ")).toBe("added");
    expect(changeLabel("MM")).toBe("modified");
    expect(changeLabel("??")).toBe("untracked");
    expect(changeLabel("UU")).toBe("conflict");
    expect(changeLabel(" D")).toBe("deleted");
  });
});

describe("ago", () => {
  const now = Date.parse("2026-11-08T12:00:00Z");
  it("says how long ago, then falls back to the date", () => {
    expect(ago("2026-11-08T11:59:40Z", now)).toBe("just now");
    expect(ago("2026-11-08T11:15:00Z", now)).toBe("45 min ago");
    expect(ago("2026-11-08T07:00:00Z", now)).toBe("5 h ago");
    expect(ago("2026-11-07T10:00:00Z", now)).toBe("yesterday");
    expect(ago("2026-11-01T12:00:00Z", now)).toBe("7 days ago");
    expect(ago("2026-01-01T12:00:00Z", now)).toMatch(/2026/);
  });
});
