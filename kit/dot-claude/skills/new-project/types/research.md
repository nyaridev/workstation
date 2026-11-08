# Research study

Path: `research/<yyyy-mm>-<topic>/`, using today's year and month.

1. `new-from-template.ps1 -Template research -Destination research/<yyyy-mm>-<topic> -Name <yyyy-mm>-<topic> -Title "<Title>"`
   This writes `report.md` (frontmatter and sections), `sources.md`, `data/README.md` and `scripts/`.
2. As you go, add every source to `sources.md`, raw data to `data/`, and analysis code to `scripts/`.
3. Git is optional; run `git init` if the user wants history. Register the study with kind `research` and owner `—`.
