// Boundary check (frontend rule): only src/lib/backend.ts may import Tauri in the window.

import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

// ── Constants ─────────────────────────────
const ALLOWED = new Set([join("src", "lib", "backend.ts")]);
const TAURI_IMPORT = /from\s+["']@tauri-apps\//;

// ── Check ─────────────────────────────────
let failed = false;
for (const file of readdirSync("src", { recursive: true })) {
  const path = join("src", file);
  if (![".ts", ".tsx"].includes(extname(path)) || ALLOWED.has(path)) continue;
  if (TAURI_IMPORT.test(readFileSync(path, "utf8"))) {
    console.error(`boundary  ${path} imports @tauri-apps: call Rust through src/lib/backend.ts instead`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
