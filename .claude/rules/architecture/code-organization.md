---
paths:
  - "src/**"
  - "src-tauri/src/**"
---

# Code organization

## File size

- Up to 1000 lines: fine. 1001–1200: split when there's a clear seam, or say why you kept it whole. Over 1200: always
  split, along responsibilities, updating every import in the same step.
- `pnpm check` runs `scripts/check-size.mjs`, which fails over 1200 and warns over 1000.
- Before adding to a file over 1000 lines, split it first or put the new code in its own file.

## One job per file

- Each file does one thing and its name says what. `lib.rs` and `main.tsx` only wire things up.
- One React component per file, named after it (`ProjectList.tsx`).

## Section order

1. Header: 1–3 lines on what the file is for (`//!` in Rust, `//` in TypeScript).
2. Imports (`use`).
3. Constants.
4. Types.
5. State (module-level; rare).
6. Private helpers.
7. Public API, each item with a one-line doc comment.
8. Setup and exports. Rust ends with `#[cfg(test)] mod tests`.

Skip sections a file doesn't need; never leave an empty divider. Files under about 40 lines may skip dividers. A
placeholder module is only its header comment.

## Dividers

```rust
//! Workstations: the user's list of workstation roots, saved in the app config folder.

// ── Imports ───────────────────────────────
use std::path::{Path, PathBuf};

// ── Constants ─────────────────────────────
const FILE_NAME: &str = "workstations.json";

// ── Types ─────────────────────────────────
pub struct Workstation {
    pub name: String,
    pub root: PathBuf,
}

// ── Public API ────────────────────────────
/// Loads the list, or an empty one when the file doesn't exist yet.
pub fn load(config_dir: &Path) -> Result<Vec<Workstation>, String> {
    // ...
}

#[cfg(test)]
mod tests {
    // ...
}
```

TypeScript uses the same `// ── Name ───` dividers.

## Comments and naming

- Comment why, not what, in one short line. No commented-out code, no stray `console.log` or `println!`.
- Rust: `snake_case` files and functions. TypeScript: `camelCase` files for modules, `PascalCase.tsx` for components.
- The same thing has the same name on both sides: `Workstation`, `Project`, `root`, `kind`.
