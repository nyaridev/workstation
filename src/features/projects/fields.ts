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

/** Every allowed `status`, from first idea to done. */
export const STATUSES = ["planning", "prototyping", "in-development", "released", "on-hold"] as const;

/** Lowercase kebab-case, the shape every tag has: "Co Op!" → "co-op". Empty when nothing usable is left. */
export function toTag(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
