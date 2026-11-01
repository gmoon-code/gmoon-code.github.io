# Stage C-X3c8b | Student-help and Literature Workspace content reconciliation

Date 1 November 2026. Continued from [C-X3c8a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c8a_2026-11-01.md). Reviewed the remaining student-facing literal guidance in `assets/student-guidance-ui.js`, `assets/student-help-ui.js`, and `assets/rescue-ui.js`; the scholarly claims and explanatory text of the eight Literature Workspace tabs in `assets/app.js`; the source-link and theme-readiness semantics in `assets/literature.js`; and field-wide gap warning text in `assets/novice-friction.js`. Inspected the existing tests and new regression assertions, with attention to evidence status, research claims, natural instructional flow and the author's preference for diverse, meaningful connections. **Source-editorially reviewed and targeted assertions executed; not browser or live-site verified.**

## Coverage and per-component decisions

| Component or section | Coverage | Decision |
|---|---|---|
| Student stage and field guides, response examples | Static headings, boundaries, response cues and example explanation | Five initial revisions to `student-guidance-ui.js), followed by a clearer 'Illustrative working response' heading. Examples are now explicitly distinguished from verified research findings and user responses |
| Unified student help | Field-level source/example modal, navigation and fallback guidance | Added a visible boundary saying that the example's reasoning and specificity are useful while factual claims must be checked against the user's records |
| Progressive Rescue interface | Field-help levels, navigator and authorship instructions | Replaced 'No-dead-end help' with a grounded heading, made initial blank-response support less patronising and strengthened the requirement to check assembled claims |
| Literature Workspace, Search | Search-log instructions and actual-versus-proposed status | Replaced an implication that logging automatically supports 'systematic enough' searches with an explanation of recorded coverage and uncertainty |
| Literature Workspace, study matrix | Included-study extraction wording | Rewritten to emphasise actual contexts, methods, measures and source-specific traceability |
| Literature Workspace, synthesis | Evidence-map explanation and theme classification | Explained that stance tags are working classifications. Stance must be chosen explicitly, without treating a blank selection or a legacy theme label as supportive evidence |
| Literature Workspace, gap | Summary-card and rationale prose | Explained that no quantity of studies or themes establishes a gap by itself |
| Literature Workspace, claims | Claim-source audit and displayed statuses | A matching ID is no longer described as evidence that a paper supports a sentence. The audit now distinguishes unique included, pending, excluded and unknown IDs; the interface displays these caveats rather than presenting a green multi-source synthesis label |
| Literature Workspace, outline | Paragraph-planning prose | Removed a rigid recipe requiring every paragraph to follow the same multi-source and transition structure. The revised guidance follows checked evidence and meaningful progression of ideas |
| Literature Workspace, source form | Source-type and theme-stance selectors | Added explicit unselected states to prevent an unclassified source silently becoming a peer-reviewed empirical article or a new theme defaulting to 'supports' |
| Novice friction guard | Global absence-of-research warning | Removed the arbitrary count shortcut at ten included sources/two searches. A claim that no research exists is now flagged for substantive correction regardless of search-count thresholds |

The review retained correct labels and existing useful instructions elsewhere. It did not rewrite curriculum content or the already completed stage summaries, 113 field guides, 90 glossary definitions or 32 laboratory panel descriptions.

## Specific methodological integrity repairs

**Claim-link evidence.** Previously `claimAudit` counted any existing referenced ID, including sources excluded from or pending eligibility review, and duplicates could inflate the count. Its `sourceCount` now counts unique IDs whose current status is `Included`, and it returns `includedIds`, `pendingIds`, `excludedIds` and `missingIds`. Even an eligible source link is only a pointer for human verification, not a content-supported citation. The UI no longer equates the count with verified synthesis.

**Theme evidence.** The `gapReadiness` count of multi-source themes now excludes background-only tags and uses distinct eligible source IDs with an explicit supporting, conflicting or mixed stance. Previously a theme record with no stance was treated as supportive. This default was removed. The source form now offers an unselected evidence stance; the saved record and matrix can show 'unclassified' without silently representing support. A new source similarly has a blank source-type selection until the student chooses an appropriate type.

**Gap warning.** A high number of sources and search entries does not validate a field-wide absence claim. `novice-friction.js` no longer lowers the severity of the warning automatically at an arbitrary source/search count. The message asks students to examine actual search coverage and write at a defensible level of specificity.

## Source commits

- `assets/literature.js` claim linkage/readiness [ee1a180](https://github.com/gmoon-code/research-methods/commit/ee1a1807e9b112c591d9c3d7ba2ffe56e82b9a7f) and unclassified stance [e0ff450](https://github.com/gmoon-code/research-methods/commit/e0ff4505cae5764ba143fd6c04a561156e3c8278)
- `assets/app.js` prose and claim status [9c545dd](https://github.com/gmoon-code/research-methods/commit/9c545dd9a2e13505791fd8df16ac0ee80b42c172) and deliberate classifications [abfe96d](https://github.com/gmoon-code/research-methods/commit/abfe96d6a6b3e05d127e56e5cc878ca313df6464)
- `assets/student-guidance-ui.js` example boundaries [9994515](https://github.com/gmoon-code/research-methods/commit/9994515f9a9ff6211e33e8d058e26e62ccc94cfd) and example heading [9628312](https://github.com/gmoon-code/research-methods/commit/96283125b2655ac352b59bbcd6145ba21d04d28b)
- `assets/student-help-ui.js` [9d94511](https://github.com/gmoon-code/research-methods/commit/9d945111c7a74fa1e37c0b01c96cbe8234d2f910)
- `assets/rescue-ui.js` [d7de858](https://github.com/gmoon-code/research-methods/commit/d7de8581ecb439d80ff9832c414aeb61d549fd78)
- `assets/novice-friction.js` [db724cd](https://github.com/gmoon-code/research-methods/commit/db724cdb20f914f6ee57e27a9bb1a15216042cfc)

## Regression verification

- Extended `tests/literature.test.js` to check unique eligible source IDs, pending/excluded/missing IDs, background-only themes and unclassified stances: [769d0d5](https://github.com/gmoon-code/research-methods/commit/769d0d5464950c1664d948db91475868f5389c06)
- Extended `tests/novice-friction-v26.test.js` to check that twelve included sources and three search entries cannot clear a global literature-gap warning: [f9ef921](https://github.com/gmoon-code/research-methods/commit/f9ef92122fcd73d44f3bc5b3c283a4f08283afb5)
- Added rendered stage/response/laboratory guidance content checks in `tests/student-help-guidance-content.test.js`: [60e1d56](https://github.com/gmoon-code/research-methods/commit/60e1d5664c35ff3a79af8f8070ecb67ecf79f6c5)

**Executed five actual test files against the current repository JavaScript, using an isolated V8 runtime with the tests' Node-style `require`/`global.window` bootstrap adapted to inject the retrieved source.** `tests/literature.test.js`, `tests/novice-friction-v26.test.js`, `tests/student-guidance.test.js`, `tests/novice-guidance-v22.test.js` and `tests/student-help-guidance-content.test.js` all passed. Eight relevant JavaScript assets passed syntax parsing. An intermediate rendering assertion failed only because the private audit check used incorrect capitalisation; direct inspection confirmed the expected content and the committed rendered-content test passed. This is **not a Node CLI, actual browser or published deployment test**.

## Unresolved dependencies

1. A legacy project with an explicitly stored `Included` status might still have been included before full eligibility screening. The source-status correction cannot infer whether that saved decision was valid. Existing records require a review of their actual eligibility evidence.
2. Search-log entry creation currently accepts missing metadata and has not been interactively tested. A logged item is not proof of an executed search. A follow-up should review input requirements, error messages, records imported from earlier versions and export fidelity.
3. `claimAudit` can confirm eligibility and source-ID existence, but cannot independently confirm that the full text of a paper supports a user's particular claim. Student-facing guidance now states this limitation.
4. New and legacy source-type and theme-stance behaviour has not been checked with browser input events or persistent saved-project migration.
5. The overall site's writing content outside the audited research-methods guidance, browser tests, cross-page consistency and live-publication parity remain outstanding.

## Exact next continuation point

**Stage C-X3c8c | Search-log provenance and remaining Literature Workspace recording/exports.** Individually audit entry requirements, search date/database/query/result-count handling, possible blank or proposed entries, and the relationship between `assets/app.js`, `assets/literature.js`, search-log CSV output, stage guidance and novice-friction claims. Check the status of imported legacy logs and prevent empty records being treated as completed searches, while retaining legitimate historical data. Then inspect remaining writing/export fallback labels and continue with broader cross-system and browser/deployment verification. Keep changes small, test actual code paths and preserve already audited guidance.
