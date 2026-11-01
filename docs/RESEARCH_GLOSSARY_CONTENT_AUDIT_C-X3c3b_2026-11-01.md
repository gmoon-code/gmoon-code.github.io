# Stage C-X3c3b | Research glossary definitions 31–60

1 November 2026. Continued from [C-X3c3a, definitions 1–30](RESEARCH_GLOSSARY_CONTENT_AUDIT_C-X3c3a_2026-11-01.md). Examined all 30 entries in canonical `gmoon-code/research-methods/assets/student-guidance.js` order, comparing each sentence with the related research-methods curriculum, Rescue laboratory use, cross-path research questions and the established editorial style constraints.

## Exact coverage and disposition

| Number | Glossary term | Status |
|---|---|---|
| 31 | `generalization` | Corrected |
| 32 | `hypothesis` | Reviewed and retained |
| 33 | `identifier` | Corrected |
| 34 | `independent groups` | Corrected |
| 35 | `independent variable` | Reviewed and retained |
| 36 | `independence` | Reviewed and retained |
| 37 | `inference` | Reviewed and retained |
| 38 | `interquartile range` | Reviewed and retained |
| 39 | `interval estimate` | Corrected |
| 40 | `literature gap` | Corrected |
| 41 | `mean` | Reviewed and retained |
| 42 | `measurement validity` | Reviewed and retained |
| 43 | `median` | Reviewed and retained |
| 44 | `meta-analysis` | Corrected |
| 45 | `missing data` | Corrected |
| 46 | `moderator` | Reviewed and retained |
| 47 | `nominal` | Reviewed and retained |
| 48 | `null hypothesis` | Reviewed and retained |
| 49 | `numerical` | Corrected |
| 50 | `observational study` | Reviewed and retained |
| 51 | `observational unit` | Reviewed and retained |
| 52 | `operational definition` | Reviewed and retained |
| 53 | `ordinal` | Reviewed and retained |
| 54 | `outcome` | Reviewed and retained |
| 55 | `outlier` | Reviewed and retained |
| 56 | `paired data` | Reviewed and retained |
| 57 | `parameter` | Reviewed and retained |
| 58 | `p-value` | Corrected |
| 59 | `population` | Corrected |
| 60 | `predictor` | Corrected |

## Problems identified and warranted improvements

- **`generalization`**, key preserved for existing UI lookups, now uses Canadian `generalisation` in its definition and clarifies that transfer to other populations depends on selection, measurement and design, not simply group size.
- **`identifier`** now makes explicit that coded IDs allow linkage but do not automatically guarantee anonymity where re-identification is possible.
- **`independent groups`** now distinguishes distinct, unpaired units from within-unit repetition, matched pairs and classroom/dish clustering; distinct records do not guarantee independent observations.
- **`interval estimate`** now distinguishes an estimated interval for a target parameter from a range of individual recorded observations. This remains consistent with the newly revised confidence-interval definition in the first batch.
- **`literature gap`** now ties novelty or underexploration statements to a documented and appropriately scoped search. A brief exploratory scan cannot establish the absence of prior studies everywhere.
- **`meta-analysis`** now acknowledges that effect estimates must be meaningfully combinable, with attention to between-study heterogeneity, bias and dependence among estimates. Cross-checked with Cochrane Handbook Chapter 10, https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-10.
- **`missing data`** now distinguishes absent intended observations from true recorded zeroes and structurally inapplicable values, respecting the documented shoot-length examples and data dictionary.
- **`numerical`** now identifies why a category represented by digits is still categorical, preventing an arithmetic interpretation of nominal labels.
- **`p-value`** now describes a chosen test statistic under the specified null model and its assumptions, while rejecting the interpretation of a p-value as a probability that the null is true or as the effect's importance. Cross-checked against the American Statistical Association's statement, https://doi.org/10.1080/00031305.2016.1154108.
- **`population`** no longer states that every actual sample must be smaller than the target population. It distinguishes studying a subset from a census that attempts to include all defined units. See Australian Bureau of Statistics, https://www.abs.gov.au/statistics/understanding-statistics/statistical-terms-and-concepts/census-and-sample.
- **`predictor`** now accommodates measured and assigned model variables, while retaining the clearer distinction between observed exposure and manipulated treatment for student questions.

The other 19 definitions were retained after reading because their conceptual boundaries were already sound. No em dashes were introduced. Specific wording was preferred over routine stylistic alteration.

## Actual commits

- Reviewed glossary definitions: https://github.com/gmoon-code/research-methods/commit/e4aebe926012cc6badbe61ada9f6f4283d88b34e
- Small p-value syntax refinement: https://github.com/gmoon-code/research-methods/commit/e6f7409f209fe360c926133a2dc11c1a2a50e05c
- Added regression assertions: https://github.com/gmoon-code/research-methods/commit/494e2c7ea4801bb9504d73fa6fd568a812d99a0c
- Aligned p-value assertion with final wording: https://github.com/gmoon-code/research-methods/commit/a26298d3c0cc30de646974e84c5ff68d46c72909

## Verification and limitations

Re-fetched and parsed the current guidance and compared against the committed Stage C-X3c3a version. **Exactly 11 of entries 31–60 changed.** Entries 1–30 and 61–90 remain unchanged from that checkpoint. All non-glossary sections, including 113 field guides, 18 stage guides, 32 lab guides, mapped choices and metadata, remain unchanged. All terms referenced by the Rescue laboratory tabs continue to resolve. All 30 reviewed definitions remain nonempty and em-dash-free. New Node regression assertions were committed and their source text checked; **the Node test suite was not executed**. Live browser search and glossary interaction, storage and production parity are not verified.

## Current coverage and continuation

**Glossary definitions 1–60 of 90 individually source-editorially reviewed**. Stage C-X3c3b contains 11 justified corrections, with 19 entries retained.

**Next Stage C-X3c3c | Glossary definitions 61–90**, in stored object order, with a per-entry editorial and scientific review. Check every definition against corresponding curriculum terms, research methods, causal inference and the user's established writing rules, then commit justified corrections, compare against earlier checkpoints, check all references and save the next ledger.

After all 90 definitions, review each of the 113 student-guidance field entries and 18 stage guides, remaining novice-friction and supplementary help, cross-system and research-page content, and actually execute tests in a suitable runtime before claiming full verification.
