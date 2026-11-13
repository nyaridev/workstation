# Idea

Path: `ideas/<name>/`. First check that the idea doesn't already exist, in `ideas/` and the project files (`scan-projects.ps1 -Json`: each project's name, description and tags).

`new-from-template.ps1 -Template idea -Destination ideas/<name> -Name <name> -Title "<Title>"` writes one
`README.md`: the pitch, who it's for, why now, open questions. For a game idea, offer to add a `docs/` folder for
vision, gameplay and systems as the design grows.

Register the idea with kind `idea`, status `concept` and owner `null`.
