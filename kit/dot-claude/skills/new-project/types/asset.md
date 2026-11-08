# Asset set, pack or brand kit

- **An asset for one game only doesn't go here.** It goes in that game home's `assets/<type>/<use>/<asset>/`
  (`games/CLAUDE.md`).
- **Library set** (reusable) → `assets/library/<category>/<set>/`:
  1. `new-from-template.ps1 -Template asset-set -Destination assets/library/<category>/<set> -Name <set> -Title "<Title>"`
  2. Fill in the card (`assets/CLAUDE.md`): origin, license, how to make it again, where it's used.
  
  Library sets don't get registry rows.
- **Pack** (the assets are the product: UGC items, a model pack) → `assets/packs/<name>/`:
  1. Use the `asset-set` template for the pack's card.
  2. Add type folders (`models/`, `textures/`, `marketing/`) as items arrive, one folder per item with `source/` and
     `export/`.
  
  Git is optional; heavy sources stay out of git. Register the pack with kind `asset-pack`.
- **Brand kit** → `assets/brands/<brand>/`: logo sources and exports, colors, fonts, and usage notes in a `README.md`.
