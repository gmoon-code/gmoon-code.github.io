# Stage C-X3c9b | Methods Lab ethics, procedure, data-schema and readiness language

1 November 2026. Continued from [C-X3c9a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c9a_2026-11-01.md). Reviewed `assets/methods.js` functions `ethicsRoute`, `procedureAudit`, `dataSchemaAudit`, `readiness`, `protocolSnapshot` and `methodMarkdown`; the corresponding user-facing Methods Workspace sections in `assets/app.js`; and the actual `PathCoach.methodSection` and `methodsReadiness` consumers. Compared them against the completed student-guidance Methods Lab review, canonical Rescue guidance, source-level tests and the illustrative dish-assignment/seed-observation example. Source-editorially revised and regression-tested in isolated V8. Not verified in a browser or published deployment.

## Verified problems and editorial/methodological corrections

| Area | Verified source issue | Implemented decision |
|---|---|---|
| Human-participant screening | A blank screening answer could leave the ethics route labelled `clear`. A contradictory `no` answer could coexist with identifiable records, minor participants, sensitive information or a human intervention | Missing classification now requests review; contradictory answers are a critical inconsistency and trigger teacher/institutional review. Ethical screening handles missing project data safely |
| Consent, assent and permissions | A completed consent text field could be interpreted by students as sufficient authority, and minor-participant guidance lacked explicit timing | Guidance distinguishes *planning* permission from documented approval and directs students to school/institutional requirements before recruitment or collection. Minors require an appropriate assent and parent/guardian permission plan |
| Unsafe routes | Classroom access or the ability to implement an intervention could be mistaken for research authority | Explicit warning that students must not initiate participant interventions on assumed classroom authority. Existing unsafe-manipulation detection is preserved |
| Procedure chronology | The source only checked for the presence of words related to consent, not whether an apparent consent or approval step occurred after initial collection | New conservative warning/error check flags recruitment, intervention or collection that precedes a recorded permission/approval step. It cannot verify that approval was actually obtained |
| Procedure length | Fewer than three steps always implied an under-specified procedure despite the variable structure of qualitative, quantitative and review protocols | The message now asks for necessary preparation, recording and handling decisions without treating a fixed step count as proof of reproducibility |
| Data schema and unit of observation | No spreadsheet columns and no row label were both critical for all projects, including qualitative work using interviews or documents | Qualitative routes now require identifiable and traceable evidence records without assuming that a numerical table is mandatory. Extracted-study/quantitative projects still need appropriate tabular or other specified evidence structures |
| Nested observations | A difference between row and experimental-unit labels was presented as a nesting fact, and ID linkage was understated | The message asks students to verify grouping and record IDs, noting that different units may be appropriate as long as dependence is preserved |
| Missing versus observed zero | A numeric or binary field could use `0` as a missing code without a warning | Added a caution to distinguish actual zero values or categories from missing observations |
| Readiness and ethics | Both direct Methods Lab and PathCoach readiness messages could imply a general readiness state even when formal review was required | Labels now distinguish unresolved critical issues, required teacher/institutional review, unsafe routes, ordinary warnings and the absence of *detected* issues. The Methods Workspace explicitly says a saved protocol is not research approval |
| Protocol version history | The snapshot held references to mutable working arrays and objects; editing them later could alter the supposedly preserved protocol record | `protocolSnapshot` now deep-copies its values. Regression checks confirm subsequent working-plan changes do not alter historical constructs, design, schema or procedure steps |
| Methods audit display | Only the first five diagnostic issues were shown under each section, silently concealing later warnings/errors | All identified issues are now included in the rendered diagnostic content, and a no-issue message explicitly limits itself to the automatic checks |
| Student-facing prose | The ethics route showed internal status names such as `clear`, and “lock protocol” could be read as approval | Explanatory route messages distinguish the check's limits; procedure, data and audit guidance acknowledge prospective/completed status. The save action is labelled as versioning rather than permission |
| Pathway compatibility | The PathCoach sampling exception referred only to an older diagnostic title, which could reintroduce a false critical sample requirement for reviews | Retained compatibility with both legacy and revised sample messages and reconciled PathCoach's readiness labels |

The edits preserve correct prior treatment of prospective records, unit nesting and the known hazards, while avoiding invented approvals or permissions. Prose revisions follow the author's preference for precise, understated and naturally connected instructions, using Canadian English where authored.

## Source commits

- Ethics, procedure, data-schema, readiness and exported-method record revisions: [38f8dd2](https://github.com/gmoon-code/research-methods/commit/38f8dd2e633da9e2b50a8f8666dfcbe23c2087cc)
- Pathway-specific readiness and sampling language: [0947842](https://github.com/gmoon-code/research-methods/commit/094784201ee1914030bf74b53e7cd5460676f1b1)
- Methods Workspace messages and protocol-version labels: [216adce](https://github.com/gmoon-code/research-methods/commit/216adcef49c1a72f41fd70b1bdd458351850f153)
- Historical protocol values copied independently: [d9a9a25](https://github.com/gmoon-code/research-methods/commit/d9a9a253501c66002acc4098ca51723e81599d1b)
- Legacy/updated pathway sample exception: [1f48827](https://github.com/gmoon-code/research-methods/commit/1f48827beb61041a3cb45f2996d41e4f24c5e552)
- Contradictory screening and qualitative-path exception: [fed25ff](https://github.com/gmoon-code/research-methods/commit/fed25ffb2f3f9aee98a5d4f88d03c11e420fd51c)
- Missing research-question object handled safely: [6187f11](https://github.com/gmoon-code/research-methods/commit/6187f111da786bf20fd7a79961f928763700d168)

Regression changes:
- Core Methods Lab cases: [5bcea1c](https://github.com/gmoon-code/research-methods/commit/5bcea1c98bcc6e9ec148f7bf7d618817af965e72) and [af57dfc](https://github.com/gmoon-code/research-methods/commit/af57dfcaa79b59172de0d5e83bb8f74df0af2373)
- Cross-system Methods and PathCoach integration test: [08f3d88](https://github.com/gmoon-code/research-methods/commit/08f3d88fc787e0865c49d9dc9053b13bcd443eee)

## Verification and scope

After all corrections, executed **nine targeted test suites successfully** using fetched repository source and assertion code in an isolated V8 runtime with Node bootstrap/FS adapters. These include the expanded `tests/methods.test.js`, new `tests/methods-pathway-integrity.test.js`, existing `tests/path-coach-v24.test.js`, and six existing Literature, student-guidance and novice-help suites. All checked JavaScript assets parsed.

Compared production sources with their pre-stage Git blobs:
- `assets/methods.js` before `04892180abd16474070ce93ad4e9555ef1aecedb`, after `6b14ff8d2015ea28a5346afae8b3f7a77b201e02`. All reviewed diff hunks concern the intended ethics, procedure, data-schema, readiness, protocol history and methods-export code.
- `assets/path-coach.js` before `bd559d4ec670c00b2689fa0592ebce5b9f1b7bf2`, after `f18145652da8fc69694a19a9ba6c4739cf29d5d7`. The only altered lines relate to the sample-diagnostic exception and readiness label.
- `assets/app.js` before `3c14d1bbe6aa771092ca1a8f4e7aaa2dace479f0`, after `8329e6c1c34a5b9c586076f073a3726474127562`. Only the four Methods Lab ethics/procedure/data/audit display source blocks changed.

This execution **was not native Node CLI, browser event/persistence testing or public-deployment parity**. A source-code warning about consent order can detect an obvious contradictory sequence, not validate legal adequacy or determine whether actual consent/approval was obtained. Similarly, a completed form cannot prove an institution's permission.

## Unresolved questions

- Depending on jurisdiction, research design and school policy, the required ethics, permission, consent and assent process varies. This tool can request review but cannot confer approval.
- Human-data reidentification risk can arise from indirect combinations even without direct identifiers. The current choice guidance addresses this concept, but this diagnostic does not implement a full privacy-risk model.
- For study designs with several approval stages, the current sequence check is deliberately limited and does not prove a valid chronology. A saved procedure can also differ from actual conduct.
- Historical saved projects may contain incorrectly classified ethics states or protocol snapshots created before deep-copy versioning. The code cannot automatically reconstruct whether earlier saved versions had been mutated.
- Mixed-methods and review-based evidence extraction still require additional content scrutiny in the Data and Writing Lab modules.
- The Methods Workspace's real browser forms, status rendering, version-save action, document export and persistence have not been exercised in a browser.

## Exact next continuation point

**Stage C-X3c10a | Data Lab and Statistics diagnostics, first coherent section.** Inspect `assets/data-lab.js`, corresponding quantitative/qualitative data analysis explanations in `assets/analytics.js` or other analysis modules, and the Data Lab tabs in `assets/app.js`. Compare all explanatory and user-facing messages with the audited Data Lab panels, curriculum Stages 13–15 and canonical dish-level assignment/seed-level observations. Prioritise independent units, missingness and zeros, paired/clustered data, assumptions, estimation, uncertainty and distinctions among proposed and observed results. Implement only supported corrections and ensure testable regression coverage, then save C-X3c10a. Follow with later Data Lab outputs, Writing Lab content and system-wide source/browser/deployed verification.
