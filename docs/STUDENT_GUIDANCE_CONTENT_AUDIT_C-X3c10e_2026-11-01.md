# Stage C-X3c10e | Invalid numeric values and analytical column identity

Date 1 November 2026. Continued from [C-X3c10d](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10d_2026-11-01.md). The earlier stage addressed explicit missing tokens, complete-case denominators and export provenance. This stage audits the remaining numerical-value eligibility and selected-column logic in `assets/analytics.js` and the Run-panel language in `assets/data-lab-ui.js`. The user's established writing constraints and the source-level distinction between actual and proposed evidence were maintained.

## Coverage, verified findings and corrections

| Content | Verified issue | Implemented improvement |
|---|---|---|
| Numerical import into calculations | Before this stage, the `num` parser returned null for a nonblank invalid value such as `oops`; numerical calculations subsequently omitted it, even if it had never been declared missing or documented as excluded | The guarded analysis now checks every selected numerical column for nonblank, nonnumeric values remaining after explicit missing-code conversion. It reports the offending column and count and stops the numerical analysis until the source record is examined and corrected |
| Column identity | Correlation and matched-pair calculations could be configured with the same column as both variables. Group comparisons could use the outcome as the grouping column | The guard now requires distinct columns for paired measurements, correlations, categorical relationships, binary pairings, and independent group labels versus outcomes. Repeated binary occasions cannot reference one column twice |
| Student-facing Run instructions | The earlier wording said analyses use complete observations, without clearly distinguishing a declared missing code from an accidental nonnumeric entry | The Run panel now explains that blank values and explicitly configured missing tokens may be omitted, while unexpected nonnumeric values interrupt a numerical calculation. It reinforces the requirement to account for dependent or nested records in inferential analyses |

## Verification

The new `tests/analytics-invalid-numeric.test.js` uses an actual four-row example with one invalid numerical value. It checks that both descriptive and independent-group calculations reject an unclassified text value; that explicitly marking it missing produces three analysed numeric observations while preserving the original text; and that distinct columns are required for correlation, paired numerical analyses, group/outcome comparisons and repeated binary measures.

The existing `tests/data-analysis-guidance.test.js` was updated only to reflect the new, more accurate user-facing Run-panel explanation. An initial regression run passed seven of eight suites; the remaining failure was the old exact-phrase expectation in this test. After correcting that assertion, **all eight focused Data Lab suites passed**, including the previous statistical reference benchmarks, imported-data, missingness, sparse-table and provenance tests. Actual committed source and tests were executed in isolated V8 with the Node bootstrap adapted. JavaScript syntax parsing passed. Not a native Node CLI or browser run.

Production source after this stage
- `assets/analytics.js`  `5470aefe065972767b72572beab723528816d8c5`
- `assets/data-lab-ui.js`  `ca52c67241ea6869da3891619c5846ef0a89345f`

Commits
- [Numerical and column-identity guards](https://github.com/gmoon-code/research-methods/commit/a0a826518bde5d44699ac758c328ceb9c3faa25e)
- [New regression file](https://github.com/gmoon-code/research-methods/commit/bdd9eb67af551ac4e835210b3c740f6e18ee14a6)
- [Fixture adjustment and Run-panel wording](https://github.com/gmoon-code/research-methods/commit/eb30f08fa8b22177f9f839c50c7cc78ca7a57f27) and [UI text](https://github.com/gmoon-code/research-methods/commit/8e1646cd183c359eebed4092f81f9eada32abdf9)
- [Updated exact-language regression](https://github.com/gmoon-code/research-methods/commit/42abf9f67a5da7bce2ad35c7dc760c1b602d872d)

## Limitations and dependencies

- Rejecting an unrecognised number-like text value does not prove that the remaining valid numbers were measured correctly. Corrections should be documented against original records.
- The explicit missing-token mechanism is still global across columns, requiring the same text code to be missing wherever it appears. Column-specific coding and invalid-category handling need a separate review.
- The automatic tests cannot establish independence, appropriate missing-data mechanisms, causal identification, conformity to study eligibility criteria or validity of selected models.
- Browser form interaction, actual Word/JSON download behaviour, persistence round trips, native Node tests across the entire repository and live deployment parity are not verified.

## Exact next continuation point

**Stage C-X3c10f | Remaining Data Lab diagnostic and export wording review.** Audit every still-unreviewed user-facing Data Lab sentence and conditional output against the full analysis engine, including sparse categorical handling, unequal group sizes, constant or empty columns, assumption-note specificity, missing-data decisions and study-unit claims. Check the full Results Word and JSON export payloads against a stored historical and current example without assuming file-format or browser success. Implement only justified content and evidence-integrity corrections, run targeted tests and update the ledger. Then continue the Writing Lab and cross-page academic content audit. Keep native Node, browser and deployed-site verification as mandatory separate closing checks.

**Stage status:** source-editorial corrections and eight focused suites verified in isolated V8. Broader website audit incomplete.
