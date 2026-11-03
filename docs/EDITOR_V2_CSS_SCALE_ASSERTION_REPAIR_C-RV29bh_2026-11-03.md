# C-RV29bh | Neutral picture scale CSS serialization and real-browser CI correction

**Date:** 3 November 2026. **Continued from:** [C-RV29bg](EDITOR_V2_DRAFT_STATUS_COPY_AND_CI_RECHECK_C-RV29bg_2026-11-03.md). **Outcome:** The image-effects reset failure was caused by an **over-specific browser-test expectation**, not verified evidence that image rotation or flip reset had failed. A single test assertion was corrected to accept semantically equivalent neutral CSS serializations. **Fresh Chromium real-browser CI confirmed the case now passes**; the source-multi suite improved to **48 passed, 3 failed**, and the advanced suite to **52 passed, 3 failed**. No editor implementation, image cropping, published academic content or source-data/ethics claims were changed.

## Original failed result and exact implementation

Actual [3 November source-multi regression run 41591212963](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591212963), job `125768135812`, showed an assertion failure at `tests/editor-v2-live-source-multi.spec.cjs` line 888 after `#livePictureReset` was clicked.

The test performed a rotation of **37°**, horizontal flip, opacity adjustment, brightness and shadow on an image. It switched device views, reloaded and confirmed the desktop adjustments persisted. The reset step then successfully passed `rotate=0deg`, but the following CSS `scale` assertion demanded **`"1 1"`** and actually received **`"1"`** from Chromium's computed style.

The **CSS `scale` property allows one-value uniform scaling** as well as the equivalent two-value horizontal/vertical representation. In this context both `1` and `1 1` indicate neutral scaling on both axes. The editor's unchanged `pictureEffectsCss` generates `scale: 1 1` for neutral effects, and Chromium is permitted to serialize the resulting computed value as `1`. The failure alone therefore did **not** warrant a change to the application's picture-effects reset implementation. The adjacent rotation test had already passed.

The original runtime function `resetPictureEffects()` in `editor-v2.js` remains unchanged. It removes or resets the current device's picture effects and refreshes the live CSS rules, without deliberately altering stored image-crop parameters. The test was failing on strict **string serialization**, not demonstrating a changed crop or a residual flip.

## One exact test assertion, without editor code changes

`tests/editor-v2-live-source-multi.spec.cjs` at original source blob **`f9fe647a8d8969b601f7888f18ee85e70964689e`**:

**Before:** `await expect(img).toHaveCSS('scale','1 1');`

**After:** `await expect(img).toHaveCSS('scale',/^1(?: 1)?$/);`

The new assertion accepts only the two relevant neutral forms **`1`** or **`1 1`**, not an inverted or non-unit scaling value. It remains a meaningful test of successful image flip reset. The change was committed as **[`774786f`](https://github.com/gmoon-code/gmoon-code.github.io/commit/774786f4d384a066362e64d340a8a761f2bc42b8)**, source blob **`abe789622450f5d025cb33bf6036d399b31d64e4`**.

After committing, independently re-fetched the current test file and prior source blob. The complete new source matched **exactly one substitution**, with **no other change**. Also re-fetched `editor-v2.js`; it remains source blob **`3f6c206637864ecbd6eb3785a40e850fd7d753cc`**. Thus no application behaviour or main-site claims were changed.

## New real browser evidence after commit

The repository's push-triggered GitHub Actions automatically executed the source-multi test again, using real Chromium in a same-origin local test server. Both current workflow jobs were retrieved with their **actual decoded job logs**.

| Workflow | Tested source commit | Result |
| --- | --- | --- |
| [Editor V2 browser regressions, run 41591956858](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591956858), job `125770479038` | `774786f4...` | **48 passed / 3 failed**, versus previous **47 passed / 4 failed** |
| [Editor V2 advanced editing interactions, run 41591956810](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591956810), job `125770478531` | `774786f4...` | **52 passed / 3 failed**, versus previous **51 passed / 4 failed** |

The image-effects reset test no longer appears in the failed-case sections; the **three remaining, overlapping source-multi test failures** are:

1. **Format painter picture adjustments**. The test's second tiny image was **12×6 pixels** before applying copied effects, and became **64×24 pixels** in the browser after. The image URL itself was unchanged. This observed size change **requires implementation-versus-expected-behaviour investigation**, not a new assertion that reset failed.
2. **Match widths**. Difference from expected width was **57.25 pixels** in the pre-fix browser run, rather than less than 2 pixels.
3. **Distribute source boxes**. The multi-selection indicator showed **one selected** instead of the expected group before the distribution assertion.

The separate `Editor V2 source-parity and live-object checks` suite still had **one image-insertion timeout** in its [new run 41591205489](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591205489), and the broader [academic-editor suite run 41591224230](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591224230) still had **two distinct cases** failing, one live-text persistence timeout and one reflow text-box geometry condition. These were not changed or retested as part of C-RV29bh's single-test patch. Thus **six distinct observed failed test cases remain across the current suites**, counting the three overlapping source-multi cases only once. A failed test is evidence of a test mismatch, not automatic proof of a specific product defect.

The previously observed **all-16 public sitemap page normalized main-text parity success** at [run 41591205491](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591205491) still applies to the source revision tested on 3 November at 06:39 UTC. No public academic page HTML was altered by this stage; subsequent changes were tests and audit documentation. Live rendered DOM, CSS/visual and interactive browser parity are separate.

## Exact next checkpoint

**C-RV29bi | Editor V2 format-painter image-size preservation, source-versus-test causation.** Inspect the format painter implementation and test's tiny-image fixture in the precise failing 12×6→64×24 comparison. Establish whether a minimum-size rule applies intendedly to source-page image formatting, whether the test mis-specifies the correct dimension semantics, or whether copying only picture effects unintentionally changes dimensions. Preserve image URL/content, crop and effects independently. If an actual user-visible defect is proved and a narrow code correction is safe, apply and verify it with the real Chromium workflow. Otherwise document the unsupported interpretation without rewriting tests merely to hide a failure. Keep all other Editor V2 failures and unavailable original study/consent evidence separate.
