// ChangeDiff: one uncommitted file's diff in the git overview, as an editor shows it: old and new line numbers, and
// added and removed lines on tinted rows. Rust sends it with the overview, so it's read only while the panel is open.

import { CodeBlock } from "iro-ui";
import type { CSSProperties } from "react";
import type { GitHistory } from "../../lib/types";
import { diffRows } from "./diff";

interface Props {
  change: GitHistory["changes"][number];
}

const SIGNS = { add: "+", del: "-", same: " " } as const;

/** The file's hunks, or why there are none. */
export function ChangeDiff({ change }: Props) {
  if (change.diff === null) {
    return (
      <p className="muted small">
        {change.code === "??" ? "Not tracked yet, so git has no diff for it." : "No text diff: a binary file."}
      </p>
    );
  }
  const rows = diffRows(change.diff);
  const digits = String(Math.max(0, ...rows.map((r) => Math.max(r.old ?? 0, r.new ?? 0)))).length;
  return (
    <CodeBlock
      className="diff"
      style={{ "--diff-digits": digits } as CSSProperties}
      code={change.diff}
      language="diff"
      maxHeight={360}
      copyLabel="Copy the diff"
      lines={rows.map((row, i) =>
        row.kind === "hunk" || row.kind === "note" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity but their place
          <span key={i} className={`diff-${row.kind}`}>
            {row.text}
          </span>
        ) : (
          // Numbers are generated content (`data-n`), so copying the code leaves them out.
          // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity but their place
          <span key={i} className={`diff-${row.kind}`}>
            <span className="diff-num" data-n={row.old ?? ""} />
            <span className="diff-num" data-n={row.new ?? ""} />
            <span className="diff-sign">{SIGNS[row.kind]}</span>
            {row.text}
          </span>
        ),
      )}
    />
  );
}
