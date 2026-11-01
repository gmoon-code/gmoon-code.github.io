# Stage C-X3c4d | Student guidance field entries 76–100

1 November 2026. Continued from [Stage C-X3c4c, methods entries 51–75](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c4c_2026-11-01.md). All 25 student-guide objects in this stage were read and checked against their previously audited field-level Rescue and response-example counterparts, the actual laboratory curriculum and the author's writing preferences.

| # | Student-guide field | Editorial decision |
|---|---|---|
| 76 | `replication` | Corrected |
| 77 | `methodControls` | Corrected |
| 78 | `rowUnit` | Corrected |
| 79 | `columns` | Corrected |
| 80 | `missingRule` | Corrected |
| 81 | `exclusionRule` | Reviewed and retained |
| 82 | `analysisIntent` | Corrected |
| 83 | `rawLocation` | Reviewed and retained |
| 84 | `missingObserved` | Reviewed and retained |
| 85 | `errorsCorrections` | Reviewed and retained |
| 86 | `plots` | Corrected |
| 87 | `descriptives` | Corrected |
| 88 | `primaryEstimand` | Corrected |
| 89 | `analysisChoice` | Corrected |
| 90 | `assumptionChecks` | Corrected |
| 91 | `effectSizePlan` | Corrected |
| 92 | `multiplicity` | Corrected |
| 93 | `analysisSample` | Corrected |
| 94 | `result1` | Corrected |
| 95 | `result2` | Corrected |
| 96 | `unexpected` | Reviewed and retained |
| 97 | `resultsDraft` | Corrected |
| 98 | `directAnswer` | Corrected |
| 99 | `interpret1` | Corrected |
| 100 | `interpret2` | Corrected |

## Methodological and editorial findings

**Independent units and data structure.** The `replication` example previously referred to nine dishes with two seeds per dish, contradicting the illustrative study's 18 independently assigned dishes and 90 nested seed observations. `methodControls` now specifies the actual planned randomisation and standardised procedures. `rowUnit` and `columns` now describe one Day 7 seed record with a dish identifier, a visible-shoot indicator, defined shoot length, recorded/missing status and missing reason rather than the obsolete `salinity_pct` or `germinated` columns. `missingRule` distinguishes an observed no-visible-shoot outcome coded as zero from missing evidence, noting that zeros used as analysis values are a prespecified convention rather than a physical ruler measurement.

**Estimand and analysis.** `analysisIntent` and `primaryEstimand` now name the dish-level mean difference between the 0 and 100 mM NaCl groups as the primary contrast. `analysisChoice` corrects an unrelated paired-t-test illustration to a conditional Welch independent-group comparison of dish means; its wording does not suggest the test is always appropriate with only six dishes per group. `assumptionChecks` explicitly examines independent assignment and the limited distribution information available from six independent units per group. `effectSizePlan` describes the raw mean difference in centimetres and uncertainty supported by the method, using Canadian `standardised`. `multiplicity` separates the prespecified contrast, descriptive 50 mM condition and any later exploratory comparisons.

**Results and interpretation.** `plots` and `descriptives` now plot and summarise dish-level outcomes and visible-shoot proportions with the correct denominator and independent-unit count. `analysisSample` distinguishes an actual count after missingness from the planned 18 dishes and 90 seed rows, without inventing observed values. `result1` is now an unfilled result template for the primary contrast. `result2` no longer claims that the actual experiment measured germination, using the defined visible-shoot outcome instead. `resultsDraft` now uses Canadian `Organise`, supports research-genre-specific qualitative Findings and discourages rigid or unsupported explanations. `directAnswer`, `interpret1` and `interpret2` now consistently distinguish recorded patterns from unmeasured physiological mechanisms, preserve interpretation uncertainty and identify what a separate shoot-length analysis would require. This is supported by plant-science evidence on differences between radicle and shoot emergence, https://www.cambridge.org/core/journals/weed-science/article/abs/interpreting-germination-results-based-on-differing-embryonic-emergence-criteria/7275DF289D02657CD2C20E2867E8425D.

**Preserved sound content.** The five retained fields (`exclusionRule`, `rawLocation`, `missingObserved`, `errorsCorrections`, `unexpected`) already properly distinguished documented corrections from arbitrary deletions, real data from hypothetical placeholders and uncertainty from 'no effect'. No unsupported rewording was introduced.

## Implemented commits

- Data structure, missingness and first analysis revisions: https://github.com/gmoon-code/research-methods/commit/a564a3303ac58920544d56f4ab85f09fddf50771
- Analysis method, Results and interpretation revisions: https://github.com/gmoon-code/research-methods/commit/8b99e326590fcf3434aff35d346d6224ddd14610
- Targeted student-guide content regression assertions: https://github.com/gmoon-code/research-methods/commit/2923756c7a8405c80a9ce8a623633f96d93137f7

## Verification and limitations

Re-fetched and parsed the changed source. Comparison with the previous stage confirmed **exactly 20 changed fields among entries 76–100**. Entries 1–75 and 101–113, the 90 glossary definitions, all 18 stage guides, lab guidance and choices remained unchanged. All 25 entries retain complete guidance fields free of em dashes and match their associated Rescue and response-example identifiers. Ten targeted content assertions matched the stored objects, and their corresponding assertions are committed in `tests/student-guidance.test.js`. **Node tests were not executed**; the isolated local terminal cannot resolve GitHub to fetch the repository. Real browser interaction, note persistence and deployed-publication parity remain open.

## Status and exact next stage

**Stage C-X3c4d source-editorially reviewed and verified for entries 76–100. Student field-guide coverage is now 100/113.**

**Stage C-X3c4e | Last 13 student-guidance field entries 101–113**, from `litCompare` through `finalEdits`. Review the complete Discussion, limitations, conclusion, abstract, citation and integrity help, especially unsupported literature comparisons, evidence status, mixed-methods representation, claim precision, the author's writing voice, and whether measured shoot emergence is mistakenly labelled germination. Preserve all earlier audited entries, verify current help keys and save the final 113/113 ledger.

Afterwards audit 18 stage guides, 32 student-guide laboratory text entries, novice-friction and supplementary help, and site-wide written and scholarly content. Node execution, browser interaction and deployment parity must be demonstrated before full website audit completion.
