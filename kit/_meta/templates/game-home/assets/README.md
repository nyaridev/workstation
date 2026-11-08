# {{Title}} — assets

Sources and working files for {{Title}}: everything editable, plus the exports made from it. **Not in git.** This
folder is backed up with the game home. Rules: `games/CLAUDE.md` → Assets.

```
assets/
├─ _inbox/        drops, downloads and AI generations waiting to be sorted (never ships)
├─ _reference/    moodboards, inspirations, screenshots (never ships)
├─ _templates/    asset.yaml: copy it into each asset folder
├─ _tools/        export, sync and normalize scripts (when needed)
├─ <type>/<use>/<asset>/    ui, textures, models, vfx, audio, fonts: made when first needed
│     ├─ source/          editable: .psd, .blend, .kra, generator script, raw audio
│     ├─ export/          game-ready: .png, .glb, .ogg, .wav
│     └─ asset.yaml       the card: origin, license, how to remake it, where it's used, Roblox id
└─ marketing/     thumbnails, game icons, ads, trailers, store pages
```

Names inside asset folders are `snake_case`, after the asset (`oxygen_tank.psd`, `oxygen_tank.png`).
