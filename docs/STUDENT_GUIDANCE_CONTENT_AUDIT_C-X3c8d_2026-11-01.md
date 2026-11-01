# Stage C-X3c8d | Historical search-log corrections, provenance and Literature Workspace export language

Date 1 November 2026. Continued from [C-X3c8c](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c8c_2026-11-01.md), with the same non-negotiable content standards for evidence integrity and the author's natural, careful academic voice. Inspected `assets/literature.js`, the Search Log and paragraph-outline portions of `assets/app.js`, existing guidance, search/synthesis records and the pertinent regression tests. Status: **source-editorially corrected and targeted tests executed in isolated JavaScript**. Not yet verified in a browser or against a deployed public version.

## Source coverage and findings

| Content or function | Previous issue | Implemented correction | Verification |
|---|---|---|---|
| Historical search-log entries | Incomplete older records could be viewed or deleted, but not corrected in place without replacing the original record | Added a correction section for each saved entry, with fields for prior search metadata, a required explanation and a viewable history of earlier values | Parsed, targeted test and static/rendered helper check passed |
| `reviseSearchLog` | No traceable method to preserve earlier values when a search record changed | Saves the corrected record and a dated snapshot of earlier fields, what changed and the stated reason. Rejects unchanged edits or a missing reason. Preserves unrelated legacy properties | Tests confirm two revisions, previous values, explanation, empty-reason rejection and no-change rejection |
| Execution confirmation | Editing a completed search could preserve confirmation even when the submitted query or reported results changed | Changing date, database, query, filters or result count clears the prior confirmation. Editing notes or screened/kept counts alone need not clear it | Tests confirm both cases |
| Unknown historical execution status | An absent confirmation field could be misrepresented as an explicit false decision in the revision history | Historical `true`, `false` and missing confirmation are preserved as distinct states; the correction-history export writes `not recorded` when no previous execution status was saved | Test checks a legacy record with no `executed` property |
| Search correction export | Main search-log CSV did not expose earlier corrected values and reasons | Added a separate `literature-search-corrections.csv` export while retaining the existing eight-column primary search-log CSV | Tests cover export content and audit-trail labels |
| Literature outline export | A source ID listed under “Supporting sources” was treated as evidence of support, even when the source was pending or excluded | Export now says “Linked source IDs (verify claim support)” and separately identifies pending, excluded or unknown IDs | Assertions passed for all status categories and repeated IDs |
| Paragraph connections | Outline export made a “Transition / implication” line appear necessary for every paragraph | Connection or implication appears in the export only when the author writes one. Related planner labels now ask what the paragraph develops and whether a connection is useful | Test confirms absent optional transition, source diff confirms revised labels |

The corrections follow the distinction established earlier between source-record existence, eligibility and independently checked claim support. Paragraph-planning language was adjusted to encourage genuine intellectual progression rather than mechanical connective sentences. No previously audited field-guide, glossary, laboratory text, stage summary or choice label was altered.

## Commits

- Historical revision model and separate CSV history, `assets/literature.js`: [752c17f](https://github.com/gmoon-code/research-methods/commit/752c17fb22e44c3bcd85c5e6cfc1549b79e31d8d)
- Correction entry and history display, CSV download actions, `assets/app.js`: [2e394ec](https://github.com/gmoon-code/research-methods/commit/2e394ecb4c85b874f2ae67d375ae6e8daa9fb4d2)
- Core correction/history regression tests: [d355749](https://github.com/gmoon-code/research-methods/commit/d355749f06f8f6c57252d3ab77aa3340a89bb7a4)
- Exported outline source-status qualifications: [d29c668](https://github.com/gmoon-code/research-methods/commit/d29c6684af2d8708b3c30085aec5106e6a2b91a7)
- Outline planner text: [2fa90b3](https://github.com/gmoon-code/research-methods/commit/2fa90b31a38c9021b3f00478122896c392ce493c)
- Outline-export regression tests: [089d745](https://github.com/gmoon-code/research-methods/commit/089d7454dec5a71c278c5248e7cd86647a7a522e)
- Search correction panel and provenance download regression test: [45adcb1](https://github.com/gmoon-code/research-methods/commit/45adcb12d564cb0e83e76589823fad230b20e460)
- Restore the distinction between absent confirmation and explicit false values: [3ae2a3f](https://github.com/gmoon-code/research-methods/commit/3ae2a3fd7bb20ff588cc19848b3de38e890776f0)
- Regression for missing historical execution status: [3722688](https://github.com/gmoon-code/research-methods/commit/37226881de49ddfeb4fc2f37bf7430fe666df618)

Current source blobs after these commits: `assets/literature.js` = `6a1fc59446591f5bbd5fe636908254a5cc605d04`; `assets/app.js` = `9ecaa7da5b2b389c7bfa4f26a8fbf3a3720b3200`.

## Scoped verification

Compared both edited source files against their immediate pre-stage Git blobs, examining the actual line-level changes. For `assets/literature.js`, all additions and replacements are confined to the search-log correction and revision export functions, exported outline source-status wording, and the public function list. For `assets/app.js`, changes are confined to the search-log correction form/controls, the search-log action handlers and the three paragraph-planning labels.

**Six targeted repository tests passed in an isolated V8 runtime**, including `tests/literature.test.js`, `tests/literature-search-provenance-ui.test.js`, `tests/student-guidance.test.js`, `tests/novice-friction-v26.test.js`, `tests/novice-guidance-v22.test.js` and `tests/student-help-guidance-content.test.js`. These ran against the fetched, committed source with the Node `require` and `global.window` bootstrapping adapted to the available execution environment. The correction-panel test examined generated example HTML, all seven field controls, a prior-revision detail and HTML escaping, plus the presence of save and export handlers. Six source assets parsed successfully.

**Not performed**: Native Node CLI tests; full DOM/browser interactions and keyboard workflows; end-to-end saved-project persistence round trips; testing compatibility with third-party scripts that expect older CSV schemas; public deployment parity.

## Residual limitations and uncertainties

1. Correction reasons and execution confirmations are student-authored records. They show what was recorded and attested, not independent proof that a database search was executed or its result count accurate.
2. Earlier projects may contain records lacking dates, filters, execution confirmation or source metadata. Corrections preserve their previous values but cannot reconstruct the actual historical search without external evidence.
3. The separate correction-history CSV identifies each record by its **current position** and current database/query. Source search records do not yet have immutable IDs. Record deletion or reordering can change positions in future exports, so the exported file should be interpreted with its parent search-log export and project version.
4. The existing Remove action still deletes a record and its embedded revision history unless the available Undo control is used. This stage addressed corrections, not an immutable deletion audit log.
5. Other Literature Workspace functions and the website as a whole have not completed browser or public-version checks. The new correction form is validated as generated content and via source-level tests, not by using a real browser.

## Exact next continuation point

**Stage C-X3c9a | Methods Lab source and diagnostic prose, first coherent section.** Inspect every substantive user-facing claim and help/feedback statement in `assets/methods.js` (particularly `designProfile`, `auditDesign`, `auditReplication`, `auditSampling` and `auditMeasurements`) and the corresponding Methods Lab text in `assets/app.js`, then compare with the audited `student-guidance.js` methods panels, `rescue-model-v2.5.json`, relevant curriculum stages and the approved evidence/unit examples. Distinguish assigned treatment units, sample/observation units, clustering, sampling mechanisms, construct validity and causal inference. Correct only evidence-supported issues, preserve completed work, add targeted tests and save a checkpoint. Follow with ethics/procedure/data/audit feedback in a second batch, then Data and Writing Lab messaging. Maintain runtime, browser and public-deployment verification as explicitly separate obligations.
