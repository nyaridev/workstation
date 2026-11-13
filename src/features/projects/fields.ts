// Fields: the allowed kinds and statuses of a .workstation file, and turning typed text into a tag.
// Rust checks the same rules when it writes (`scan/registry.rs`).

/** Every allowed `kind`, in the order the list groups them. */
export const KINDS = [
  "game",
  "mod",
  "emulator",
  "app",
  "tool",
  "framework",
  "suite",
  "asset-pack",
  "research",
  "idea",
  "external",
] as const;

/** Every allowed `status`, from first idea to done (meanings: `docs/workstation-file.md` → Statuses). */
export const STATUSES = [
  "concept",
  "planning",
  "researching",
  "prototyping",
  "in-development",
  "released",
  "maintained",
  "complete",
  "on-hold",
] as const;

/** Each status's color: an iro-ui token pair, `--iro-<color>` and `--iro-<color>-ink`. On-hold has none. */
const STATUS_COLORS: Record<string, string> = {
  concept: "pink",
  planning: "purple",
  researching: "cyan",
  prototyping: "orange",
  "in-development": "blue",
  released: "green",
  maintained: "yellow",
  complete: "accent",
};

/** A status's color, or null for on-hold and unknown ones (a hand-edited .workstation): a neutral badge. */
export function statusColor(status: string): string | null {
  return STATUS_COLORS[status] ?? null;
}

/** The status a newly registered project starts with: ideas are concepts, research is researching. */
export function startingStatus(kind: string): string {
  if (kind === "idea") return "concept";
  if (kind === "research") return "researching";
  return "prototyping";
}

/** Lowercase kebab-case, the shape every tag has: "Co Op!" → "co-op". Empty when nothing usable is left. */
export function toTag(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
