# C-RV29ee | Fluid Layout Lab transfer, review-count and status-language corrections

**Date:** 4 November 2026. **From:** [C-RV29ed](ACADEMIC_PUBLIC_CONTENT_COVERAGE_CLOSEOUT_C-RV29ed_2026-11-04.md). **Scope:** The noindex experimental `fluid-layout-lab.html` interface and JavaScript-produced text for saves, supported additions, import/export, preview-review and transfer to the legacy `editor.html`. **Disposition:** Five exact user-facing wording corrections in one auxiliary HTML file, grounded in the actual sending and receiving source code. No academic research/teaching page or user-supplied manuscript changed. **Website-wide source/auxiliary verification: In progress.**

## Baseline and original claim discrepancy

At the start, repository `main` was `e4bc580765deb87ef387b9d906a90429669a0ad8`, with a complete nontruncated tree including **26 current HTML paths** and zero intervening changes since the completed 19-page editorial closeout. The Fluid Lab source blob was `12b6bb4572abec9ab6819178f825310f43e435cb`.

The Lab formerly claimed in two places that **all newly added blocks** remained separate or **would NOT transfer** into the legacy editor. This overstated the limitation. The same source exposes three explicit **Add paragraph**, **Add heading**, and **Add link** actions attached to a previously imported paragraph or heading. `stageInsertion` marks those as `insertion` objects, `validateInsertions` restricts and source-checks their anchors, and the transfer handler includes them in `additions` when constructing a version-5 handoff, subject to confirmation and source checks. On receipt, `editor.js` uses `validateParagraphAdditions(payload.additions)` and assigns accepted entries to its **local draft**. In contrast, unconstrained canvas-only objects, picture changes and freeform position changes are omitted from this approved transfer. The previous broad label could therefore mislead the author into believing that supported inserted content was always discarded.

Two smaller discrepancies came from the same interface. Its `responsiveGroupCount` reported the **total configured groups** as if they were all *selected*; only one group can be active in the selector. Separately, its **Publishable edits** review and **Review text edits** status messages showed the resulting additions but did **not count** them in their summary text.

## Exact implemented changes

| Text location | Correction and reason |
| --- | --- |
| Existing on-page transfer guidance, source line 79 | Replaced unqualified “newly added blocks remain separate” with “canvas-only blocks remain separate”, and explained that paragraphs, headings or links staged after imported text can transfer **for review**. |
| `responsiveGroupCount`, source line 115 | Changed the total from groups “selected” to groups “in this draft”, without changing active-group selection. |
| Legacy-editor handoff confirmation warning, source line 330 | Replaced “newly added blocks ... will NOT transfer” with “canvas-only blocks ... will NOT transfer”, and explicitly confirmed that supported content added after imported text is included in the transfer count. |
| Generated applied-page review notice, source line 838 | Included the actual `added.length` count alongside verified text/style and responsive group counts. The review still states that nothing was published. |
| Generated text-review status, source line 698 | Included `insertionBlocks().length` staged content additions in its visible summary, matching the new-content review entries it already shows. |

These are **five source-line wording edits**. They do not widen what the application accepts, change the security of a transfer, alter an actual document or mutate the publication path. The caution to export a portable JSON draft, original-site preservation claims, browser-storage failure feedback and required editor review were retained. The copy uses precise distinctions, avoids em dashes and explanatory prose colons, and keeps user-facing sentences direct rather than promotional.

**Source edits:** [`844e0848`](https://github.com/gmoon-code/gmoon-code.github.io/commit/844e0848e11884ea5766373dd565e384ac6a5b5f) (four lines) and [`22e3b4bd`](https://github.com/gmoon-code/gmoon-code.github.io/commit/22e3b4bd524f8c55765c0544bbf41378b70b7d40) (fifth review-status line). Exact GitHub re-fetches matched both updated full-file source versions; the final blob is `b74f83b89c4e6dc311bd138c37462b4b86b83c7d`. The receiving `editor.js` blob remains `f1065199da36adc42126e67844fd6fa84c7a4f7a` and was **not edited**.

## Verification and boundaries

Eleven targeted source assertions passed against the final Fluid Lab and legacy-editor files. They checked browser-local storage feedback, supported insertion kinds and validation, inserted elements appearing in the applied review, versioned handoff including `additions`, receiving-editor validation and draft assignment, the revised five copy locations, and the unchanged handoff route.

The source-matched [Editor directory and Fluid Lab import workflow **41779187823**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41779187823) **passed** in local Chromium at exact HTML commit `22e3b4bd...`. Its existing regression tests cover directory links, keyboard skip navigation, Contact-page import, expected refusal of the legacy About redirect and retention of the canvas on that rejection. **Those tests do not simulate a new staged insertion or verify every changed generated status at runtime**. The source-matched [authored prose integrity run **41779187754**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41779187754) and [S8 static release run **41779192652**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41779192652) also passed, but S8's fixed 24-resource set does **not** include `fluid-layout-lab.html`, so this stage does **not** claim a live production-website delivery/interaction test of the corrected Lab.

The Lab intentionally remains noindex and unpublished unless an authorized editor separately reviews and publishes changes. No authenticated production publishing action was attempted. This is **source-level copy verified with bounded local-browser regression**, rather than all-device or security certification.

## Exact next continuation

**C-RV29ef | Remaining supplementary generated-copy coverage reconciliation.** The main 19 academic/legacy page editorial reviews are closed at their historically justified tier. Compare the actual current generated help and status copy in `studio/index.html` (Website Studio) and relevant C-RV26/C-RV28 reports before deciding whether one truly unreviewed visitor-facing claim remains. Avoid reopening already completed Editor V2 regression or academic research pages without a new source change. The author-supplied final manuscripts are sufficient for the site's research descriptions and no private background research records are required. The 53 scholarly references remain **46 F / 6 A / 1 M / 0 P**, with limited original access to seven **external** sources. Overall website audit **In progress** for discrete auxiliary text/source and actual authenticated/physical-browser boundaries.
