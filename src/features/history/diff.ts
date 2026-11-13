// Diff rows: a file's hunks from Rust, split into lines with their old and new line numbers, as an editor's diff
// view shows them.

// ── Types ─────────────────────────────────
export interface DiffRow {
  kind: "hunk" | "add" | "del" | "same" | "note";
  /** The line's number before and after the change; null where the line doesn't exist on that side. */
  old: number | null;
  new: number | null;
  /** The line without its +, - or space. */
  text: string;
}

// ── Public API ────────────────────────────
/** Splits `@@ -a,b +c,d @@` hunks into numbered rows; git's "\ No newline" and the "… more lines" cut are notes. */
export function diffRows(diff: string): DiffRow[] {
  let oldLine = 0;
  let newLine = 0;
  return diff.split("\n").map((line): DiffRow => {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      return { kind: "hunk", old: null, new: null, text: line };
    }
    const sign = line[0];
    const text = line.slice(1);
    if (sign === "+") return { kind: "add", old: null, new: newLine++, text };
    if (sign === "-") return { kind: "del", old: oldLine++, new: null, text };
    if (sign === " ") return { kind: "same", old: oldLine++, new: newLine++, text };
    return { kind: "note", old: null, new: null, text: line };
  });
}
