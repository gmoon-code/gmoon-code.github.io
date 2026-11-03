# C-RV29bi | Editor V2 picture format painter size-preservation correction

**Date:** 3 November 2026. **Continued from:** C-RV29bh. **Scope:** picture format painter in `editor-v2.js` and the exact failed browser test at `tests/editor-v2-live-source-multi.spec.cjs:924–954`.

## Evidence and causation

The previous real Chromium test demonstrated that pasting copied picture formatting onto a second image left its `src` intact and transferred its rotation and vertical flip, but enlarged the receiving image from **12×6** to **64×24** CSS pixels. The test expressly requires the dimensions to stay unchanged.

The implementation in `pasteLiveFormat()` unconditionally called `prepareImageCrop(node,patch,device)`, even when only the image's effects and an unchanged rectangular mask were being transferred. For an original website image, `prepareImageCrop()` calls `normaliseElementBoxLayout()`, which clamps a newly prepared frame to **at least 64×24**. `liveLayoutRules()` then emits an explicit width and height for that frame. This provides a direct code-level explanation for the precise observed browser dimensions. Those limits remain appropriate for explicit crop/resize operations but not for formatting transfer.

## Implemented narrow correction

Commit [`f1372d4`](https://github.com/gmoon-code/gmoon-code.github.io/commit/f1372d4c2744c0f6da5b7dd7bc64404794374c56) updates only the format painter in `editor-v2.js`.

- Existing image effects still copy for the active device.
- `selectedImageCrop()` supplies the receiving image's own framing data.
- The copied mask replaces only the receiving mask when different. No call to the size-normalising crop preparer occurs.
- When masks already match, the receiving image's crop record remains untouched.
- The image `src`, alt text, crop edges, and dimensions are not deliberately replaced; resize and crop commands elsewhere are unchanged.

Re-fetched exact updated lines 1659–1698 from GitHub after the commit. Source blob **`d07b1b1a81426422ce386d879f775a1a5facca4e`**. The prior blob was **`3f6c206637864ecbd6eb3785a40e850fd7d753cc`**. The exact targeted replacement was confirmed on write.

## Verification boundary and next stage

Push-triggered real-browser Actions jobs on commit `f1372d4` were observed **in progress** at audit time: main regressions `41592625209`, advanced interactions `41592625290`, academic editor `41592625251`, source-parity `41592625230`. **Do not mark browser regression repaired until actual logs independently demonstrate the test passing.** New formatted-mask transfers also merit a distinct test because they can involve previously published crop CSS.

No public academic prose, manuscript evidence, ethics statuses, or source-register tiers changed. The independent normalized main-text delivery check from C-RV29bg remains historical evidence for the unchanged academic HTML.

**Exact next checkpoint: C-RV29bj | Retrieve completed C-RV29bi GitHub Actions Chromium results and check picture format painter 12×6→12×6 preservation, along with effects and mask assertions.** If it passes, triage the remaining source multi width match / distribution failures separately. If it fails, inspect actual decoded error lines and correct only the established cause. Maintain separate blockers for image insertion, live-text persistence/reflow, original primary research evidence, and full rendered public browser parity.

## Independent Chromium results recovered after the original checkpoint write

The real-browser push jobs on the exact corrective commit `f1372d4` subsequently completed. Actual GitHub Actions job logs were fetched, rather than inferring success from the source patch.

- [Primary Editor V2 browser regressions, run 41592625209](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41592625209), job `125772602218`: **49 passed / 2 failed**. The picture format painter case at test line 924 ran without a failure, following the formerly failing 12×6 preservation assertion. Previously **48 passed / 3 failed**. Remaining failures are match widths (**57.25 px mismatch**) and distribution selection (**1 rather than 3 selected**).
- [Advanced editing interactions, run 41592625290](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41592625290), job `125772602446`: **53 passed / 2 failed**. The logs explicitly mark `format painter transfers picture adjustments without replacing photo content` **passed**. The same width/distribution failures remain. Previously **52 passed / 3 failed**.
- [Source-parity and live-object checks, run 41592625230](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41592625230), job `125772602399`: **18 passed / 1 failed**, distinct from the format painter work. The separate image-insertion timeout remains for independent triage.

**Conclusion:** The exact former picture-format painter regression is independently verified repaired in two Chromium suites. A test pass does not establish full production-browser parity or guarantee every crop/mask interaction. Other failures are expressly unresolved.

**Revised exact next stage: C-RV29bj | Diagnose source-object match-width discrepancy (57.25 px), starting at `tests/editor-v2-live-source-multi.spec.cjs:993–1005` and the matching editor implementation.** Preserve distribution multi-selection, image insertion, text reflow and academic source-evidence issues as separate tracks.
