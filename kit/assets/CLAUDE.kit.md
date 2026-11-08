# assets/

Shared assets: what more than one project uses, what the user downloaded or bought, and assets that are products in
themselves. A game's own sources live in its game home (`games/CLAUDE.md`), not here.

| Folder | For |
|---|---|
| `library/<category>/<set>/` | Reusable sets: packs (Kenney, Sonniss…), AI-generated sets, sound libraries, fonts, Roblox model kits |
| `references/<topic>/` | Inspirations, GUI references, reference places. Never ships |
| `packs/<name>/` | Assets as the product: UGC collections, model or icon packs for sale. Same layout as a game's `assets/` |
| `brands/<brand>/` | Logos, colors and fonts per brand, one folder each |
| `_inbox/` | Drops waiting to be sorted |

Categories in `library/`, each made when its first set arrives: `icons/`, `images/`, `textures/`, `ui/`, `audio/`,
`models/`, `vfx/`, `fonts/`.

## Every set has a card

Each set is one folder, named in kebab-case (`icons/gamepad-prompts`), with a `README.md` card. The template is
`_meta/templates/asset-set/`. The card records:

- what's in the set, and the file layout;
- **origin**: who or what made it (user, agent and model, or a third party with its URL), and when;
- **license** (own, CC0, CC-BY, bought…) and any trademark limits;
- **how to make it again**: the script and its command, or the prompts;
- **where it's used**: projects, plus Roblox asset ids once uploaded.

Editable files go in `source/` and engine-ready files in `export/`, with `generate.py` next to them when a script makes
the set.

## Using a library asset

Copy the asset into the project's `assets/` (for games) or source tree (for apps), and note the set's path on the
copy's card. Never reference `assets/` from a project: projects must stand alone. When the original
changes, update the copies on purpose.

