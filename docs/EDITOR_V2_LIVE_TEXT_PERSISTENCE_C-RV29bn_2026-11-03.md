# C-RV29bn | Live text persistence test restored to a valid interaction

**Date:** 3 November 2026. **Continued from:** C-RV29bm. **Scope:** `tests/academic-editor-v2.spec.cjs:792–818`, the `setWorkspaceMode()`, `saveLiveText()` and `loadLivePage()` implementation paths, and actual Chromium logs.

## Source and browser evidence

The preceding academic editor test timed out after 30 seconds without identifying which action stalled. A diagnostic-only test commit [`da87429`](https://github.com/gmoon-code/gmoon-code.github.io/commit/da8742956fc9d3c000dae3b958f25fe9360c5b70) added stage logging and bounded click operations. In actual [Chromium workflow 41595903282](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41595903282), the initial live text edit survived switching to Free Design Canvas and back. The test then attempted to click the **same already-selected heading**. Playwright's hit-test log explicitly showed a selected-object **southern resize grip** intercepting its centre click for six seconds. The failure therefore occurred **before** the test reached its reload or page-navigation assertions, and did not demonstrate draft loss.

## Scoped correction

Commit [`8cc69f0`](https://github.com/gmoon-code/gmoon-code.github.io/commit/8cc69f057610cb13fd8cc9d525fc42de8dc5f2c6) removed the redundant second click, asserted that the existing text-editor action remains enabled after returning to Live mode, and targeted the subsequent post-reload heading click inside its text area. Temporary stage logging was removed. All original persistence assertions remain, including mode-switch, reload and navigation/return.

## Independent verification

Real Chromium [workflow 41596098135](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41596098135) explicitly marked the original persistence case **passed**, producing **56 passed / 1 failed** in the broader academic-editor suite, compared with the earlier **55 passed / 2 failed**. The remaining failure was the independently documented text-box reflow geometry assertion, investigated next as C-RV29bo.

No editor persistence algorithms, public academic text, original research data or citation claims were changed.
