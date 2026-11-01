# Stage C-X3c10c | Remaining statistical calculations, binary coding, source provenance and historical outputs

Date 1 November 2026. Continued from [C-X3c10b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10b_2026-11-01.md), whose previously unexecuted expanded Data Lab suites were rerun at this turn's outset. The prior C-X3c10a and C-X3c10b ledgers were recovered verbatim from their conversation attachments and committed to this website repository as [C-X3c10a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10a_2026-11-01.md) and [C-X3c10b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10b_2026-11-01.md).

## Audited coverage

Inspected `assets/analytics.js` statistical calculations, especially sparse contingency tables, Fisher's exact test, paired/repeated binary coding, classical and Welch ANOVA, the calculation guard, and analysis-record provenance. Reviewed `assets/data-lab-ui.js` History, Results Audit and JSON export wording against the established guidance on statistical independence, transparent timing of decisions and defensible interpretation. Compared selected numeric outputs with **SciPy 1.17.0** and **statsmodels 0.14.6**, executed in the local Python environment, rather than trusting in-repository assertions alone.

Relevant public statistical documentation consulted: [SciPy chi2_contingency](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chi2_contingency.html) warns that small expected counts undermine ordinary asymptotic tests and provides exact/resampling alternatives. [SciPy spearmanr](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.spearmanr.html) cautions that the asymptotic p-value is accurate only for very large samples and recommends permutation inference for smaller samples. These references support the cautious calculations and warnings, but do not validate all research designs or input structures.

## Findings and source corrections

| Component | Substantive problem | Corrective action |
|---|---|---|
| Chi-square independence test | The engine previously computed asymptotic p-values despite expected cell frequencies below 5. The downstream display warned *after* calculation and allowed the analysis to be stored | The direct chi-square function now returns a meaningful error when any expected cell is below 5. For 2 × 2 tables the message directs the student to the available Fisher exact route, while larger sparse tables require an appropriate external exact or resampling procedure. Existing well-populated-table calculations are preserved |
| Paired binary and repeated binary analysis | All nonempty strings not equal to the selected success code became failure values. Thus `NA`, an unexpected category, or an arbitrary third value could silently enter a binary test | Before calculation the engine checks that required columns exist, success is explicitly defined, apparent missing codes do not appear and no more than two observed categories are present. Problematic records are rejected, with instructions to check coding and missingness |
| Saved analysis provenance | Older records did not distinguish results obtained before the recent unit and calculation guards, leaving room to mistake a historical result for a newly checked one | New analysis records contain `calculation_guard_version:"C-X3c10c"` and a limited `validation_scope` note. The analysis history identifies previous unmarked records as historical and requiring review. The Results Audit shows a warning for the most recent unmarked record |
| Statistical export | The JSON record omitted available import warnings when enumerating the dataset | The export dataset description now carries those warnings. This does not restore omitted cells or certify source data |
| Inferential wording | A saved result could appear valid solely by virtue of being in analysis history | The revised display states the precise scope of automated checking. It does not claim that statistical assumptions, causal identification or source records have been independently validated |

The previous guard that blocks independently assigned dish/seed row mismatches, the no-error-storage rule and the Spearman inferential limitation were retained. Source edits are narrow and preserve the instructor's careful, natural wording without introducing mechanical connecting phrases.

## Numerical cross-verification

Calculated independently with SciPy 1.17.0 and statsmodels 0.14.6 on identical concrete inputs and checked the JavaScript engine against these results.

| Calculation | Independently checked values |
|---|---|
| Welch independent t-test, [1,2,4,5,8] versus [3,4,7,9,10] | t = -1.4184162865, df = 7.9092055485, p = 0.1942469730, approximate Hedges g = -0.8102705277 |
| Paired t-test, [1,3,2,6,7] versus [2,2,4,9,8] | t = -1.8090680675, p = 0.1447039986 |
| Fisher 2 × 2, [[1,9],[11,3]] | two-sided p = 0.0027594562, odds ratio = 0.0303030303 |
| Pearson chi-square [[10,20],[20,10]], no continuity correction | chi-square = 6.6666666667, p = 0.0098232745 |
| Cochran's Q, five units over three binary occasions | Q = 0.4, p = 0.8187307531 |
| Welch one-way ANOVA across [1,2,3,4,5], [4,5,6,7,8], [2,4,6,8,10] | F = 4.5957446809, denominator df = 7.5789473684, p = 0.0493033093 |
| Classical one-way ANOVA on the same groups | F = 3, p = 0.0877914952, eta-squared = 1/3 |

The selected JavaScript outputs agreed to numerical tolerance. These examples check implementations on specific valid inputs; they do not establish exhaustive statistical validity, model suitability or an institution's approval of analyses.

## Commits

- [8b5580e](https://github.com/gmoon-code/research-methods/commit/8b5580e74bfd4e9cd5a44ad88f0a547e05040ecf), sparse chi-square, binary codes and guarded-analysis records in `assets/analytics.js`
- [2a383fa](https://github.com/gmoon-code/research-methods/commit/2a383fa9429bf469e69a996d2835f5771a3596a8), historical-run labels, Results Audit and import-warning export in `assets/data-lab-ui.js`
- [838868d](https://github.com/gmoon-code/research-methods/commit/838868d537847a67406afe58120ff155f69764f1), new `tests/analytics-contingency-provenance.test.js`
- [f0892b2](https://github.com/gmoon-code/research-methods/commit/f0892b2b1c75b71b7a0fc54ca6ff20db9dcdcb1d), new `tests/analytics-reference-benchmarks.test.js`
- [a96e954](https://github.com/gmoon-code/research-methods/commit/a96e954feda32f8c791fac17912bdfc8fddff1a1), extra historical/current output checks in `tests/data-analysis-guidance.test.js`

The recovered prior ledgers were committed separately as [C-X3c10a commit 99b52ed](https://github.com/gmoon-code/gmoon-code.github.io/commit/99b52eda0a6236be9ac5e3d00b8efe0cb5ecf56a) and [C-X3c10b commit deb6749](https://github.com/gmoon-code/gmoon-code.github.io/commit/deb6749898f8ec9b51208d140e2780e4caaf4d2d).

## Verification performed

The following **six actual repository test files passed** against the current committed Data Lab code in an isolated V8 runtime with an adapted Node bootstrap and filesystem shim:

1. `tests/analytics.test.js`
2. `tests/analytics-inference-integrity.test.js`
3. `tests/analytics-contingency-provenance.test.js`
4. `tests/analytics-reference-benchmarks.test.js`
5. `tests/data-import-guidance.test.js`
6. `tests/data-analysis-guidance.test.js`

After extending the historical-run test, `tests/data-analysis-guidance.test.js` was separately re-executed and passed. The two production files `assets/analytics.js` and `assets/data-lab-ui.js` also passed JavaScript syntax parsing during this stage. The numbers in the reference test were computed independently with SciPy and statsmodels before writing the permanent regression assertions.

**Not performed**: a native Node CLI run of the complete repository, full browser interactions, independently validated statistical outputs for every input shape and distribution, saved-project migration testing or published-deployment parity.

## Residual uncertainties

- The binary-code guard detects obvious missing-token strings and unexpected third categories but cannot infer every study-specific missing code, such as 9, 99 or -1. A user must still document valid success, failure and missing codes.
- The independent-unit guard relies on project metadata. Correct row/unit labels cannot prove independence or justify a chosen inferential model.
- The chi-square exclusion uses a conservative expected-frequency rule. Other techniques can accommodate sparse data, but they have not been implemented here for general tables.
- The numerical benchmark verifies a selected set of statistics. Precision, validity and effect-size interpretation in all edge cases remain unverified. No confidence interval for small-sample Spearman is asserted.
- Earlier stored outputs are now visibly marked for review but are neither deleted nor automatically recomputed. The meaning of “primary analysis” remains dependent on the student's original plan and change history.
- The exported Results `.doc` and JSON still need full claim and provenance auditing across the writing workflow, and all browser/live site checks remain outstanding.

## Exact next continuation point

**Stage C-X3c10d | Data Lab missing-value conventions, remaining edge cases and Results export fidelity.** Inspect the full `assets/analytics.js` values/frequency/grouping/summary methods and the actual export builder in `assets/data-lab-ui.js`, including custom missing values, paired complete cases, category denominators and the distinctions between exploratory and prespecified analyses. Verify every user-visible export note and stored-analysis field against source data. Give special attention to exported historical analyses and import transformations, and run targeted numerical, source and export regressions. Preserve the completed C-X3c10a–c ledgers. After that, audit Writing Lab text and citations, conduct the larger cross-system consistency review and eventually complete native Node/browser and public-deployment checks.

**Stage status**: the specific C-X3c10c source changes and six focused suites are technically verified in isolated V8; external numerical references agree for the listed fixtures. The comprehensive website content audit remains in progress.
