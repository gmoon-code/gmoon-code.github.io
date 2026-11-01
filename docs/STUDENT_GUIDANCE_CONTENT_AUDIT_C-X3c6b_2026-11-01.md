# Stage C-X3c6b | Methods Lab guidance, panels 9–17 of 32

1 November 2026. Continued from [C-X3c6a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c6a_2026-11-01.md). Examined nine student-facing Methods Lab guidance entries in `assets/student-guidance.js` against the corresponding Rescue Lab instructions, Methods Lab source (`assets/methods.js`), curriculum Stages 9–12, earlier field examples and nine research design pathways. Status: **editorially source-verified, not runtime or deployed-site verified**.

## Individual panel review

| Panel | Outcome | Rationale |
|---|---|---|
| `methods.design` | Corrected | Distinguish assigned exposure, evaluated intervention without random assignment, and observed association; acknowledge nested/repeated units and necessary causal-inference safeguards |
| `methods.vars` | Corrected | Name the measure, scale, timing and unit for operational definitions; distinguish manipulated factors from observed predictors |
| `methods.rep` | Reviewed and retained | Already distinguishes independently assigned treatment units from technical and subsample repetitions |
| `methods.sample` | Reviewed and retained | Already distinguishes random sampling from random treatment assignment and bounds generalisation |
| `methods.measure` | Corrected | Require explicit measurement procedure, scoring, timing, consistency or calibration checks, and validity for the intended interpretation |
| `methods.ethics` | Corrected | Explain that classroom access does not authorise research reuse; establish required review, voluntary consent or assent, privacy safeguards and authority protections before recruitment/collection |
| `methods.procedure` | Reviewed and retained | Already demands ordered reproducible actions and documentation of deviations |
| `methods.data` | Corrected | Preserve nesting and repeated observation IDs; distinguish observed zeros from missing values and maintain traceability for qualitative evidence |
| `methods.audit` | Reviewed and retained | Already distinguishes prospective plan preservation from retrospective methodological changes |

**Nine panels reviewed, five descriptions corrected, four retained.** Panel titles, glossary-term links and relevant decision keys were preserved. Revisions reduce ambiguous method classifications and make the intended study's evidence structure more explicit. They follow the established concise, precise instructional tone without adding formulaic transitions.

## Source implementation and checks

- Source commit: https://github.com/gmoon-code/research-methods/commit/53dbc5ed33ba048e7851c9585c640242dad76a36
- Regression assertions: https://github.com/gmoon-code/research-methods/commit/b188d3ae1869a80325e3548d920f6f4ac4c1269e

Compared the committed `assets/student-guidance.js` source recursively with its immediate predecessor (`abc41bcb15e02ed9791a0f655db7d3617c77c8d9`). Exactly five Methods Lab descriptions changed; all other sections and data properties were preserved. All nine current panel IDs resolve in canonical Rescue Lab guidance. Stage summaries 1–18, all 113 field entries, 90 glossary definitions and the other three laboratories remain unchanged. Targeted source assertions passed. The new Node regression assertions were committed, **but Node was not executed**. Browser and deployment checks remain outstanding.

## Next exact checkpoint

**Stage C-X3c6c | Data and Statistics Lab, seven panels**, in order `import`, `quality`, `explore`, `setup`, `run`, `history`, `audit`. Examine the guidance against the Data Lab source, method-and-statistics model, Rescue lab guidance and reviewed student research examples. Verify imported-data integrity, missingness, analytical units, appropriate inference and uncertainty. Record warranted changes, re-fetch and diff, add regressions, save ledger. Follow with eight Writing Lab panels.
