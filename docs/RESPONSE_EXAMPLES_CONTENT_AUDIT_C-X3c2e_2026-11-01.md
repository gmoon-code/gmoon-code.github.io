# Stage C-X3c2e | Response examples 76–100 and cross-stage outcome reconciliation

1 November 2026. Continued from [C-X3c2d, entries 51–75](RESPONSE_EXAMPLES_CONTENT_AUDIT_C-X3c2d_2026-11-01.md). Individually reviewed **25 of 25** entries in this batch, following the canonical 113-entry order. All example response-shape declarations, model prose, expanded examples where present, explanations and corresponding Rescue and student-guide descriptions were compared.

## Per-entry audit status

| # | Field | Review outcome |
|---|---|---|
| 76 | `replication` | Reviewed, retained |
| 77 | `methodControls` | Reviewed, retained |
| 78 | `rowUnit` | Corrected |
| 79 | `columns` | Corrected |
| 80 | `missingRule` | Corrected |
| 81 | `exclusionRule` | Reviewed, retained |
| 82 | `analysisIntent` | Reviewed, retained |
| 83 | `rawLocation` | Reviewed, retained |
| 84 | `missingObserved` | Reviewed, retained |
| 85 | `errorsCorrections` | Reviewed, retained |
| 86 | `plots` | Corrected |
| 87 | `descriptives` | Corrected |
| 88 | `primaryEstimand` | Reviewed, retained |
| 89 | `analysisChoice` | Reviewed, retained |
| 90 | `assumptionChecks` | Reviewed, retained |
| 91 | `effectSizePlan` | Reviewed, retained |
| 92 | `multiplicity` | Reviewed, retained |
| 93 | `analysisSample` | Reviewed, retained |
| 94 | `result1` | Reviewed, retained |
| 95 | `result2` | Corrected |
| 96 | `unexpected` | Reviewed, retained |
| 97 | `resultsDraft` | Corrected |
| 98 | `directAnswer` | Corrected |
| 99 | `interpret1` | Reviewed, retained |
| 100 | `interpret2` | Corrected |

## Findings and justified changes

**A cross-section construct inconsistency emerged.** The illustrative protocol records whether a visible shoot is present and, if present, its measured length at Day 7. The older `columns` example instead named a binary `germinated` variable; `plots`, `descriptives`, `result2`, `resultsDraft` and `interpret2` subsequently described germination as though it had been defined and measured. Seed germination and visible-shoot emergence can be distinct developmental events. Consequently, the reporting materials now consistently refer to **visible-shoot presence** and **shoot length**, without representing their combination as a validated measure of germination.

This required a justified, narrowly documented cross-stage edit to the previously audited `operationalDefs` detailed example (entry 61). The revised language now defines the combined variable as a **visible-shoot-and-length outcome**, avoids redundantly asking for the same visible-shoot status twice, and does not suggest that the combined mean isolates growth after germination.

**Data table and missingness.** `rowUnit` now defines one seed's Day 7 record, including missingness status, while preserving the dish identifier. `columns` names `visible_shoot`, shoot length, observation status and missing reason. `missingRule` explicitly distinguishes a prespecified analytic zero for an observed seed with no visible shoot from an absent record. It avoids describing a zero code as a physical ruler measurement.

**Summaries and inference.** `plots` and `descriptives` now display actual independent dish-level outcomes and the secondary proportion with a visible shoot, without inventing germination rates. `result2` makes the secondary quantity conditional on being planned and on available evidence. `resultsDraft` reports visible-shoot status rather than germination and retains bracketed, explicitly unverified numerical placeholders. `directAnswer` now refers specifically to the predeclared 0 versus 100 mM primary contrast. `interpret2` explains what visible-shoot presence may and may not clarify about the combined mean, instead of claiming to have identified a developmental mechanism.

**Example completeness.** The `rowUnit` response was revised to one sentence of 21 words, consistent with the field's 3–25-word short-response expectation. The `resultsDraft` primary model was expanded from an approximately 45-word preview to a 144-word, self-contained illustrative Results passage within the stated 120–300-word range, while preserving its expanded model as additional support. No fabricated means, significance findings, confidence intervals or sample losses were introduced.

The other **16** entries were retained. They already distinguish independently assigned treatment units from nested observations, planned from actual samples, original data from corrections, and prespecified from exploratory analyses. Guidance on Welch's t-test is conditional on design and assumption checks, particularly given the illustrative six dishes per group; no claim of adequate power was made.

## Commits

- Data table, missingness and descriptive example alignment: https://github.com/gmoon-code/research-methods/commit/e2c3405debc950fe358db2be6cf0419d61d62397
- Secondary result, interpretation and cross-stage operational definitions: https://github.com/gmoon-code/research-methods/commit/8e1989ac96c63c0ddd16ca16ba136f14d69efc25
- Short-record and full Results example refinement: https://github.com/gmoon-code/research-methods/commit/7bac6c7e7e4afc597b68bea5053eaa5dad59f598
- Active response-example sync: https://github.com/gmoon-code/research-methods/commit/76e34b9dbbe44b1e21c4374cda6e2657f3a28b7d
- Targeted regression assertions: https://github.com/gmoon-code/research-methods/commit/0eb1810a4a065c497f5ccf0ff7634a6bc0e5a22c

## Verification and limitations

Re-fetched canonical and active models and compared parsed values; **deep equality passed**. All 25 entries match canonical Rescue field labels, types and stages and have applicable word lengths within stated ranges; none has an em dash. All 12 targeted source-content checks passed. Comparing with the prior checkpoint found exactly **nine changed fields among entries 76–100**, together with the justified revision to `operationalDefs` from entry 61. Every other entry from 1–75 and entries 101–113 remained unchanged. New regression test assertions have been committed, **but the Node test suite has not been executed**. Full real-browser behavior, authoring, persistence and production parity remain unverified.

## Status and exact continuation

**100/113 response examples individually editorially reviewed**, source-synchronised and inspected. The 25 reviewed in this stage contain nine corrected entries, with one cross-stage correction to entry 61; sixteen were retained.

**Next C-X3c2f | Entries 101–113**, the final 13 response examples in canonical order. Check every writing, limitation, abstract, citation and integrity entry in full, including expanded samples, style diversity and research provenance. Then complete the remaining supplementary glossary/guide/novice-friction prose and cross-system checks, followed by actual Node/browser/live-publication testing. Do not declare the entire website audit finished when 113/113 examples are complete.
