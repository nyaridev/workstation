// Fields: the allowed kinds and statuses of a projects.json entry, and turning typed text into a tag.
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

/** Every allowed `status`, from first idea to done (meanings: `docs/projects-json.md` → Statuses). */
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

/** Each status's pill colors; none of them is amber, sky or violet, which the git badges use. */
const STATUS_STYLES: Record<string, string> = {
  concept: "bg-fuchsia-500/15 text-fuchsia-300",
  planning: "bg-purple-500/15 text-purple-300",
  researching: "bg-cyan-500/15 text-cyan-300",
  prototyping: "bg-orange-500/15 text-orange-300",
  "in-development": "bg-indigo-500/20 text-indigo-300",
  released: "bg-emerald-500/15 text-emerald-300",
  maintained: "bg-teal-500/15 text-teal-300",
  complete: "bg-lime-500/15 text-lime-300",
  "on-hold": "bg-zinc-700/60 text-zinc-300",
};

/** The pill classes for a status; an unknown one (a hand-edited projects.json) gets a plain grey pill. */
export function statusStyle(status: string): string {
  return STATUS_STYLES[status] ?? "bg-zinc-800 text-zinc-400";
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
