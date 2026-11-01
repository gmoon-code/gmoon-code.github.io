# Stage C-X3c8a | Literature screening and synthesis integrity, narrow cross-system correction

1 November 2026. Continued from [C-X3c7c](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c7c_2026-11-01.md). Inspected `assets/literature.js`, the Literature Workspace sections of `assets/app.js`, the existing literature unit tests, and student-guidance test assertions. The source review identified a mismatch between the previously audited instructional descriptions of screening and the actual treatment of missing statuses, legacy theme tags and broad gap readiness. This stage repairs those specific mismatches, **without claiming that the entire application UI has been audited**.

## Verified defects and corrective actions

1. **Unscreeened sources labelled included.** `normalizeProject` previously used `screeningStatus:s.screeningStatus||"Included"`. New or legacy entries without an explicit decision became included in the study matrix and gap counts. The normaliser now preserves explicit valid decisions and defaults missing/invalid statuses to `Pending`. The Add Source form also selects `Pending` for an unclassified source, preventing the browser's first select option from implicitly marking it included.
2. **Synthesis included sources outside eligibility.** The old `uniqueThemes` and `themeMap` scanned all source records, including Pending and Excluded. They now operate on explicitly Included records. As a result, theme CSV and evidence-map counts follow the verified evidence set rather than the entire bibliography.
3. **Legacy theme tags implied support.** A source with an older plain theme tag but no evidence-specific stance was automatically classed as `supports`. The fallback now classifies it as background/context, with a note that supporting evidence was not recorded.
4. **Arbitrary study-count threshold for a broad gap.** The previous `safeToClaimGlobalGap` value was set true after eight included sources and two multi-source themes, neither of which can establish comprehensiveness of searches or field-wide absence of research. It now stays false. The Literature Workspace prose states that no fixed number of included studies establishes a field-wide gap and asks students to assess documented coverage and the eligible evidence.

These changes are consistent with PRISMA 2020's distinction among records screened, reports assessed for eligibility and studies included. Reference guidance at https://www.prisma-statement.org/prisma-2020 and https://pmc.ncbi.nlm.nih.gov/articles/PMC8005925/.

## Source commits

- Literature engine status, theme and gap correction: https://github.com/gmoon-code/research-methods/commit/6549cd23797a56cda8d8089953574e250d75366d
- Add-source form and gap explanation: https://github.com/gmoon-code/research-methods/commit/b906e838ceaba222f1363472d0d4c1254b92f3ef
- Corrected line break introduced during source-form editing: https://github.com/gmoon-code/research-methods/commit/d1210267875ce56c8ef1439711cadedcf343b220
- Legacy theme-tag caution: https://github.com/gmoon-code/research-methods/commit/7edb8d133cb838e15d2bc571f75553b34a0c6459
- New eligibility/synthesis regression assertions: https://github.com/gmoon-code/research-methods/commit/cab394a9d8c3a2b3cd31d9d2f378a47a3797a5b0
- Two pre-existing student-guidance regression assertion corrections: https://github.com/gmoon-code/research-methods/commit/ba3566fb6df197b7edeb9a1600fc2b56f82bdd23 and https://github.com/gmoon-code/research-methods/commit/56d6a9aaa776166eb4a658799ddcbf04873b407d

The last two commits correct stale test expectations about the exact casing of 'planned sample' and 'do not independently establish germination'. No source content was rewritten to satisfy those assertions.

## Verification performed

- Fetched both changed production files after all commits.
- Reconstructed the expected diffs from their original Git blobs. `assets/literature.js` matches exactly five intended replacements relative to `694998549e4f7de50e5cf2340864ce52b282c78a`; `assets/app.js` matches exactly three intended replacements relative to `10ae90e00201273053f944cd0b784becf641457d`.
- Both files successfully parsed as JavaScript in an isolated V8 runtime.
- Executed the **actual repository source and test assertion code** for `tests/literature.test.js` and `tests/student-guidance.test.js` using a minimal adaptation of their Node `global.window` and `require` bootstrap. Both suites now pass in the isolated V8 execution environment, with `PASS literature workspace engine` and `PASS student guidance coverage`.
- This was **not a Node CLI execution**, and no DOM/browser interactions, saved-project migrations, network publication parity or complete system integration test were performed.

## Residual uncertainty

Explicit `Included` statuses already stored by an earlier version cannot be automatically distinguished from genuinely screened and included records. The correction prevents future missing statuses from silently becoming Included but does not retroactively verify legacy eligibility. Legacy projects may require manual screening review before their existing included sources support synthesis or gap claims.

Other modules still warrant inspection. In particular, the `claimAudit` routine establishes ID existence, not whether the underlying source was included or its evidence supports the nearby claim. The Literature Workspace also contains additional prose about paragraph planning, search completeness and evidence sufficiency that should receive the same careful content review.

## Exact next continuation point

**Stage C-X3c8b | Remaining literal student-help and Literature Workspace prose.** Audit prose-bearing strings in `assets/student-guidance-ui.js`, `assets/rescue-ui.js`, `assets/app.js` Literature Workspace sections, `assets/novice-friction.js` and `assets/student-help-ui.js`. Include claim-audit labels, search-entry validation language, paragraph-plan wording, note provenance and any unsupported learning/inference promises. Identify unresolved cross-system meaning without assuming each code path has been functionally exercised. Revise only justified instructional text and carefully scoped meaning-critical code, add checks and verify. Then proceed to broader cross-system, Node CLI/browser and deployment parity audits.
