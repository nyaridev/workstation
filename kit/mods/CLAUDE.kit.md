# mods/

Mods for games the user doesn't own. Each target game gets one **mod home**, `mods/<target-game>/` (a plain folder), with
one repo per mod inside it.

```
mods/<target-game>/
├─ AGENTS.md  CLAUDE.md   engine and version(s), mod loader, install path, what's known
├─ _game/<version>/       vanilla copy for testing (or a note with the install path)
├─ _sdk/                  mod loader builds, dumps, generated headers, modding tools
├─ _saves/                save backups, dated
└─ <mod>/                 one git repo per mod: source, install script, README, dist/ for zips
```

## Rules

1. **`_game/` is read-only.** Never edit, patch or rename the vanilla copy; mods install through the loader. If a copy
   breaks, replace it with a fresh one.
2. **Never commit or share the game's files.** That means binaries, paks, extracted assets and dumps. Only the user's own
   code and assets go in a mod repo.
3. **Never break encryption or DRM.** No AES-key extraction and no unpacking encrypted paks. Learn from runtime dumps
   and the loader's own tools.
4. **Back up saves to `_saves/<date>/`** before testing anything that writes them.
5. Each mod's install script takes the game path as a parameter (or reads it from the mod home's `AGENTS.md`), links
   or copies the mod into the loader's folder, and can uninstall.
6. The mod home's `AGENTS.md` keeps its table current: game version tested, engine, loader and version, install path,
   dumps available.

Minecraft goes in `mods/minecraft/<mod-or-pack>/`. The MDK lives in each mod repo, so it needs no `_game/`. Content
packs (skins, maps, resource packs) count as mods too.
