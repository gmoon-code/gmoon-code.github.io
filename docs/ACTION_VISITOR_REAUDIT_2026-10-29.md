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


## Stage R4.2 verified initial browser results and targeted fix
- Recorded first actual Chromium and A4 result in committed `docs/ACTION_VISITOR_LATEST_RESULTS.json`, run **40841452897**, head `c5d48c6`. The run failed **only** its PDF text-search assertion, not its 12 viewport screen assertions. All twelve widths passed no document-wide overflow, text clipping, broken anchors or table semantics. Both 620px-minimum tables had keyboard ArrowRight scrolling checked at 320px.
- The footer gap was measured as **100px for widths 320–700, 124px at 701, 128px at 768, 136px at 900, 143px at 1024, 150px at 1140 and 158px at 1440**. This is a genuine inconsistent desktop spacing defect. Scoped `#main.research-action-page` padding and immediately adjacent footer margin correction was committed in `174eb2a`, targeting 100px at all widths. Requires subsequent browser measurement.
- First real A4 export had **7 pages**, with word counts **305, 262, 300, 319, 307, 353, and only 14 on the final page**. All PDF words remained within physical page boundaries. Last-page orphans remain an open print issue.
- The first test searched for the exact single-line substring `Intermediate pathway still undeveloped`; rendered PDF extraction may introduce a newline. Test commit `2e368da` normalizes extracted whitespace and adds first/last page text previews so a true omission can be distinguished from extraction wrapping. Await its actual result.
- The page now requests the current audited visible-focus stylesheet `appearance.css?v=20261028-visible-focus` rather than a stale version query (`d722367`); research text unchanged.
- **R4 remains open** pending the post-change test, final printed-page layout corrections, dark-mode contrast and a successfully passing evidence run. This is a bounded visitor-facing review; it is not an independent validation of unavailable consent documents or student-source data.
