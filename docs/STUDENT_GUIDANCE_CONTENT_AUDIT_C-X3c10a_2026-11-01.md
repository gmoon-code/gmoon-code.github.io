# Stage C-X3c10a | Data Lab imported-record provenance and quality instructions

Date 1 November 2026. Continued from the committed Stage C-X3c9b ledger. This stage deliberately covers import parsing and data-quality prose, not the validity of inferential tests. Reviewed `assets/analytics.js`, `assets/data-lab-ui.js`, the existing statistics regression file, a new user-facing guidance test, and the previously completed Data Lab instructional guidance.

## Source-supported findings

1. The import interface previously stated that the lab did not silently alter imported values. In reality, `parseCSV` assigned generated names to empty headers, renamed duplicate columns, omitted completely blank data rows, filled short rows with empty trailing values, and ignored extra cells on rows wider than the header. Those transformations were not reported. Accordingly, the interface's assurance was unqualified and could mislead a student interpreting an imported sample.
2. The duplicate-header suffix scheme could itself create collisions. For instance, original columns `score,score,score_2` could result in a repeated imported column identifier, overwriting a cell in a JavaScript row object.
3. The Data Quality screen described identical-value rows as duplicates. Identical values may be legitimate repeated observations, particularly for categorical data or nested measurements.
4. The quality report called empty cells `Missing`, even though study-specific missing codes such as `NA` were not counted by that check. Numeric zero has its own valid meanings and must not be silently conflated with absence.
5. The import workflow's rollback and clear actions had to preserve or reset the new provenance metadata consistently.

## Corrections implemented

- `parseCSV` now returns `importWarnings` and `rawRowCount` alongside imported headers and rows. Warnings describe renamed headers, skipped entirely blank data rows, too few fields, extra fields not imported, and unmatched quote status. The parser still keeps its existing parsed-record workflow, so students must preserve and consult the unaltered original CSV.
- Column-name disambiguation now checks all previously assigned output names before choosing a unique name. The collision case `score,score,score_2` is tested explicitly.
- `normalizeProject` carries import warnings and the source-row count forward. The import handler stores those values, restores them when a save fails, and clears them with the browser copy.
- The Import tab now accurately describes normalisation and omission of blank rows, and the Data Quality tab displays the warnings rather than claiming all imported values were untouched.
- Quality messaging labels identical-value rows as `Identical-value rows (investigate)` and blank cells as `Blank cells`. It explains that identical rows need not be erroneous and blank-cell totals do not include every recorded missing-value code.
- The content review retains a clear boundary between import diagnostics and analytical validity. This stage does not certify independence or the suitability of inferential tests.

## GitHub source commits

- `assets/analytics.js` recorded transformations and row-shape warnings: https://github.com/gmoon-code/research-methods/commit/e994835b404c6f9d3a04c2ba217ef58c457334f9
- `assets/data-lab-ui.js` import and quality guidance, metadata persistence and rollback: https://github.com/gmoon-code/research-methods/commit/17687e4e3d8f0fe28fd3eb234b821b7f1e2e4808
- `assets/analytics.js` collision-proof column names: https://github.com/gmoon-code/research-methods/commit/bef1c119529ca7653c9a007235e76f25e186e242
- `tests/analytics.test.js` extended parse and provenance tests: https://github.com/gmoon-code/research-methods/commit/adda234be9aae294728469f6df67d6db66d45ed2
- New `tests/data-import-guidance.test.js`: https://github.com/gmoon-code/research-methods/commit/3f6550e01fd38bc8f71e6226344645468719e922

Final source blob identifiers examined: `assets/analytics.js` = `57303f7e5703b3414ed5619320d931a1391c81a7`; `assets/data-lab-ui.js` = `f2f9d2d8ac14f1475cb704d880a4d641f4ee8c55`.

## Verification performed

- The actual `tests/analytics.test.js` file, executed against the committed analytics engine in an isolated V8 environment with Node bootstrap adaptation, passed. The new assertions cover duplicate-header suffix collisions, zero-valued measurements, blank rows, uneven widths, dropped excess cells and provenance metadata surviving normalisation.
- The actual new `tests/data-import-guidance.test.js`, using the committed analytics and Data Lab UI source with a minimal filesystem shim, passed. It checks the generated import and quality instructions and the persistence/rollback code references.
- Both production files parsed successfully as JavaScript after the changes.
- The broader eleven-suite regression check was attempted, but the GitHub connector reached its per-turn call limit before executing that combined pass. **Do not report eleven suites as passed.** Prior Stage C-X3c9b's nine-suite verification remains valid for the source versions tested then, but those checks were not rerun as one suite after the new Data Lab changes.
- Native Node CLI execution, browser import interaction, saved-project round-trip persistence, CSV exports and published-site parity are not verified.

## Outstanding cautions

- A warning about extra cells does not restore values omitted by the existing import mapping; users must check the original file and correct the CSV before analysis. A future technical improvement may reject structurally inconsistent rows, but preserving compatibility needs care.
- The import parser still applies its own CSV parsing rules; the warnings do not certify conformity with every CSV edge case. Unmatched-quotation handling needs further investigation.
- `qualityReport` uses numerical heuristics to describe the apparent type of a column. It does not know whether a numeric 0/1 field represents genuinely quantitative measurements or a coded categorical variable, and it does not fully interpret custom missing codes.
- The analysis runner accepts paired/clustered data structures through a limited set of models. Statistical independence, confidence-interval assumptions and the validity of p-values have **not** been cleared by this import audit.
- The academic website's other research and writing content, and live browser verification, remain unfinished.

## Exact next checkpoint

**Stage C-X3c10b | Data Lab analysis configuration and inferential integrity.** Start by inspecting `assets/analytics.js` functions `recommendation`, `runAnalysis`, `assumptionAudit`, `analysisRecord`, and `summary`, alongside the Setup/Run/History/Audit tabs and event handlers in `assets/data-lab-ui.js`. Compare each reported estimate, model choice, data unit, exclusion rule and claim with the audited Data Lab guidance and the dish-level assignment/seed-level measurement example. Check whether clustered/paired records or unsupported missing-value assumptions can produce unjustified p-values, whether erroneous outputs are stored as valid runs, and how incomplete analysis metadata is presented. Implement narrowly scoped, testable changes. Then audit output/reporting language, Writing Lab literal prose, cross-page methodological consistency, and finally native Node/browser/deployed parity.

## Record status

The source and test commits above were saved in GitHub. **This markdown ledger is a local audit attachment for this turn and was not committed to the academic-website GitHub repository because the repository connector reached its call limit.** Commit/copy it into `gmoon-code/gmoon-code.github.io/docs/STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10a_2026-11-01.md` at the next opportunity. Do not infer that it is already present there.