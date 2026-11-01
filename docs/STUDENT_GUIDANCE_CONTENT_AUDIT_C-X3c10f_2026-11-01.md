# Stage C-X3c10f | Remaining Data Lab diagnostics, statistical edge cases and Results exports

Date 1 November 2026. Continued directly from [C-X3c10e](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10e_2026-11-01.md). This stage reviewed the remaining source-level Data Analysis and Statistics Laboratory feedback in `assets/analytics.js` and `assets/data-lab-ui.js`, including empty/constant data, selection of exact categorical analyses, sample-size/assumption messages, saved analysis objects, categorical text summaries, binary-success prompts, historical records, and JSON/Results notes exports. The review followed the non-negotiable content priorities of empirical accuracy and the author's careful, natural writing style. **Source-level content changes and tests were executed. Real browser and deployed-site verification were not.**

## Source-backed findings and corrections

| Area | Verified issue | Justified correction |
|---|---|---|
| All-missing descriptive column | Numerical or categorical descriptive analysis could return a storable result even though no observed numeric values or category counts were available | Return an explicit error when a selected numerical variable has zero valid observations or a categorical variable has zero observed categories after documented missing-code exclusions |
| Fisher exact selection | A user who selected Fisher for a non-2×2 table could silently receive chi-square instead, despite the selected method and its distinct assumptions | Reject the unsupported exact-test configuration with an explanation. The calculator does **not** substitute chi-square without the student's choice |
| Categorical summaries | The neutral descriptive result listed at most four categories but did not state that additional categories were omitted from the short summary. Percentage denominator was implicit | Explicitly identify percentages as percentages of non-missing values and, if applicable, state that four of a larger number of categories are shown. Full counts remain in calculation output |
| Historical analysis references | `analysisRecord` kept references to calculation configuration, output and missingness. Later in-memory changes to those objects could modify an earlier record | Deep-copy the saved configuration, output and missingness values and copy the assumption messages, preserving a stable snapshot of a calculated result |
| Results document fidelity | The text export omitted calculation timestamp, detailed model/column choices and the distinction between the current automated safeguards and older ones | Add recorded date, structure, configuration, calculation-safeguard qualification and review boundary to each stored analysis in the source-generated Results notes. Preserve previously added original source-file, missing-code, sample-size and estimand details |
| Undocumented independent units | Assumption feedback remained silent when the project did not specify either its study/assignment unit or data-row unit. The absence of a mismatch was not evidence of independence | Add an explicit warning on inferential outputs where study and row units are not fully recorded. The warning requests evidence of independence rather than asserting that the selected test is valid |
| Exact versus asymptotic binary inference | Cochran's Q output has an asymptotic chi-square reference, while McNemar's implemented two-sided calculation is exact | Add qualified guidance noting the approximation for Cochran's Q and the role of discordant pairs in McNemar, including complete-pair reporting |
| Unchosen binary category | Paired and repeated binary inputs defaulted their 'success' category to `1`, creating a risk of treating an unintended code as success | Remove the default. Students must explicitly enter the recorded success category; source-level validation already checks presence and binary coding |
| Historical timestamps | Older records with no valid timestamp could display `Invalid Date` | Present `Date not recorded` rather than suggesting a known date |
| Results audit and JSON scope | The Results audit lacked a warning when inferential study or row unit was unrecorded. The JSON export's top-level dataset could be misread as the original dataset of every historic result | Add the unit warning and a scope statement explaining that top-level dataset fields describe the **current** imported table, while each saved analysis has its own historical traceability information |

The source text avoids implying that an automated guard establishes causal inference, a sufficient sample, suitable measurement, formal study approval or actual prespecification. Source-level corrections are deliberately limited to these content and evidence-integrity pathways. Existing earlier audit sections and canonical guidance were retained.

## Source commits

- [Analytics, no-observation cases, Fisher method fidelity, stable records, clearer category summaries and Results fields](https://github.com/gmoon-code/research-methods/commit/56eb0933417bf91f354a1624624c7092248e9e86)
- [Analytics, unrecorded unit warning and exact/asymptotic inference notes](https://github.com/gmoon-code/research-methods/commit/b07037577206e408e3f55e4608f99e12a81799b9)
- [Data Lab, explicit binary success value, historical date and export scope](https://github.com/gmoon-code/research-methods/commit/208dfe4d1aa94036d09d9d07b9edf74950704c96)
- [New analytics-output-integrity regression file](https://github.com/gmoon-code/research-methods/commit/ee87b328f1611eb828978c720da088db5a69878a)
- [Expanded assumption and paired-binary regression](https://github.com/gmoon-code/research-methods/commit/34e71d84fe46b54d1c627ccd74174d6adf15aa0d)
- [Expanded Data Lab display and missing-date checks](https://github.com/gmoon-code/research-methods/commit/ff05bc8253c439fcf00550ea777a1f2cdf94060c)
- [Actual Results/JSON export handler routing regression](https://github.com/gmoon-code/research-methods/commit/7c04248985ffa181c6ec1be013a82a9d1e81218e)

Current verified source blobs
- `assets/analytics.js` `63c25a29cec9763f6e3df6b66b6d8bd78366bd55`
- `assets/data-lab-ui.js` `ce426d93a7f5950b18ae6b59b707bd386d806de2`

## Test execution

Ten targeted actual repository tests passed against these committed sources in an isolated V8 runtime, with Node `global.window`, `require` and `fs.readFileSync` adapted for injected source text

1. `tests/analytics.test.js`
2. `tests/analytics-inference-integrity.test.js`
3. `tests/analytics-contingency-provenance.test.js`
4. `tests/analytics-reference-benchmarks.test.js`
5. `tests/analytics-missing-provenance.test.js`
6. `tests/analytics-invalid-numeric.test.js`
7. `tests/analytics-output-integrity.test.js`
8. `tests/data-import-guidance.test.js`
9. `tests/data-analysis-guidance.test.js`
10. `tests/data-results-export-routing.test.js`

The new export-handler test executes the actual `bind()` handler source with controlled button and export functions, exercising JSON and Word-export routing. The example contains one historical record, one current guarded record, a later changed file name and a revised estimand. The assertions distinguish the JSON's current dataset from the original run's recorded file and estimand and confirm that the Results text retains historical qualification, columns, missing-value codes and observation counts. Both production JavaScript source files passed syntax parsing.

**This was not a full browser or native Node CLI run**. The Word-export test checks the Markdown handed to the Word export function; it does not validate a generated Word file's typography or a real browser download. Other project-wide and deployment checks have not been executed in this stage. The independent numeric reference fixtures from prior stages remain in the passing regression suite, but numerical agreement on fixtures is not a complete model-validation study.

## Remaining limitations and unverified cases

- A global missing token remains applicable across every imported column. A code that is a valid category in one field should not be globally marked missing. Column-specific mapping, if required, needs a separate evidence-design decision and tests.
- Correct-looking independent unit labels and a positive count do not prove statistical independence; selecting a test still requires domain and sampling expertise.
- The exact small-sample Cochran test is not implemented. The engine uses an asymptotic reference with an explicit caution.
- A historic record with no metadata remains historically incomplete. The new text makes uncertainty visible rather than filling missing data by inference.
- There is no automatic independent reconstruction of source records, prespecification timestamps or external authorisations.
- Browser event/persistence tests, real Word/JSON generated outputs, native Node CLI across the repository and public deployment parity remain outstanding.

## Exact next continuation point

**Stage C-X3c11a | Writing Lab user-facing guidance and manuscript claims, first coherent section.** Audit the real source text in `assets/writing.js`, `assets/writing-lab-ui.js` and their supporting citation, claim and writing-review modules. Verify the editorial guidance against previously audited writing-stage help and the author's style rules, especially source fidelity, claim strength, synthesis versus description, diverse meaningful transitions, author-owned voice, citation precision, methodological transparency, and non-fabricated evidence. Inspect exported draft and references prompts, correct only supported claims and add regression tests. Save a stage ledger after source/test verification. Then continue other Writing Lab sections and cross-system scholarly consistency. The full website audit still requires a separate native Node/browser/public deployment QA checkpoint.

**Stage status**: C-X3c10f is complete at the scoped source-editorial and isolated V8 regression level, not full site verification.
