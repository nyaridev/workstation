import { describe, expect, it } from "vitest";
import { diffRows } from "./diff";

describe("diffRows", () => {
  it("numbers each side from the hunk header and keeps notes apart", () => {
    const rows = diffRows(
      "@@ -10,3 +10,3 @@ fn main()\n keep\n-old\n+new\n\\ No newline at end of file\n@@ -40 +40,2 @@\n+a\n",
    );
    expect(rows.map((r) => [r.kind, r.old, r.new, r.text])).toEqual([
      ["hunk", null, null, "@@ -10,3 +10,3 @@ fn main()"],
      ["same", 10, 10, "keep"],
      ["del", 11, null, "old"],
      ["add", null, 11, "new"],
      ["note", null, null, "\\ No newline at end of file"],
      ["hunk", null, null, "@@ -40 +40,2 @@"],
      ["add", null, 40, "a"],
      ["note", null, null, ""],
    ]);
  });
});
