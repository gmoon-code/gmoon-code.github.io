# C-RV29bk | Source distribution selection fixture corrected and Chromium verified

**Date:** 3 November 2026. **Continued from:** C-RV29bj. **Scope:** `tests/editor-v2-live-source-multi.spec.cjs:1085–1122`, `selectLiveElement()`, `bindLiveDocument()` and original text-link handling in `editor-v2.js`.

## Evidence from real-browser interaction trace

The test previously selected the second paragraph, moved it 90 px to the right, then attempted to select three source paragraphs by clicking their centres and Shift-clicking. Its count was always **1 rather than 3**, preventing examination of the actual distribution geometry.

A diagnostic-only change in commit [`52eccf6`](https://github.com/gmoon-code/gmoon-code.github.io/commit/52eccf6ded4dbe32c51fa421f7b2a014b343655a) captured the exact clicked element, element centre and incremental selected members. Chromium run [41594219199](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41594219199) showed:

| Interaction | Hit/selection evidence |
| --- | --- |
| Normal click on `p.first` | Centre hit its nested **A** link, count stayed **1**, selected member remained **second** |
| Shift-click on `p.second` | Its existing selection toggled **off**, count **0** |
| Shift-click on `p.third` | **third** selected, count **1** |

The editor intentionally handles ordinary linked text separately in `bindLiveDocument()`, retaining native navigation semantics unless Alt or Shift is used. The test's centre click on `p.first` was therefore invalid for the requested selection operation. The observation does **not** demonstrate a product defect in distribution mathematics or selection-state storage.

An intermediate attempt to click a non-link position (commit `08ebb45`) ran into a 30-second Playwright timeout in both suites and was not accepted as verified.

## Targeted fixture repair

Commit [`68c9036`](https://github.com/gmoon-code/gmoon-code.github.io/commit/68c90369a665cde84fae18db7786e1af8d764de0) uses the existing tested interaction `target.locator('a').click({modifiers:['Alt']})` for the first object, followed by Shift-clicks on the second and third. This selects the first paragraph through its linked text without navigating, as previously established in several other tests in the same suite.

The diagnostic capture remains for future failures and the test continues to demand **three selected source objects** and actual equal **edge-to-edge gaps** after horizontal distribution. No production Editor V2 JS or academic website content was changed in this stage.

## Independent Chromium verification

The push-triggered workflows for the exact test commit completed and their decoded job logs were examined:

- [Primary Editor V2 browser regressions, run 41594681399](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41594681399): **51/51 passed**, including both the earlier distribution case and this previously failing three-different-width case.
- [Advanced editing interactions, run 41594681368](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41594681368): **55/55 passed**, with an explicit passing line for the formerly failing case.

This resolves the last observed failed test within the **two overlapping source-multi browser suites**, not every Editor V2 workflow. The last recorded separate image insertion suite was **18 passed / 1 failed**, and the broader academic editor suite **55 passed / 2 failed**. These require distinct source/test diagnosis.

No public academic HTML, manuscript findings, reference-tier classifications, underlying research records or student data were changed. Previously independently verified 16/16 static academic source-to-served main-text equality is historical delivery evidence, not rendered-browser parity.

## Exact next stage

**C-RV29bl | Editor V2 image insertion timeout.** Inspect the actual failure from the last independently recorded source-parity/live-object workflow, `41593693011` (18 passed, 1 failed), its failing test case and insertion implementation. Verify whether the failure is a browser-test expectation, absent asset, editor action, frame issue, or genuine product defect before changing code. Subsequently revisit the separate academic-editor cases, currently 55/2, and broader academic evidence limits.
