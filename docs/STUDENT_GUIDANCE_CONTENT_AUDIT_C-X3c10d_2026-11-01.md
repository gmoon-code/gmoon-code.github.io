# Stage C-X3c10d | Missing values, complete-case denominators and Results export provenance

Date 1 November 2026. Continued from [C-X3c10c](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10c_2026-11-01.md). Reviewed the remaining data-value, descriptive-summary, analysis, missing-code and export text in `assets/analytics.js` and the Quality, Explore, Run, History, Results Audit and export sections of `assets/data-lab-ui.js`. Compared revisions with the already audited teaching guidance, dish-level assignment and nested seed observations, and with the established requirement to preserve source evidence and analytical decisions. **Source reviewed and targeted assertions executed in isolated V8. Not browser or live deployment verified.**

## Coverage and corrections

| Scope | Verified problem | Implemented correction |
|---|---|---|
| Study-specific missing codes | The editable missing-data rule was explanatory prose only. Numeric and categorical calculations generally dropped blank strings but could include documented sentinel codes such as `99` or `NA` as observed data | Added a separate explicit `analysis.missingTokens` field. Comma-separated, exact-match tokens are applied to a temporary calculation copy, not to the imported record. The prose rule remains descriptive and is never guessed into a numeric recoding |
| Legitimate zero | Zero can be a genuine numerical result, binary category or intentionally defined zero for a missing visible shoot | Zero/zero-decimal codes cannot silently be configured as missing. The calculator requires a documented correction to the analysis copy first; the imported zero is preserved |
| Data-quality interpretation | Blank-cell counts alone did not show how many configured missing tokens affected each column | The Quality panel now distinguishes blank, configured-missing and total omitted cells, and displays the declared missing tokens and import cautions. Identical-value rows remain investigation flags rather than automatic exclusions |
| Exploratory displays | Exploration used the original rows even when the formal calculator used revised missing-value conventions | The Explore panel now uses the same temporary prepared rows. Invalid zero coding produces an explanation before exploration |
| Complete-case reporting | Descriptive summaries, two-group tests, binary matched tests and some ANOVA routes lacked a usable record of the analysis-specific denominator | Added or displayed meaningful included counts, paired complete cases and omitted-row counts. McNemar now handles no discordant pairs with exact p = 1, distinguished in its summary. ANOVA, Fisher and Cochran outputs expose sample counts where applicable |
| Analysis-record provenance | A stored result could lose the missing-token setting, original estimand, source-file warnings and included/omitted denominators when later plans changed | Each new record retains the applied tokens, counts by column, rows used and omitted, the earlier estimand, original file metadata and available import notes |
| Writing/export content | Results document exported only a research question and neutral summaries, without sufficiently distinguishing historic calculations and the coding that generated them | Extracted a testable `resultsMarkdown(project)` function. Each saved analysis is documented with its calculation safeguard status, recorded estimand, source file, imported and analysed counts, missing-code decisions and source/assumption cautions. The Data Lab Word export now uses this source function; JSON export includes declared missing tokens |
| Historical and later-changed results | History treated any earlier safeguard flag as if it were verified under current checks; the Results Audit could show the newest stored result beside a later analysis choice or missing-code convention without warning | Older analyses are expressly labelled for renewed review. The audit identifies changed tokens, analysis structure or estimand, and calls the displayed calculation the **most recent stored analysis**, without asserting it was primary or prespecified |
| Small descriptive samples | Exploring a single numeric value could display an `SD=NaN` string | The display now says that the standard deviation is not estimable |

## Important methodological boundaries

- Missing-token matches are explicitly set by the student and apply across all selected imported columns. A token that is a valid category in one column must not be declared globally missing. The interface explains this. A future per-column coding scheme could remove that limitation.
- The analysis engine does not change the authoritative imported CSV or infer undocumented missingness rules. Neither the prose missing-data rule nor a declared token establishes that an exclusion is justified.
- `rows_not_used` reports rows outside the specific calculation. The number is **not** automatically interpretable as the number of missing observations, since grouping, nonnumeric values and incomplete pairs may also affect inclusion. The export separately records the count of cells reclassified by the explicit codes.
- The new record retains a snapshot of source metadata. Earlier records cannot be retroactively verified or reconstructed. Changing recorded choices does not make previous calculations prospective.
- The automatic engine still cannot independently verify missingness mechanisms, statistical independence, causal identification or external records.

## Implemented source and regression commits

Production source
- [`assets/analytics.js` initial explicit token handling](https://github.com/gmoon-code/research-methods/commit/1e299cb8f9f799a18abc3a7cba5872cc27b2979a)
- [Binary coding applied after missing-token conversion](https://github.com/gmoon-code/research-methods/commit/0b1297cbe96b78f8f3e6d1b3ef0df6a5821bf103)
- [Matched denominators and no-discordance McNemar](https://github.com/gmoon-code/research-methods/commit/1bae444997c4f9751d4e171ebaf2ddddf7c2cf3b)
- [Analysis-specific denominators](https://github.com/gmoon-code/research-methods/commit/c6bb42b47e506504b409a8a372ee99fc437e0031)
- [Estimand snapshot](https://github.com/gmoon-code/research-methods/commit/f9bf34833a20ccb902f1e8116de04c176b641030)
- [Complete Results export fields](https://github.com/gmoon-code/research-methods/commit/03e56165c058768a49273ccbcfa0f526f0b220f4)
- [`assets/data-lab-ui.js` missing-code controls and export routing](https://github.com/gmoon-code/research-methods/commit/6907a3ff4e58e7ac36fcd892b0e5fb23567cd9ba)
- [Historical and changed-analysis warnings](https://github.com/gmoon-code/research-methods/commit/f9ff5f13a749963decbc404f55bfd5fdd77f02c7)

Regression coverage
- [New actual-record/missing-code and export test](https://github.com/gmoon-code/research-methods/commit/981f35c6d4ac146e6e8037b74b571413c9ceb524)
- [Updated history/estimand test](https://github.com/gmoon-code/research-methods/commit/bd909bd6b3607712faf8d7df7ee98850c45a91d7)
- [Updated safeguard-version and rendered-audit test dependencies](https://github.com/gmoon-code/research-methods/commit/5330a335fae96a071694365f7f41df0b4ac7db24) and [follow-up](https://github.com/gmoon-code/research-methods/commit/6ea82f01ef0f609e55fd8dcf82d6e224ec2e8e58)
- [Added Quality/Explore input and export routing assertions](https://github.com/gmoon-code/research-methods/commit/567aed7d9b85d16ebcfa2850e9564728f3f87a93)

## Verification executed

Seven focused Data Lab suites passed against actual committed repository source, including `analytics.test.js`, `analytics-inference-integrity.test.js`, `analytics-contingency-provenance.test.js`, `analytics-reference-benchmarks.test.js`, new `analytics-missing-provenance.test.js`, `data-import-guidance.test.js` and `data-analysis-guidance.test.js`. The revised guidance tests were rerun separately after their final assertions were added and both passed. Nine additional Methods, PathCoach, Literature and student-help suites passed in a separate batch. **Thus 16 distinct targeted suites passed in isolated V8**, using the repository's test assertions and an adapted Node bootstrap. Source syntax parsed. Numerical reference benchmarks from C-X3c10c remain passing.

Audit verification corrected three initially failing checks. One revealed a real missing export field for per-analysis denominators and estimand, which was then implemented. The others arose from a stale safeguard-version assertion and an extracted HTML test missing its analysis dependency. All were resolved and rerun.

Compared the edited production files against their exact pre-stage Git blobs. `assets/analytics.js` moved from `aed44fe854147c1864877d2a3d925dfc9197218f` to `372ccdaa8c7f9dd268b556bfbd7c42cb8c79c3aa`. `assets/data-lab-ui.js` moved from `3da932ab72f9a4b79af6270a8732a830ad5d46bb` to `2c514add750514b060d35822409f0e98eacace94`. The changes are restricted to documented missingness, quality and exploration messages, relevant statistical outputs, record metadata and Results/history exports.

**Not executed:** native Node CLI across the repository, real browser form and download interactions, full end-to-end saved-project round trips, exhaustive statistical edge cases or published-site parity. A green source assertion is not a claim that those checks passed.

## Exact next continuation point

**Stage C-X3c10e | Remaining Data Lab exclusion and Results-export edge cases.** Audit how malformed numeric values that are not declared missing are excluded, column-specific missing codes and categorical denominators, empty/constant columns, dependent or repeated observations, the connection between descriptive and inferential runs, and the narrative wording of exported Results documents. Verify the absence of unsupported primary/pre-specified labels and check Word export behavior and saved-project snapshots with actual browser interaction when available. Preserve C-X3c10a–d. After completing remaining Data Lab source content, proceed to Writing Lab prose, references, citation integrity, cross-page consistency and final native Node/browser and published-site QA. Do not mark any of those later obligations complete without executing them.

**Stage status:** C-X3c10d is source-editorially corrected with tested model and rendered-output assertions. The larger content audit remains in progress.
