# Stage C-X3c2d | Response examples 51–75, sentence-level editorial audit

1 November 2026. Continued from [C-X3c2c, response examples 26–50](RESPONSE_EXAMPLES_CONTENT_AUDIT_C-X3c2c_2026-11-01.md). This stage covers **every entry from 51 through 75** in the canonical `gmoon-code/research-methods/assets/response-examples-v2.11.json`, including expected response shape and length, weak and strong responses, expanded models where available, and explanations.

## Exact coverage

Compared the actual prose of each response example with its corresponding `rescue-model-v2.5.json` five-level field guidance and `student-guidance.js` explanations. Checked proposed-versus-completed status, experimental unit, causal inference, salinity mechanism, measured outcome, analysis unit and nesting, controls, sampling, privacy/authority, reproducibility, data missingness, Canadian English and the author's non-formulaic writing constraints.

| No. | Key | Editorial outcome |
|---|---|---|
| 51 | `designType` | Reviewed, retained |
| 52 | `designWhy` | Reviewed, retained |
| 53 | `comparisonStructure` | Reviewed, retained |
| 54 | `claimBoundary` | Reviewed, retained |
| 55 | `hypothesisNeeded` | Reviewed, retained |
| 56 | `researchHyp` | Corrected |
| 57 | `nullHyp` | Reviewed, retained |
| 58 | `hypReason` | Corrected |
| 59 | `predictorIV` | Corrected |
| 60 | `outcomeDV` | Corrected |
| 61 | `operationalDefs` | Corrected |
| 62 | `controlCondition` | Reviewed, retained |
| 63 | `controlledConditions` | Reviewed, retained |
| 64 | `confounders` | Reviewed, retained |
| 65 | `experimentalUnit` | Corrected |
| 66 | `population` | Reviewed, retained |
| 67 | `sample` | Reviewed, retained |
| 68 | `samplingMethod` | Reviewed, retained |
| 69 | `sampleLimits` | Reviewed, retained |
| 70 | `instrument` | Corrected |
| 71 | `measureQuality` | Corrected |
| 72 | `ethicsIssues` | Reviewed, retained |
| 73 | `ethicsPlan` | Reviewed, retained |
| 74 | `materials` | Reviewed, retained |
| 75 | `procedure` | Corrected |

## Main problems and revisions

**Misaligned scientific hypothesis.** The illustrative three-concentration radish experiment had a directional prediction across all concentrations while the planned primary null contrast compared 100 mM versus 0 mM NaCl. The `researchHyp` model now explicitly predicts the **primary 100 mM versus 0 mM contrast**, with other comparisons conditional on a separate secondary or trend plan. `hypReason` now names external water potential as a tentative physiological mechanism and makes clear that neither water potential nor ion responses are directly measured. The salinity and osmotic stress rationale is consistent with published reviews (e.g., https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2023.1241736/full). This is a hypothesis example, not an observed result or a report of a completed experiment.

**One response should not mix unrelated designs.** `predictorIV` previously combined assigned salinity treatments and an unrelated observational sleep study inside one student field response. The new model names the experimental factor and how dishes independently receive their assignments. Its explanation retains the distinction between manipulated and observed predictors without combining them in the answer.

**Measurement construct and missingness.** The seedling outcome intentionally averages shoot lengths across *all planted seeds*, assigning 0 cm to a seed without a visible shoot. This is a defined combined germination-and-growth outcome, not a pure measure of post-germination shoot growth. Earlier model text could conflate no visible shoot with an unobserved record. `outcomeDV`, `operationalDefs` (short and detailed), `experimentalUnit` (detailed) and `procedure` (short and detailed) now make the missing-versus-zero distinction explicit, retain seed- and dish-level IDs and preserve the independently assigned dish as the treatment unit. The interpretation reflects guidance on experimental units and pseudoreplication (NC3Rs https://nc3rs.org.uk/3rs-resources/tackling-experimental-design-your-funding-proposal; ARRIVE https://arriveguidelines.org/arrive-guidelines/study-design/1b/explanation).

**Measurement-quality example was not measuring the model outcome.** `instrument` previously discussed a balance and mass, while the running protocol's actual outcome was ruler-measured shoot length. `instrument` and `measureQuality` now show the actual ruler, measurement landmarks, repeatability checks, ambiguous-shoot scoring and the boundary between reliable measurement and construct interpretation. Scale resolution is not assumed to demonstrate accuracy.

**Incomplete short protocol illustration.** The `procedure` good-response preview was 35 words despite its stated 120–250-word procedure range. The revised primary model contains 141 words and can function independently as a chronological procedure. The extended 176-word example adds specification, supervision and a pre-study precision check without inventing a power justification. Both distinguish unobserved data from a prespecified outcome zero.

**Ethics and sampling examined and retained.** The existing `ethicsIssues`, `ethicsPlan`, `samplingMethod`, `sample` and `sampleLimits` models distinguish permissions from access, consent from class membership, and planned from recruited participants. These protections are consistent with guidance on voluntary student participation and undue influence, e.g. https://www.hhs.gov/ohrp/regulations-and-policy/guidance/faq/informed-consent/index.html. This source is a methodological reference, not a claim that US human-subject regulations govern every school research setting. The existing conditional wording appropriately requires the actual local authority and approval route to be checked; no unsupported jurisdiction-specific requirement was inserted.

**Editorial restraint.** Sixteen entries were left unchanged after review. Strong models retained the original author's intended precision and controlled hypothetical framing.

## Commits

- Research-hypothesis, predictor and outcome corrections: https://github.com/gmoon-code/research-methods/commit/54278ff1b68ca712b842a0f1a279cd8697011611
- Physiology rationale and measurement quality: https://github.com/gmoon-code/research-methods/commit/9de04c2778ef10d11e368cc67c55e33abe797976
- Operational definitions and unit records: https://github.com/gmoon-code/research-methods/commit/241952e7afed21863e37617644159b8eaab2c50a
- Completed protocol example: https://github.com/gmoon-code/research-methods/commit/675b78893da65d83a42a4d84eb98fea7fae33d7b
- Active response-example model synchronisation: https://github.com/gmoon-code/research-methods/commit/22f2d85807ce728ba3db9c15d7fa215525e84ab6
- Additional targeted regression assertions: https://github.com/gmoon-code/research-methods/commit/837e4f5b90a533f0c18b17a1e28f1b2556b7a8eb

## Verification and limits

Re-fetched the canonical 113-entry model, active runtime, Rescue model, student guidance and tests. Deep model equality passed. All 25 entries have matching field IDs, stages, types and labels; their short model responses remain within the specified word ranges, including the expanded primary procedure. All are free of em dashes. Exactly **nine entries in this batch** changed when compared with the preceding checkpoint. Entries 1–50 and 76–113 are unchanged. New content regression assertions were committed, and their key test conditions were checked against the parsed source content in the connector execution environment.

**Node package tests were not executed.** Full browser rendering, data persistence and deployed publication parity remain unresolved. The hypothetical radish study is for instruction and is not externally validated empirical work; the illustrative sample of six dishes per condition is not represented as adequately powered.

## Status and continuation

**Entries 51–75 of 113 individually reviewed, nine corrected and synchronised. Total individually reviewed: 75/113.**

**Next exact stage: C-X3c2e, response examples 76–100**, beginning with `replication` in canonical order. After that inspect entries 101–113, then remaining supplementary guidance and full cross-page, Node/browser and live-publication verification. Preserve all completed entries and keep unrun tests explicitly unresolved.
