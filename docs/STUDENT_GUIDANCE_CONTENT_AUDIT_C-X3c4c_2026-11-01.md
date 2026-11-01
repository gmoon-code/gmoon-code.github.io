# Stage C-X3c4c | Student guidance entries 51–75, research design and methods

1 November 2026. Continued from [C-X3c4b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c4b_2026-11-01.md) in the academic website's exhaustive written-content audit. This is the **individual scholarly and editorial** review of each student-guidance field object's `meaning`, `write`, `example`, `questions` and `avoid`, checking the corresponding Rescue five-level model, corrected response examples and surrounding curriculum.

## Field-by-field coverage

| Entry | Field | Outcome |
|---|---|---|
| 51 | `designType` | Corrected and source-checked |
| 52 | `designWhy` | Reviewed and retained |
| 53 | `comparisonStructure` | Corrected and source-checked |
| 54 | `claimBoundary` | Corrected and source-checked |
| 55 | `hypothesisNeeded` | Corrected and source-checked |
| 56 | `researchHyp` | Corrected and source-checked |
| 57 | `nullHyp` | Reviewed and retained |
| 58 | `hypReason` | Corrected and source-checked |
| 59 | `predictorIV` | Reviewed and retained |
| 60 | `outcomeDV` | Corrected and source-checked |
| 61 | `operationalDefs` | Corrected and source-checked |
| 62 | `controlCondition` | Corrected and source-checked |
| 63 | `controlledConditions` | Corrected and source-checked |
| 64 | `confounders` | Reviewed and retained |
| 65 | `experimentalUnit` | Corrected and source-checked |
| 66 | `population` | Corrected and source-checked |
| 67 | `sample` | Corrected and source-checked |
| 68 | `samplingMethod` | Reviewed and retained |
| 69 | `sampleLimits` | Corrected and source-checked |
| 70 | `instrument` | Corrected and source-checked |
| 71 | `measureQuality` | Corrected and source-checked |
| 72 | `ethicsIssues` | Reviewed and retained |
| 73 | `ethicsPlan` | Reviewed and retained |
| 74 | `materials` | Corrected and source-checked |
| 75 | `procedure` | Corrected and source-checked |

## Methodological and editorial findings and changes

**Design, independent units and hypotheses.** `designType` now gives the actual selectable `Correlational / observational` category rather than a non-menu description; `comparisonStructure` identifies independently assigned dishes, nested seed observations, matched student records and qualitative evidence without reducing all designs to independent experimental groups. `claimBoundary` now asks about limits for qualitative and review-based conclusions as well as significance-based numerical interpretations. `hypothesisNeeded` no longer suggests every suitable prespecified prediction must belong to a confirmatory quantitative project. `researchHyp` now matches the 100 versus 0 mM primary contrast of the canonical response model; `hypReason` distinguishes proposed physiological mechanisms and literature still to be checked from mechanisms directly observed. `experimentalUnit` now identifies the **18 assigned dishes**, not their five nested seed observations, as the experiment's treatment units and accommodates nonexperimental, qualitative and synthesis evidence structures. The distinction is supported by ARRIVE explanation https://arriveguidelines.org/arrive-guidelines/study-design/1b/explanation and plant-science pseudoreplication guidance https://academic.oup.com/jxb/article/72/15/5270/6329731.

**Outcome construct and reproducibility.** `outcomeDV` and `operationalDefs` previously used a Day 0-to-Day 7 change or radicle-emergence germination as their example while the canonical illustrative study actually records **Day 7 visible-shoot status and shoot length**. The revisions now name the combined outcome and its dish-level aggregation and distinguish an observed zero for no visible shoot from a truly missing record. These distinctions respect literature on the need to define radicle versus shoot emergence accurately, https://www.cambridge.org/core/journals/weed-science/article/abs/interpreting-germination-results-based-on-differing-embryonic-emergence-criteria/7275DF289D02657CD2C20E2867E8425D. `controlCondition` now names 0 mM NaCl, `controlledConditions` lists the actual common procedures and uses Canadian `standardised`. `instrument` and `measureQuality` now use the shoot-length ruler, landmark consistency, repeat readings and the construct-validity caveat, replacing an unrelated balance-and-mass example.

**Sampling and ethics.** `population` now distinguishes the intended population from the available class frame. `sample` explicitly separates planned or eligible units from those actually participating and records the difference between 18 treated dishes and their 90 potential nested seed records. `sampleLimits` explains the mechanism limiting `generalisation` in Canadian English. Existing `samplingMethod`, `ethicsIssues` and `ethicsPlan` were retained after examining their cautions about convenience sampling, voluntary participation, teacher authority, institutional review, coded identifiers and consent. No jurisdiction-specific ethics rule was invented or substituted.

**Materials and chronology.** `materials` previously specified nine dishes and 18 seeds, contradicting the revised, hypothetical 18-dish study. It now identifies 18 dishes, 90 radish seeds and the instrument and solutions used by the actual model. The `procedure` help now names the independent assignment, nesting, observation time, separate visible-shoot codes, missing-value handling and deviation log. The revised example is prospective and does not imply a completed or adequately powered experiment.

**Editorial restraint.** Seven fields remained unchanged because their existing text was accurate and coherent. The other eighteen entries were revised for concrete consistency, scientific precision, inclusiveness across study types or authorial Canadian English, avoiding gratuitous rewriting.

## Source commits

- Design and conceptual guidance revisions: https://github.com/gmoon-code/research-methods/commit/fd9c777a1dd793454b8afbede897636b39ee9660
- Sampling, measurement, materials and procedure guidance: https://github.com/gmoon-code/research-methods/commit/4f0a5f8976cfe6ea7ca301a14390988830bbe908
- Targeted content regression assertions: https://github.com/gmoon-code/research-methods/commit/9bbfab467a1ae0200cddfb6595b6e90c1d8422c1

## Verification

Read back and parsed the latest `assets/student-guidance.js`; compared against the previous C-X3c4b commit. **Exactly 18 of fields 51–75 changed**. Fields 1–50 and 76–113, all 90 glossary definitions, all 18 stage objects, all 32 laboratory guides and mapped choices were preserved. All reviewed fields retain complete meaningful properties without em dashes; their keys resolve in the canonical Rescue and response-example sources, and laboratory glossary references remain valid. Twelve explicit content assertions were checked against current parsed values and passed. The corresponding checks were added to the repository's Node test file, but **the test suite itself has not been executed**. A local Node interpreter is installed, but the isolated execution environment cannot resolve github.com to fetch the repository. Browser behaviour, form persistence and deployed-site parity remain unverified.

## Status and continuation

**Student guidance individual editorial audit 75/113 complete**, with 18 changes in this third batch. The 90-definition glossary and earlier audited Rescue/laboratory/response-example content remain preserved.

**Exact next checkpoint Stage C-X3c4d | Student guidance entries 76–100**, beginning with `replication` and ending with `interpret2`. Review all field properties in connection with the actual data rows, analysis units, missingness decisions, inferential uncertainty, Results writing and interpretation. Make and verify only warranted corrections, preserve other entries and save the next ledger. Follow with entries 101–113, then 18 stage guides, lab-specific student-guide summaries, novice/help text and full cross-page, Node/browser and deployed parity verification. Do not claim site-wide audit completion or executed tests in advance.
