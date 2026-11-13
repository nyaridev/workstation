// ChangeDiff: one uncommitted file's diff in the git overview, its added and removed lines colored; Rust sends it
// with the overview, so it's read only while the panel is open.

import { CodeBlock } from "iro-ui";
import type { GitHistory } from "../../lib/types";

interface Props {
  change: GitHistory["changes"][number];
}

// The class that colors one line of a diff.
const tone = (line: string) =>
  line.startsWith("@@")
    ? "diff-hunk"
    : line.startsWith("+")
      ? "diff-add"
      : line.startsWith("-")
        ? "diff-del"
        : undefined;

/** The file's hunks, or why there are none. */
export function ChangeDiff({ change }: Props) {
  if (change.diff === null) {
    return (
      <p className="muted small">
        {change.code === "??" ? "Not tracked yet, so git has no diff for it." : "No text diff: a binary file."}
      </p>
    );
  }
  const lines = change.diff.split("\n");
  return (
    <CodeBlock
      code={change.diff}
      language="diff"
      maxHeight={320}
      copyLabel="Copy the diff"
      lines={lines.map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lines have no identity but their place
        <span key={i} className={tone(line)}>
          {line}
        </span>
      ))}
    />
  );
}
