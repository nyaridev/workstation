# emulators/

Server emulators for online games the user doesn't own: a server written from scratch that the game's own client connects
to, for study and local play. Each target game gets one **emulator home**, `emulators/<game>/` (a plain folder), with
one repo per emulator or game-specific tool.

```
emulators/<game>/
├─ AGENTS.md  CLAUDE.md   client version, protocol notes, where the reference data lives
├─ _game/<version>/       client copy for testing, read-only
├─ _sdk/                  packet logs, notes, tools, a patched client copy if one is needed
├─ _external/<owner>/<repo>/  other people's repos this home reads (community servers, data), optional
└─ <repo>/                one git repo per emulator or game-specific tool (extractors…)
```

## Rules

1. **`_game/` is read-only.** If the client needs a change to reach a local server, make it in a separate copy under
   `_sdk/` and note what changed in the home's `AGENTS.md`.
2. **Never commit or share the game's files:** client binaries, archives, map and `.dat` data, translations. Reference
   data cloned from other people's repos stays in its clone, in the home's `_external/` or in `external/`; the
   emulator reads it from a path in its local config, never from a copy in git. `_external/` clones follow
   `external/CLAUDE.md` (local branches only, never push) and are listed in the home's `AGENTS.md`.
3. **Reimplement, don't break in.** The emulator speaks the client's network protocol, as documented by public
   emulators and packet logs. No cracking DRM, no bypassing anti-cheat, no breaking encryption that protects them.
   Fixed file encodings (zlib, a constant XOR on text tables) are just formats and fine to decode for study.
4. **Local only.** Servers bind to `127.0.0.1` by default. Never connect to, scrape or impersonate the official servers,
   and never host an emulator publicly.
5. **Extracted assets** (from tools like an archive extractor) go in `_sdk/dumps/`, outside git, for study and
   local placeholders only: never shipped, shared or committed. One exception: a client repo may keep a working
   copy of the files it loads in its own git-ignored folder (such as `client/assets/game/`), made by a script
   from a list that says where each file comes from in a dump, so it can be rebuilt anywhere. The home's
   `AGENTS.md` names the folder, the script and the list.
6. The home's `AGENTS.md` keeps its table current: client version tested, protocol and cipher notes, data sources.
