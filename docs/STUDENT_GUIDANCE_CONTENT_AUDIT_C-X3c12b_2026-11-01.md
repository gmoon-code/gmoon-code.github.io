# Stage C-X3c12b | Live Methods labels, evidence-record descriptions and protocol-versioning content

Date 1 November 2026. Continued directly from [C-X3c12a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12a_2026-11-01.md). Stage C-X3c12a reconciled the curriculum, Student Guide, canonical and live Rescue, Methods, Data and Writing Labs. This stage examines whether the **actual on-page Methods workspace** and Path Coach still display inconsistent terminology. The task is content and methodological meaning, not cosmetic UI, layout or design.

## Coverage and source inspection

Inspected substantive strings and relevant rendering functions in `assets/app.js`, `assets/path-coach.js` and `assets/path-coach-model.js`. Performed targeted searches for the same outdated meanings in `assets/pathway-ui.js`, `assets/rescue-ui.js`, `assets/student-guidance-ui.js`, `assets/student-help-ui.js`, `assets/novice-friction.js` and `assets/pathways.js`. Those additional modules did not show matches for the specifically searched older sample, protocol-locking, unit or missingness phrases; **this targeted scan does not constitute a complete sentence-by-sentence review of their other text**.

Read and executed the actual `methodsSamplingTab`, `methodsDataTab` and `methodsAuditTab` source blocks using representative unfilled project data and a historical protocol version with an invalid timestamp. Also reviewed the Methods Workspace field labels, protocol save action and Path Coach's common field-label mapping.

## Verified inconsistencies and corrections

| Source and content | Problem demonstrated | Correction implemented |
|---|---|---|
| Methods sampling substep | The subtitle said `Target population/system, accessible frame, and actual sample/corpus`, contradicting its own `Planned or actual sample / corpus` entry and the updated curriculum | The subtitle now refers to the planned or observed sample/corpus, clearly distinguishing access from completed sampling |
| Methods data-record label | `What ONE row represents` assumed that the evidence must be tabular, despite the audited qualitative pathway's support for interviews, documents and other traceable records | The prompt now asks what one data row **or evidence record** represents. The panel describes the use of relevant identifiers to preserve nesting and evidence provenance |
| Methods missing-value documentation | The schema dictionary offered a missing-code field, but the panel did not explicitly say that this description did not configure the statistical calculator | Added precise text that codes recorded in the dictionary document coding intentions and that applicable tokens must be entered separately in the Data Lab before calculation |
| Qualitative evidence entry | The tab title said `Data table` and the empty state said only `No columns defined`, which could suggest a failed or incomplete qualitative method even where a non-tabular record system was appropriate | The heading/tab and empty-state text now recognise evidence records and explain how non-tabular records can still be documented through type and identifiers |
| Methods audit status | The summary counted `items to fix before collection` even for studies with already completed evidence collection | It now identifies critical issues requiring attention without falsely positioning the project as necessarily prospective |
| Protocol history/status | The panel still called saved versions `locked` and the tab `Audit & lock`, although the action now saves a dated protocol version and this cannot grant approval | The panel calls them saved versions and labels the tab `Audit & version`. The save-blocking message specifically states that recording a version is not research approval |
| Historical protocol date | An older snapshot lacking a usable `lockedAt` could render `Invalid Date` | The display now says `Date not recorded` when a valid timestamp is unavailable |
| Path Coach | Its shared sample label described only an `actual sample/corpus/included set`, despite use by proposed empirical studies, qualitative inquiries and reviews | It now describes planned or actual samples/corpora and reviewed and included studies without collapsing these statuses |
| Compatibility with historical diagnostics | An existing Path Coach exception contains the older exact diagnostic phrase `Actual sample missing` as one of two legacy messages it recognises | **Retained deliberately** as a backward-compatible recognition pattern. It is not displayed as a new instruction and should not be removed solely for string consistency |

No previously verified research evidence, canonical example data, sample counts or student writing was altered. Field IDs and saved values remain unchanged.

## Source commits

- [Methods sampling, evidence records and protocol-version labels](https://github.com/gmoon-code/research-methods/commit/04fbc42f37f75217216449adcc3375d6b93ded52)
- [Path Coach sample status label](https://github.com/gmoon-code/research-methods/commit/98d4dbd766f7ab0e45fc4c8a49d9c8fc56cdf63f)
- [Methods evidence-record tab and no-columns explanation](https://github.com/gmoon-code/research-methods/commit/8ce79d0ef5ea4be1d51453b0b70d5c15ae7eb627)

Regression commits:
- [New rendered Methods and Path Coach content test](https://github.com/gmoon-code/research-methods/commit/85de3119420c6b8037035499b1f169bbd617cfc8)
- [Extract the parameterised Methods Workspace accurately](https://github.com/gmoon-code/research-methods/commit/7a4d7bb6f8b57d686ba3b4fbfc8947cceb50ac84)
- [Use the displayed label, not the internal field ID, in the test helper](https://github.com/gmoon-code/research-methods/commit/e536921ae84db3246a93669eddf51ae759d522c5)
- [Verify evidence-record tab and empty state](https://github.com/gmoon-code/research-methods/commit/0fcb4530b9019591790332dcd176d15f34d6c71f)

Final source blobs:
- `assets/app.js` `a3f8191d20643d11d181718b21ae31359214a910`
- `assets/path-coach.js` `9babe8eddde255e459c4e7952ccd103e51537467`

## Verification executed

**Five of five relevant regression suites passed** against the final committed source, in an isolated V8 environment using the actual repository assertions and an adapted Node/filesystem bootstrap.

1. `tests/cross-system-live-labels.test.js`
2. `tests/methods.test.js`
3. `tests/methods-pathway-integrity.test.js`
4. `tests/path-coach-v24.test.js`
5. `tests/literature-search-provenance-ui.test.js`

The new suite extracts and executes the original three on-page Methods panel functions with a representative project; it verifies the displayed planned/observed sample wording, row/evidence-record meaning, explicit Data Lab missing-code configuration, lack of mandatory spreadsheet columns for qualitative records, protocol-version labels, invalid historical dates and Path Coach's sample description. The modified production sources passed JavaScript syntax parsing.

The initial panel-extraction test failed because its function boundary assumed the next function took zero arguments. After correcting the boundary, an assertion still failed because the mock `mInput` helper displayed an internal field ID rather than the actual label argument. Both test-harness defects were corrected, and **all five suites were rerun successfully** against the final source. Neither failure was represented as a production content issue.

Previous C-X3c12a canonical and live Rescue parity and eight-suite cross-system checks remain documented in that prior ledger. This stage does not duplicate those tests or claim renewed whole-site validation.

## Remaining uncertainties and limitations

- Tests executed actual panel markup generators and source guards, **not** a complete DOM/browser session. They do not establish the correctness of all interactive input/save events, persisted project migrations or public deployment content.
- The student can still write an inaccurate sample description, misidentify an independent unit or enter a missing code inappropriate for a given column. The application cannot automatically verify empirical evidence, permissions or exact implementation.
- Additional dynamic prose may be produced by other modules or path-specific overrides not covered by this phrase-led inspection. Each needs its own methodologically grounded audit.
- Native Node CLI and Python/static tests, browser-based workflow, Word/JSON file generation, and deployment parity remain unverified at the whole-project level.
- The full academic website contains additional research, teaching, biography and other pages requiring the broader sentence-by-sentence scholarly/content audit described in the user's master prompt.

## Exact next continuation point

**Stage C-X3c12c | Remaining cross-system claim boundaries and evidence provenance.** Examine substantive dynamic copy across the full research-methods workflows, especially Path Coach status labels, study-specific analysis routes, saved versus actual sample claims, historical analyses and the Writing Lab's unconfirmed/proposal/completed manuscript pathways. Review other live rendered content not captured by the phrase-based search, trace each claim back to curriculum and the canonical models, and check consecutive paragraphs for the user's natural cohesive style. Make targeted justified corrections, add tests and save a ledger. Then progress to remaining academic website pages and final native Node, actual browser and deployed-site parity checks. Do not mark the comprehensive audit complete on the basis of this module-level coverage.

**Stage status:** C-X3c12b source-level content consistency editorially verified for the named rendered Methods/Path Coach panels. Five targeted suites passed; complete website content audit remains in progress.
