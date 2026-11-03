# C-RV29bm | Academic Editor V2 remaining browser failures triaged

**Date:** 3 November 2026. **Continued from:** C-RV29bl. **Scope:** Last independently recorded academic-editor Chromium suite, [run 41593693042](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593693042), job `125776012453`, and current `tests/academic-editor-v2.spec.cjs` at blob `4f65cc472c1873d211138daca13617a8185235cb`.

## Browser evidence

The latest retrieved academic-editor workflow ran on source commit `c3da95e`, before the subsequent test-only source-multi and image-insertion corrections. Its decoded logs state **55 passed / 2 failed**.

1. **Unsaved live text during mode switching, reload and page navigation**, test lines **792–818**. The test hit its **30-second timeout** without a specific failing assertion in the saved job summary. The script has three distinct persistence moments: switch to design mode and back, force reload, then change pages and return. The log alone does not reveal which awaited UI action stalled. It would be inappropriate to declare any one of those interactions broken. Next diagnostic should instrument separate phases with explicit bounded states and retrieve a trace or per-step browser evidence.
2. **Text reflow and neighbouring paragraph position**, test lines **1128–1162**. After changing a heading's real box width to **150 px**, the test demanded that the neighbouring paragraph's `y` coordinate change by under **4 px**, but Chromium reported **14.84375 px**. The width itself successfully reached **150 px**. This is evidence of a real geometric discrepancy relative to the test contract; whether due to natural document flow, prior reserved height, or an implementation defect remains to be determined. Reproduce with heading and neighbour geometry before and after, reserved-height CSS and line counts. Do not weaken the tolerance without determining what the editor promises.

## Boundary

C-RV29bk and C-RV29bl have independently verified the overlapping source-multi primary and advanced suites at **51/51** and **55/55**, and the source-parity/live-object suite at **19/19**. These passes do not settle the two academic-editor failures. None of the academic tests or implementation was modified in C-RV29bm; this is a **source-and-log triage**, not a browser repair or a new run.

No academic website prose, research evidence or bibliography source tiers changed. The prior historical 16/16 static text-delivery check does not establish full browser visual or interactive parity.

## Exact next stage

**C-RV29bn | Diagnose live-text persistence timeout.** Begin with `tests/academic-editor-v2.spec.cjs:792–818`, inspect `saveLiveText()`, `setWorkspaceMode()` and `loadLivePage()`. Instrument the three persistence boundaries separately, collecting evidence of which action or assertion stalls. Only change production behaviour if a specific bug is verified and recheck in real Chromium. Leave the **14.84375 px reflow-neighbour displacement** for its separate follow-up.
