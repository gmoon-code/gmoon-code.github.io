# C-RV29bl | Added-photo crop regression aligned with visible editor, verified in Chromium

**Date:** 3 November 2026. **Continued from:** C-RV29bk. **Examined:** original failed source-parity insertion Chromium log for workflow 41593693011, test `tests/editor-v2-live-insertions.spec.cjs:211–228`, current Editor V2 HTML photo inspector, `setLiveObjectDesign()`, `applySelectedImageCrop()`, and image crop CSS generation. **Outcome:** Corrected outdated browser-test assumptions; all 19 source-parity/live-object checks pass on fresh real Chromium.

## Identified outdated test interface

The historical [workflow 41593693011](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593693011) recorded **18 passed / 1 failed**. The specific test `Added photos fit or crop their frame without stretching` timed out on `page.locator('#liveImageFit').selectOption('cover')`. The current HTML intentionally places `#liveImageFit` in the **hidden `#liveAddedImageFit` legacy inspector**. The runtime also always hides that group. Therefore the test was requesting a user interaction that the current visible editor does not offer.

The actual visible photo interface exposes `#liveCropShape`, crop edges, zoom and frame controls. The outdated test was replaced with an integration check that selects `rounded` using `#liveCropShape`, changes the independent inserted-image width to **410 px**, and checks the original-image frame and preview keep the resulting crop shape. This change affects test code only, not editor implementation or website prose.

## Correct CSS semantics established by independent browser

An intermediate fresh Chromium run after commit `362259e` confirmed the new visible crop control worked and width reached 410 px, but the revised test still incorrectly expected `object-fit:contain` on an actively cropped photo. Chromium instead returned `object-fit:none`. The current image crop implementation intentionally uses a background-image crop layer while shifting the original `img` pixels outside the paint area to avoid stretching. In that mode, `object-fit:none` plus a nonempty `background-image:url(...)` and the mask is an appropriate rendered state.

A second narrowly scoped test-only correction in commit [`4bec181`](https://github.com/gmoon-code/gmoon-code.github.io/commit/4bec181452838125ce46da303c4593730eb4cb4a) therefore asserts the actual crop representation. It still checks selected image and preview both preserve **410 px width**, **12 px border-radius**, **object-fit:none** and a URL-backed cropped-image background, with the initial uncropped image still `contain`.

## Real Chromium verification

[Editor V2 source-parity and live-object checks run 41595195115](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41595195115), at `4bec181` source, independently recorded **19 passed / 0 failed** in decoded job logs, including an explicit passing line for the previously failing added-photo crop test.

No production editor JS or public academic HTML was changed. In particular this suite's success is not a verification of real GitHub publishing permissions, complete visual parity or underlying original scholarly evidence. The website's historical separately verified 16/16 static normalized main-text delivery check remains a narrower claim.

## Exact next checkpoint

**C-RV29bm | Academic-editor browser regressions.** The last reviewed academic-editor suite on the earlier app commit had **55 passed / 2 failed**. Retrieve the exact current or most recent academic-editor workflow, identify the two test cases and their expected versus actual browser behaviour, then diagnose each independently. Do not infer all application interactions are error-free from the passing source-multi and source-parity suites.

The comprehensive content-audit evidence gaps concerning original student work, consent records, final August scoping matrix, and full public rendered-browser parity remain open.
