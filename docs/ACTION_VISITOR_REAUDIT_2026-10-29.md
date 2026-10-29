# Classroom action research | Stage R4 ongoing | 29 October 2026

## Scope and prior verified work
This is the next unfinished visitor-facing route after completed Research stages R1, R2, R3. The current page source was retrieved from GitHub (source blob `4aae1a7a233060129bc17e99f737b1f42f2b0e8a`) and compared against the 28 October editorial register. Do not repeat completed reviews or change academic findings without primary evidence.

## Stage R4.1 source review
- Current `research-action.html` has one H1, four in-page research jump destinations, a conceptual assessment-sequence figure, two wide evidence tables with preceding sideways-scroll hints, two de-identified paired-record examples, and retrospective questions expressly not evaluated as an intervention.
- Counts remain Unit 2 7/28, Unit 3 18/28 and Unit 4 25/28, with task-non-equivalence explicitly stated. The 21 below-complete Unit 2 responses split as 12 versus 9 reflections, with Unit 3 complete counts 10 versus 3 and below-complete counts 2 versus 6. Ten paired Unit 3 responses split 5/2/2/1. The table of patterns is distinct from the seven of ten reconstructions classified complete.
- Ethics and coder agreement statements remain present, along with observational and causal limits; the page avoids claiming the altered prompt measured a causal learning effect. These claims are *reported by the manuscript*, not independently certified against private source records in this stage.
- Both `.research-table-wrap` containers have `tabindex="0"`, explicit region labels, header scopes, table captions and correctly preceding hints.
- Existing CSS defines overflow-x and visible keyboard focus for wide tables; this alone does not certify working browser interaction or printer rendering.

## Repeatable real-browser audit established
- Added `scripts/audit-action-visitor.py` (commit `c086f1a4c8ec17587f1ae7a640afdb0cf8ddf0ad`) and `.github/workflows/audit-action-visitor.yml` (commit `25e2155d40359658c00fa81b9b20431779123e3c`). Tests 12 widths at 320–1440px, landmarks, anchors, both tables, focusable horizontal scroll, escaped/clipped text, light/dark screenshots, footer spacing measurement, an actual six? **unknown page-count** A4 export, text inclusion and PDF boundary geometry. A4 page count is dynamically measured rather than assumed.
- The job generates screenshots, paginated A4 page rasters, PDF, JSON findings and a source snapshot whether it passes or fails. This evidence is required before declaring R4 complete.
- **Current status: audit runner committed; no confirmed successful workflow or visual inspection yet.** Do not infer a pass merely from workflow creation. Fetch job output and inspect printed pages in the next continuation. Apply only scoped production corrections supported by the findings, rerun and update this record.

## Pending
- Obtain the GitHub Actions output and screenshots; evaluate both table keyboard behaviour, layout widths, dark theme, 100px target footer spacing, printed word flow and actual page-break quality.
- Independently compare original anonymised extracts and ethics/recoding details with original records if shared. This external evidence is not publicly verifiable from page HTML.
