# Stage C-X3c9a | Methods Lab design, sampling and measurement feedback

Date 1 November 2026. Continued directly from [C-X3c8d](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c8d_2026-11-01.md). Reviewed `assets/methods.js` functions `designProfile`, `roleOptions`, `inferStructure`, `auditDesign`, `auditReplication`, `auditSampling` and `auditMeasurements`, plus the corresponding first five Methods Lab sections in `assets/app.js`, the previously reviewed `student-guidance.js` and Rescue model. Inspected current test coverage and revised only source-supported defects in design classification, evidentiary claims and student-facing instructions. Status: **source-editorially corrected and regression-tested in isolated V8**; not verified in the browser or deployed site.

## Verified findings and corrections

| Area | Problem | Correction |
|---|---|---|
| Human-participant design profile | `!!m.ethics.humanParticipants` treated the string `"no"` as true. A partial project without an `ethics` or `design` object could also throw when inspected before normalisation | The flag now checks for the explicit answer `"yes"`, with safe optional access to unfilled project objects |
| Assignment structure | `/random/i` matched `Nonrandom assignment` before the nonrandom branch, reporting a randomized design | Specific nonrandom assignment is checked before random assignment. Researcher-assigned conditions, observed exposure, single-group/no assignment and not-applicable cases now receive distinct descriptions |
| Quasi-experimental research | Quasi-experiments were forced to use the role `Manipulated independent variable`, even when evaluating an intervention or policy change not randomly assigned by the researcher | Added `Intervention / evaluated exposure` as an appropriate role for quasi-experimental designs. Existing manipulated-factor roles remain recognised for compatibility. The audit explains the need for comparison or time structure without implying randomized assignment |
| Assignment and outcome auditing | A missing `assignment` property did not trigger the existing missing-assignment warning, and a filled primary-outcome field was described as identified *before analysis* without evidence of when it was chosen | Missing assignments are detected whether blank or absent. A recorded primary outcome now prompts verification of whether prespecification actually occurred |
| Independent research units | A filled unit field was described as proof that the unit of assignment and analysis was recorded, although these may differ | The message now identifies the entry as a study unit whose role in assignment, observation and analysis must still be checked |
| Planned versus completed sampling | `Actual sample missing` required a completed-sample description even for studies that had not recruited or collected evidence | The diagnostic now asks for a planned sample or corpus for prospective research, and the actual sample/corpus for completed work. The corresponding form and explanatory paragraph distinguish these statuses |
| Sampling and transferability | Diagnostic prose implied that broad population generalisation was the only relevant scope issue, and “nonrandom selection” could trigger a missing probability sampling frame warning | The advice distinguishes generalisation and transferability, uses Canadian English and excludes explicitly nonrandom selections from the probability-frame trigger |
| Measurement and evidence routes | Any project without a `measurements` entry was classified as critically unready, even for qualitative inquiry and literature reviews where appropriate evidence-generation or extraction is described in another form | Reviews receive guidance to document source selection, extraction and synthesis without inventing participant measurements. Qualitative research receives a warning to describe interviews, observations, documents or other records. Quantitative empirical studies still require a measurement/recording plan |
| Methods Lab language | A sample-size caption could imply that merely naming a study unit settles the effective independent sample size | Revised prompts ask which observations remain linked; measurement text accommodates nonquantitative records instead of requiring every project to produce numerical scores |

Individual diagnostic messages were also reviewed for natural, restrained language and relevant Canadian English spelling. Previously accurate warnings about pseudoreplication, repeated measures and observation nesting were retained.

## Implemented commits

- Initial design, quasi-experimental, sampling and unit terminology corrections, `methods.js`: [59d0429](https://github.com/gmoon-code/research-methods/commit/59d0429783a91c64f9f611958e776c24771c553d)
- Distinct qualitative, review and empirical evidence guidance: [3b14330](https://github.com/gmoon-code/research-methods/commit/3b143305efad04b8d6a476ece64d54201573e547)
- Methods Lab on-page explanations: [ed3c9f6](https://github.com/gmoon-code/research-methods/commit/ed3c9f67f54f54166e1d1ae9c7ca29d47780795e)
- Expanded methods regression assertions: [0e25bc9](https://github.com/gmoon-code/research-methods/commit/0e25bc93430267641cd481edd2baaa0255f845bf)
- Safe handling of unfilled ethics/design objects: [01b15d0](https://github.com/gmoon-code/research-methods/commit/01b15d0036dfe8452c0eba8843426c8824ac01ab)
- Missing-assignment detection, outcome timing and language refinement: [6ee6783](https://github.com/gmoon-code/research-methods/commit/6ee6783ef4b6f7ab0a35617b954aa4d6f9c62627)
- Additional regression assertions: [5b68e6a](https://github.com/gmoon-code/research-methods/commit/5b68e6a15b5e424312d1b2f18d97979df5712c25)

## Verification

Fetched the committed source again and compared it with the pre-stage blobs, examining a line-level diff. The changes in `assets/methods.js` are confined to the named design, unit, sampling and measurement functions. The `assets/app.js` diff has exactly four one-line replacements within the Methods Lab explanations and labels. No student-guidance, glossary, field-help, stage-summary, Rescue or Literature Workspace prose was modified in this stage.

**Seven targeted test suites passed** using an isolated V8 runtime with the original repository source and assertions loaded through a minimal Node-bootstrap adapter. The newly expanded `tests/methods.test.js` covers the explicit `humanParticipants` yes/no answer, nonrandom and observed exposure, random and repeated structures, quasi-experimental roles, unfilled methods objects, planned-sample wording, missing assignment, and evidence-planning routes for empirical, qualitative and review designs. Earlier Literature, student-guidance, novice-friction and search-provenance checks all remained passing. All seven retrieved JavaScript assets checked in the same pass parsed successfully.

This execution **was not a native Node CLI or browser test**, and it did not verify persistence, DOM interaction, accessibility or publication parity.

## Unresolved questions and dependencies

- A role label or design category, even when internally consistent, cannot establish causal identification. The actual comparison, selection mechanism, intervention history and possible alternative explanations must still be checked.
- For quasi-experimental projects, the diagnostic does not yet evaluate detailed time-series assumptions, comparison-group comparability or confounding adequacy. It records the intended structure and prompts further investigation.
- Existing imported saved projects may use different role terms. The updated role selector preserves the old `Manipulated independent variable` option for quasi-experimental compatibility, but every historical project has not been reloaded.
- The meaning of an independent replication unit can differ from the unit of measurement or the number of analysis rows. The existing warnings remain useful but do not substitute for method-specific evaluation.
- Mixed-methods projects may still need distinct diagnostic treatment rather than the current broad empirical fallback. This should be reviewed when auditing the later Methods Lab and Results Lab pathways.
- The remaining ethics, reproducible procedure, data-schema and research-plan audit messages in `assets/methods.js` have **not** been cleared by this first batch.

## Exact next continuation point

**Stage C-X3c9b | Methods Lab ethics, procedure, data schema, readiness and audit feedback.** Inspect `assets/methods.js` functions `ethicsRoute`, `procedureAudit`, `dataSchemaAudit`, `readiness`, and their user-facing messages, plus corresponding Methods Workspace sections of `assets/app.js`. Compare all language to the already audited Methods Lab guidance, Rescue ethics scaffolds, project-status distinctions and the canonical example's dish-level assignment and nested seed records. Check consent/assent and institutional permission boundaries, treatment and observational units, missing/zero coding, sensitivity of student records, prospective versus retrospective protocols and claimed readiness. Implement and verify only justified changes, record exact scoped diffs and executable assertions, and save a stage ledger. Further work must include Data Lab and Writing Lab literal prose, cross-page scholarly consistency, native Node/browser checks and deployed-site parity.
