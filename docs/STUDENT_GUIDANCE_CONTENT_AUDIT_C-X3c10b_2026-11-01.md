# Stage C-X3c10b | Data Lab inferential safeguards and results language

Date 1 November 2026. Continued from C-X3c10a, the Data Lab import-provenance audit. Reviewed the analysis configuration, statistical calculation and assumption functions in `assets/analytics.js`, the Setup, Run, History and Results Audit panels and handlers in `assets/data-lab-ui.js`, and the existing statistics tests. Compared methodological meaning with the audited Data Lab instructional guidance and the illustrative case of dish-level treatment assignment and seed-level measurements. Relevant external reference consulted: [SciPy Spearman documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.spearmanr.html), which cautions that asymptotic p-values can be inaccurate for smaller sample sizes and recommends permutation-based inference where appropriate.

## Source-supported findings

1. The independent-group and related inferential calculators previously accepted one row per seed while the method plan might specify one independent treatment unit per dish. A warning rendered *after calculation* did not protect the resulting p-value from pseudoreplication.
2. The statistical functions sometimes returned `{output: {error: ...}}`. The Data Lab interface tested only the top-level `error`, and therefore could display a failed calculation with a **Store analysis record** button.
3. The numeric conversion function removed all commas, including improperly grouped values such as `1,2`, incorrectly converting such strings to 12.
4. A selected “Three or more independent groups” analysis could proceed with only two groups. Welch ANOVA additionally filtered out groups with unsuitable size or zero observed variance, silently changing the comparison.
5. Spearman rank correlation borrowed a Pearson-style Fisher interval and a t-approximation p-value without indicating that these are unsuitable or inaccurate for many small-sample settings.
6. The Data Lab setup wording did not specify the wide, unit-level structure required by paired and repeated tests. History wording also assumed that the stored analysis had actually been prespecified.

## Implemented source corrections

- Added a guarded `runAnalysis` wrapper that refuses inferential tests when the recorded independent-study unit and data-row unit differ, or when the imported table contains more rows than the recorded independent-unit count. It explains that the laboratory does not implement clustered, hierarchical or repeated-row standard errors. Descriptive summaries remain available for exploration. Explicit import warnings about extra cells or unmatched quotes now block analysis until the original CSV is corrected.
- The wrapper now promotes nested calculator errors to top-level errors, so failed calculations follow the existing interface's error pathway rather than being offered for storage.
- Numeric parsing now recognises properly grouped thousands separators while rejecting malformed numeric strings. Zero remains a valid numeric value.
- The three-or-more-groups route checks that three observed groups exist. Welch ANOVA now stops when an intended group lacks enough observations or observed variance rather than dropping it silently. Classical ANOVA stops when residual variance cannot be estimated.
- Spearman reports the rank coefficient but withholds the asymptotic inferential p-value when fewer than 500 independent pairs are available and does not present the borrowed Pearson Fisher interval as a Spearman confidence interval. Large-sample p-values are explicitly labelled approximate; a separate caution points to suitable permutation inference.
- Student-facing data-analysis labels now describe matched observations as separate columns with one unit per row. Run guidance explains the limits of complete-case calculations and custom missing-value codes. Analysis-history and Results Audit prose distinguish prespecified from later analyses and emphasise uncertainty and limits on causal interpretation.

## Committed changes

- `assets/analytics.js`, inference guards, numeric parsing and Spearman reporting, commit [`3d57c38`](https://github.com/gmoon-code/research-methods/commit/3d57c3891e42f65e9059ce406f56e3b22efc5d34)
- `assets/data-lab-ui.js`, analysis-selection, unit and result-interpretation instructions, commit [`bbc868d`](https://github.com/gmoon-code/research-methods/commit/bbc868d4aa549da822a63036a0727d9f130e108f)
- New `tests/analytics-inference-integrity.test.js`, commit [`ed9ff41`](https://github.com/gmoon-code/research-methods/commit/ed9ff4168616b6022f830a6ce76054126878cbca)
- `assets/analytics.js`, preventing Welch ANOVA from dropping unsuitable groups and rejecting unestimable classical ANOVA, commit [`c723881`](https://github.com/gmoon-code/research-methods/commit/c723881354ad0fd1861b56e5f0e15ebcfb2c40b9)
- Extended `tests/analytics-inference-integrity.test.js` for ANOVA failures, commit [`95a164d`](https://github.com/gmoon-code/research-methods/commit/95a164d1e4104270abc6881dbd43f0d39c33a885)
- New `tests/data-analysis-guidance.test.js` for rendered study-unit, analysis-timing and uncertainty text, commit [`ad0a55b`](https://github.com/gmoon-code/research-methods/commit/ad0a55b1714cdb415766c8e05a8cd9858ed50ad3)

## Verification status and limits

- **Passed before the final ANOVA correction**: actual repository `tests/analytics.test.js` and the first committed version of `tests/analytics-inference-integrity.test.js`, executed in isolated V8 with a minimal Node bootstrap adapter. These covered numerical parsing, nested-unit blocking, independent-unit count mismatch, failed paired calculations and small-sample Spearman output.
- `assets/analytics.js` and `assets/data-lab-ui.js` passed JavaScript syntax parsing after the initial inference and prose changes. The additional ANOVA edits also passed `new Function` parsing before commit.
- A separate attempt to run the previous import-guidance test within the combined harness failed because a locally injected variable name conflicted with a test variable. This is **a harness issue**, not evidence of a failing production import function. That test passed in the previous stage with an appropriate adapter.
- **Not verified after the final ANOVA commit**: the expanded analytics-inference assertions, the new rendered guidance test and the full regression suite. The attempt to run the 13-test combined suite was blocked by the repository connector's per-turn call limit before test execution. Do **not** mark 13 tests as passed.
- **Not performed**: native Node CLI suite against a checked-out current repository, real browser interactions, saved-project persistence, statistical reference comparison for every supported test, or public-deployment parity.

## Outstanding scholarly and technical cautions

- The guard detects explicitly recorded mismatches and a row-count inconsistency. It cannot prove independence when unit metadata are absent or incorrect, detect every clustered identifier structure, or supply an appropriate multilevel, clustered or repeated-measures model. The interface now states that limitation.
- Current exploratory/descriptive counts describe imported rows, and should not be interpreted automatically as independent experimental replication.
- Study-specific missing codes (including numeric zero when configured as an absence code) and any exclusions remain dependent on student documentation and preparation. The calculator does not independently interpret every project-specific missingness convention.
- Spearman's small-sample p-value is withheld rather than replaced with a verified exact/permutation algorithm. This deliberate limitation should be revisited only when the implementation can be tested against recognised statistical software.
- Other statistical methods, output correctness in sparse samples, ANOVA effect-size interpretations and the full writing-export chain remain to be audited.
- Previously stored analyses made under the old guard are not automatically invalidated or recalculated; historical records require human review and explicit status labelling.
- The C-X3c10a Markdown ledger exists locally but was not committed to the academic-website repo before the connector limit. Neither this C-X3c10b ledger nor the prior ledger was committed to `gmoon-code/gmoon-code.github.io` in this turn.

## Exact next continuation point

**Stage C-X3c10b-verification, then C-X3c10c.** First commit the local C-X3c10a and C-X3c10b ledgers to `gmoon-code/gmoon-code.github.io/docs/`, checking that no versions have already been committed. Fetch the current `assets/analytics.js`, `assets/data-lab-ui.js`, `tests/analytics-inference-integrity.test.js`, `tests/data-analysis-guidance.test.js`, and all other focused regression tests. Run the expanded analytics and Data Lab UI tests, fix any assertions or source defects, and record exact results. Confirm that old outputs cannot be mistaken for analyses validated under the new rules. Then begin **C-X3c10c**, a separate, exhaustive audit of the remaining statistical test calculations, effect sizes, contingency methods, model assumptions, missingness reporting and exported Results wording. Continue to Writing Lab prose and then comprehensive system-wide content consistency and browser/deployed-site checks.

**Stage status:** Source corrections implemented; partially editorially and technically verified, with ANOVA and expanded cross-system tests still unverified. Overall website audit remains in progress.