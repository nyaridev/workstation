# Workstation

A desktop app that keeps an eye on your **WORKSTATION**: one folder that holds every project you have (games, apps,
tools, mods, ideas, research), each in a predictable place. Workstation lists them all, flags the ones missing from
your `PROJECTS.md` registry, and updates live as projects are added, moved or removed.

> Work in progress. The first usable version lists projects and watches for changes.

## The layout it expects

```
WORKSTATION/
├─ PROJECTS.md          the registry: one row per project
├─ AGENTS.md            where things go, for you and your AI agents
├─ games/<engine>/<game>/
├─ apps/web|desktop|bots/<name>/
├─ tools/<name>/
├─ frameworks/<name>/
├─ mods/<target-game>/   emulators/<game>/
├─ assets/  ideas/  research/  external/<owner>/<repo>/
├─ sandbox/  archive/
└─ _meta/  _toolchains/  _cache/
```

Don't have one yet? The app will set it up for you in an empty folder of your choice, without touching anything that's
already there.

## Several workstations

Add as many as you like (work and personal, or one per person on a shared PC) and switch between them in the app.

## Run from source

Needs Node 22.18+, pnpm and Rust. Clone into your workstation as `apps/desktop/workstation`, then:

| Do              | To                                         |
| --------------- | ------------------------------------------ |
| `start-dev.bat` | run it with hot reload                     |
| `build.bat`     | build a portable `release\Workstation.exe` |
