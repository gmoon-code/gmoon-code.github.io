# C-RV29en | Editor V2 final cross-engine photo editing and deployed publishing UX

**Date:** 4 November 2026  
**Continued from:** [C-RV29em](EDITOR_V2_FULL_FUNCTIONAL_PUBLICATION_C-RV29em_2026-11-04.md).  
**Final application revision tested:** `b7ab455ecedc18c18f0c363a506346fd83b36794`.  
**Priority:** Dependable everyday live-page editing, local draft recovery, faithful preview and safe live publication on the 17 configured routes.

## Recovered evidence and the specific unresolved issue

The preceding stage had already established all-page simulated preview/PUT identity, draft recovery, successive commits, rejection handling, the delayed image-library protection and clear live-versus-staging labels. It also verified 22/22 public delivery files and 9/9 HTTPS browser smoke cases at its tested revision. The continued audit recovered additional commits made between conversations, including tests of paragraph changes, repeated edits of the same heading and image-description changes.

At revision `f7a235118`, Firefox **failed four real-page photo-description tests** on Projects, Research, Interests and Pungmul. These failed cases were not presented as passing. Chromium and WebKit passed the broader current-site suite. A focused Firefox workflow reproduced all four failures.

Event-level diagnosis in [run 41806473096](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41806473096) showed that the pointerdown and click both reached the actual parent `#liveImageAlt` textarea. The textarea was the element under the click, but `document.activeElement` stayed `#livePageFrame`, and no focus event occurred. A prior attempt to release or defer source-image pointer capture did not, by itself, remove these failures.

The production fix attaches a narrow click handler to the image path and description fields. If a valid click arrives without native focus transfer, it focuses the clicked field directly with `preventScroll`. This restores the intended user action without changing the edited photograph or bypassing any data validation. An accompanying movement threshold continues to delay source-element pointer capture until an actual drag begins; source and overlay drag regressions are retained.

[Focused Firefox run 41806785009](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41806785009) passed **4/4** original image-description workflows, including saved drafts, preview and source-faithful mocked GitHub publication.

## Final whole-editor regression at deployed cache version

The production `editor-v2.html` JavaScript reference was advanced to `editor-v2.js?v=20261104-editor-v2-photo-focus-v55` to prevent old fixed-version editor code from remaining in normal browser cache. The updated editor source was not merely tested locally; the public deployment workflow checked the corresponding delivered source.

**[Current-website cross-engine run 41807290266](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290266) completed successfully at `b7ab455ec`:**

- Chromium **80/80 passed**.
- Firefox **80/80 passed**.
- WebKit **80/80 passed**.
- **240/240 engine-level check instances** in total.

This suite uses the 17 actual editable page source files with intercepted source-verification requests and mocked PUT responses. Coverage includes original heading and paragraph changes, image descriptions, responsive previews, saved drafts, undo/reload, simulated publication of all 17 pages, exact HTML equality between verified preview and GitHub PUT, two successive publications and no-change protection, stale source and 401/403/409/422 errors, delayed image-library responses, and mode-specific publishing labels. No real token or live write was submitted in these tests.

At the same final revision, the following additional workflows completed **successfully**, each with its own limited scope rather than as one authenticated live session:

- [Core Editor V2 browser workflow 41807290062](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290062).
- [Source-parity and insertions workflow 41807290087](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290087).
- [Advanced canvas workflow 41807290143](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290143).
- [Academic editor workflow 41807290241](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290241).
- [Focused Firefox photo editor 41807290005](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290005).

## Real GitHub Pages delivery

[Public HTTPS byte audit 41807290092](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290092) completed **22/22 exact byte matches** between the GitHub main files and their delivered public HTTPS copies. It initially found `editor-v2.html` still at its earlier public version (21/22); the seventh retry found 22/22. This documents an ordinary temporary Pages/CDN deployment delay without concealing it.

[Public HTTPS editor browser run 41807290371](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41807290371) also completed successfully using the deployed editor UI, source-backed mocked GitHub verification and blocked mutation requests. This provides external-site smoke evidence, distinct from local 80-case browser checks. Successful GitHub Pages delivery of the editor is not equivalent to an owner-authenticated publication of an edited page.

## Release decision, remaining limits and next checkpoint

**C-RV29en passes at the tested automated-browser and public-byte delivery tier.** The previously demonstrated Firefox photo-description defect is corrected in the delivered source. None of the final automated browser suites above reports a current failure. No public academic page prose, photo source, or original scholarly record was modified for this stage.

**Remaining before any claim of perfect end-to-end publishing:** A real repository-owner token has not been used to authenticate and perform a live GitHub Contents PUT, and the real page deployment following such a user-authorized edit has not been checked end to end. Tests do not certify operation on physical phones, all accessibility technologies, every future page shape or all network-failure scenarios. The same-origin iframe/PAT trust limitation documented in [C-RV29ek](EDITOR_V2_TOKEN_ISOLATION_C-RV29ek_2026-11-04.md) remains an explicit security constraint. Do not request the owner to paste a personal token into chat. If an owner chooses to verify live publication, they should use the editor's own credential form and a limited-scope token, and should first make a reversible, low-risk edit and confirm the deployed outcome.

**Next checkpoint C-RV29eo.** Review complex source-element operations and draft/export recovery with fresh negative-case tests only where a concrete coverage gap remains. Prioritize accessibility and functional clarity over speculative features. Reuse all completed CI records, and avoid redundant editorial content changes.
