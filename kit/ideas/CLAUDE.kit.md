# ideas/

Concepts and design with no code or engine yet. One idea = one folder, named in kebab-case. Before creating one,
search the project files (`scan-projects.ps1 -Json`: each project's name, description and tags) and this folder for the same idea under another name.

- Each idea starts as a `README.md` (from `_meta/templates/idea/`): the pitch, who it's for, why now, open questions.
- A game idea can grow a `docs/` folder (vision, gameplay, systems, world, art, tech), the same docs a game home keeps.

Docs end with `## Suggestions` and `## Open Questions`. Write the user's answers back as `## Decisions`.

When the user picks an engine or starts building, `/promote` moves the folder to its real home, with status
`prototyping`.
