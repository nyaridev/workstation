# research/

Reports and analysis: market research (Roblox, Steam), business studies, tech comparisons, data analysis. One folder
per study, at `research/<yyyy-mm>-<topic>/`.

```
<yyyy-mm>-<topic>/
├─ report.md      the findings; frontmatter has `title` (and `date`)
├─ sources.md     every source, with its link and the date it was read
├─ data/          raw inputs as fetched or exported, never edited by hand
├─ scripts/       analysis code (model.py…) that turns data/ into the report's numbers
├─ plan.md        optional: the study's scope, questions and deliverables, written before the research
├─ playbook.md    optional: the agent guide that turns the findings into steps for the user's games
├─ notes/         optional: the raw research notes behind the report (one file per research track)
└─ appendix/      optional: long evidence the report links to (per-game breakdowns…)
```

- The report's numbers come from `scripts/` run over `data/`, so the study can be re-run.
- Mark estimates and assumptions as such, and keep facts separate from conclusions.
- Charts are either a fenced `ccu-chart` JSON block (the market-reports viewer renders it) or images in `img/`.
- Write in the language the user asked in. Polish studies may use Polish file names (`raport.md`, `dane/`).
