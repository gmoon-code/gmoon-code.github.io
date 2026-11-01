# Stage C-X3c12a | Cross-system research status, evidence-record units and planning terminology

Date 1 November 2026. Continued directly from [C-X3c11d](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c11d_2026-11-01.md). Scope comprised the curriculum's Stages 11–13 and 16, parallel Student Guide stages, five affected canonical Rescue fields at all five scaffold levels, the live Rescue JavaScript bundle, and comparisons with Methods Lab, Data Lab, Writing Lab, Path Coach and existing test assertions. Previously reviewed surrounding lessons and research content were preserved.

**Status:** Source-editorially corrected, directly inspected and verified by eight targeted JavaScript test suites executed in isolated V8. No native Node CLI, DOM browser, actual site persistence or public deployment test was performed. The comprehensive website audit remains unfinished.

## Coverage and source-backed findings

| Area | Verified discrepancy | Implemented correction |
|---|---|---|
| Curriculum Stage 11 sampling | The field label said `Actual sample` even for planning work, despite Methods Lab distinguishing a planned sample/corpus from actual recruited or observed records | Now reads `Planned sample or actual sample, with status`. The section explanation distinguishes prospective targets and completed study records |
| Stage 11 worked guidance | The Student Guide said an accessible class was `the actual sample` even though the hypothetical study had only identified a recruitment setting and still needed permission and voluntary participation | Reworded to identify an accessible planned recruitment setting; the actual sample depends on eligibility and participation through approved procedures. Stage steps also differentiate prospective and completed samples |
| Curriculum Stage 12 protocol status | `Write the method and lock the data plan` implied a definitive lock, although the actual Methods Lab saves dated versions and cannot establish implementation, prespecification or authorisation | The title and explanations now refer to saving a dated data plan. They require disclosure of subsequent changes, and explicitly note that a saved plan does not establish adherence or research approval |
| Non-tabular evidence | The curriculum and student steps prescribed a row-and-column table as if it were mandatory for qualitative interviews, documents, records or other evidence | The relevant text now permits a traceable non-tabular evidence structure. It still requires precise case/record identity, source provenance, IDs and linking decisions. The corresponding Rescue `rowUnit` scaffolds describe data rows or other evidence records |
| Missing-value documentation | The curriculum and Rescue text could imply that recording a prose missing-data rule automatically controls numerical calculations | It now distinguishes the methodological plan from the separate explicit `missingTokens` control in the Data Lab. Text in the Stage 12 overview, Guide steps, and Rescue levels 2 and 5 tells students to configure tokens explicitly, retaining the original raw values |
| Analysis decision timing | The curriculum's generic `Primary analysis` field and Rescue scaffolds were insufficiently explicit about plans selected before versus after reviewing evidence. A Stage 13 checkbox implied students should choose their inferential test after plotting the data | The Stage 12 analysis field and Rescue frame now ask whether a method was specified prospectively or later, recording the decision stage. The Stage 13 check asks students to inspect evidence patterns before interpretation without retrospectively claiming prespecification |
| Discussion limitations | The Stage 16 field and Rescue help required `at least two limitations`, while the completed Writing Lab guidance asks authors to explain relevant limitations affecting actual claims rather than meet an arbitrary count | Removed the fixed numerical quota from the field prompt and Rescue levels 1, 2 and 5. The curriculum and canonical Rescue now ask for consequential, specifically explained inference boundaries. Existing worked examples remain examples, not mandatory manuscript structures |
| Canonical versus live Rescue | The site loads `assets/rescue-model.js` in `index.html`, while canonical guidance resides in `assets/rescue-model-v2.5.json`. After editing JSON, the live JavaScript bundle still retained the previous five field descriptions | Compared every canonical and bundled field and Lab. **Exactly five field objects differed**, all from these justified revisions. Updated the live bundle from the canonical model and added a full-model parity regression |
| Writing voice and Canadian English | The changed texts used potentially inconsistent American/British word variants, and older guidance encouraged an arbitrary fixed form for limitation discussion | Revised the newly authored wording to match the established Canadian English preferences for `analyze` and `organize`, while keeping gentle, specific, evidence-focused language and avoiding mechanical rhetoric |

The current corpus continues to treat dish-level assigned units separately from seed-level measurement rows. This stage did not rewrite previously audited canonical salinity examples or infer that the number of rows establishes independent replication.

## Exact implementation record

Research-methods repository source updates:
- [Curriculum Stages 11–13 and 16](https://github.com/gmoon-code/research-methods/commit/edd7610abf5b7f7f4ba15f9780e00d5092775a60)
- [Parallel Student Guide planning and evidence structure](https://github.com/gmoon-code/research-methods/commit/045f0d518df39840683d651977352cf92148f42a)
- [Correct accessible-class versus actual-sample example](https://github.com/gmoon-code/research-methods/commit/648ea178a1110b41df096c4ff856d529b64de3b1)
- [Canadian English refinement in Student Guide](https://github.com/gmoon-code/research-methods/commit/71c628c9a76aef62662e56611c2a6d1488a65834)
- [Five canonical Rescue fields, complete scaffold levels](https://github.com/gmoon-code/research-methods/commit/81abe08907857e3d2d93ef85d27a192333b530fe)
- [Canadian English refinement in canonical Rescue](https://github.com/gmoon-code/research-methods/commit/d4d8a7f3399948bc9851511c5e395d2ef92a0bd6)
- [Synchronise live Rescue bundle](https://github.com/gmoon-code/research-methods/commit/8db021fc1e5027e774d638520bd6edeee7a88e26)
- [Final live bundle parity after text refinement](https://github.com/gmoon-code/research-methods/commit/cd187ff4d93f1846ecb52687c193f83974e7e1c8)

Tests:
- [New curriculum–Rescue–Methods/Data/Writing cross-system regression](https://github.com/gmoon-code/research-methods/commit/e7c5706d7794f6560c97a4bcdff56dbcbcabf33c)
- [Case-insensitive test correction](https://github.com/gmoon-code/research-methods/commit/ad4319c3bb06729f756fef8b6cf325fa4e847cf9)
- [New complete canonical/live Rescue parity regression](https://github.com/gmoon-code/research-methods/commit/1b7eccb57522af38986fb18b58718c0910f87616)
- [Update stale Rescue test that imposed a two-limitations quota](https://github.com/gmoon-code/research-methods/commit/dab83c22f2e72896cc87506dd1eeb82a461387f3)

Final fetched production blobs:
- `assets/curriculum.js` `f15eb43f4e731d5e9cbfc06083832c3dbbd06a4a`
- `assets/student-guidance.js` `002a392ecf2f910fe56ad96db877038dff619ebf`
- `assets/rescue-model-v2.5.json` `5a1918c4a2216f41459497bcfb05ed8b6124009a`
- `assets/rescue-model.js` `dbb1910cdd9d4033f4187e84ca40db1315dd3afd`

The canonical and bundled Rescue models each have 113 field entries. Final JSON object equality was verified, including all fields, scaffold levels and Lab content. The other 108 Rescue fields, and all Rescue Lab objects, were preserved during the five-field update.

## Verification results and failure resolution

**Eight of eight targeted suites passed** against the fetched final committed sources, with each suite run in an isolated V8 environment using the original test assertions and a minimal Node/JSON/FS bootstrap:

1. `tests/cross-system-research-language.test.js`
2. `tests/rescue-canonical-parity.test.js`
3. `tests/rescue-v25.test.js`
4. `tests/student-guidance.test.js`
5. `tests/methods.test.js`
6. `tests/analytics.test.js`
7. `tests/writing.test.js`
8. `tests/path-coach-v24.test.js`

The first cross-system test attempt failed on a case-sensitive expectation for `Qualitative interviews`. Correcting the assertion made it pass without a prose change. The first Rescue v2.5 attempt lacked the `rescue.js` dependency in the isolated runner; a complete rerun found an older assertion requiring `at least two` limitations. That obsolete test expectation was replaced with a check for specific interpretive limitations, consistent with the new guidance. The corrected Rescue suite and subsequent complete eight-suite batch passed.

These tests verify actual source consistency, some real methodological guard behaviour and the correctness of the live Rescue model relative to its canonical source. They do not validate every research design or all human-readable guidance. Test success is **not** permission to call the whole website factually or editorially verified.

## Remaining scholarly and cross-page dependencies

- `assets/curriculum.js` contains other stages not substantively rereviewed in this cross-system batch; their prior audit status remains as previously documented, subject to final consistency checks.
- The actual `assets/app.js` student editing controls and individual pathway/Rescue tab renderers need a further cross-system content scan for fields that still display older terms in a different location.
- A declared missing token applies to the analysis copy; validity, causal inference, ethics approval and whether the sample is truly independent remain matters for study-level evidence and responsible review.
- Student-reported manuscript status, dated protocol snapshots, and calculated analyses cannot independently establish whether work was carried out as planned or was prespecified.
- Full project-wide Node CLI/static test execution, real browser events and persistence, rendered exports, and public-deployment parity remain unexecuted.
- The user's requirement for exhaustive sentence-by-sentence and paragraph-to-paragraph editorial scrutiny across the complete academic website still requires further documented work.

## Exact next continuation point

**Stage C-X3c12b | Cross-system live field labels, help panels, planning-versus-observation prompts and provenance language.** Inspect all remaining references to the Stage 11 sample, Stage 12 row unit, missing-code rule and analysis intent, and Stage 16 limitations across `assets/app.js`, `assets/path-coach-model.js`, `assets/path-coach.js`, `assets/pathway-ui.js`, `assets/rescue-ui.js`, `assets/student-guidance-ui.js` and other rendered field descriptions, comparing them with the canonical curriculum and Rescue models. Check that the actual student-facing UI does not revert to `Actual sample`, mandatory tabular data, automatic missing-code recoding, a research-protocol `lock` interpreted as approval, or arbitrary counts of limitations. Implement justified revisions and regression tests, then persist C-X3c12b. After this, continue cross-research/cross-page academic content review and final native Node, browser and deployed-site checks. Do not infer comprehensive completion from these eight suites.

**Stage status**: C-X3c12a is editorially verified for the scoped source strings and tested integration assertions. The complete academic website content audit is still in progress.
