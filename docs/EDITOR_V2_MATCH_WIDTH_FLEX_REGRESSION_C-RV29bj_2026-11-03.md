# C-RV29bj | Match-width flex shrink diagnosis and real-browser correction

**Date:** 3 November 2026. **Continued from:** C-RV29bi. **Examined:** `tests/editor-v2-live-source-multi.spec.cjs:993–1009`, the fixture's `.boxes` flex layout, `arrangeSelectedLive()` and `liveLayoutRules()` in `editor-v2.js`. **Outcome:** A genuine selected-object geometry failure was corrected, and the previously failing width-match test now passes in two independently executed Chromium suites.

## Reproduced causal evidence

The fixture's `main` is 830 CSS px wide, containing three flex children separated by 80 px gaps. The original width-match test set the first paragraph's inline width to 310 px, then selected first and second and requested matching widths. The old result differed by 57.25 px.

A new **diagnostic-only** assertion message was committed in test source as `bb69b3a`. The real-browser run [41593508896](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593508896) revealed the exact mechanism:

| Measurement | Browser result |
| --- | ---: |
| Key first-item width **before** match | 286.34375 px |
| Key first-item width **after** match | 263.6875 px |
| Receiving second-item width **after** match | 229.09375 px |
| Width mismatch | **57.25 px** |
| Parent | `display:flex`, width 830 px, gap 80 px |
| First/second/third `flex-shrink` | **1/1/1** |
| Second after-match `box-sizing` | `border-box` |

Thus setting an explicit CSS `width` in a flex row did not enforce the displayed width. As the receiving item's basis increased, the flex layout shrank **both** reference and receiver and changed the reference measurement after the operation. This was neither a safe candidate for assertion relaxation nor a fabricated browser problem.

## Narrow implementation repair

Commit [`c3da95e`](https://github.com/gmoon-code/gmoon-code.github.io/commit/c3da95eccc7d7adfe6f0e6c7562f1e929ca25260) updated `editor-v2.js` only.

- The existing source-element reflow CSS now includes `flex-shrink:0!important` for a source whose width/height are explicitly specified by a geometry edit. This makes editor-set dimensions authoritative inside flex layouts.
- For `matchWidth` and `matchSize`, the first selected **flex item** receives a geometry patch even if its requested width has not changed. This locks the key object's currently rendered width before matching the receiver. Other parent layouts and non-size matches preserve their previous skip behaviour.
- Existing width/height minimums, image crop/effect logic, editable text, underlying source markup, original links, and layout history are unchanged.

The original numerical width-match tolerance remains **under 2 pixels**. A detailed diagnostic remains available if the assertion ever fails again.

## Independent Chromium verification

The corrective commit caused new GitHub Actions runs; actual decoded job logs were examined.

| Workflow and run | Result | Important observations |
| --- | --- | --- |
| [Primary Editor V2 browser regressions, 41593693047](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593693047) | **50 passed / 1 failed** | Width-match now passes; previous 49 passed / 2 failed. Remaining distribution selection reports 1 instead of 3. |
| [Advanced editing interactions, 41593692986](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593692986) | **54 passed / 1 failed** | Explicit passing lines for width-match and picture-format painter; distribution remains. Previous 53 passed / 2 failed. |
| [Source-parity and live-object checks, 41593693011](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593693011) | **18 passed / 1 failed** | Separate unresolved insertion failure; no improvement claimed. |
| [Academic-editor v2 browser checks, 41593693042](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41593693042) | **55 passed / 2 failed** | Existing text/persistence or reflow cases remain; log shows an unrelated 14.84375 px geometric discrepancy. |

This validates the specific match-width behaviour in the tested Chromium fixture. It does not establish complete cross-browser/production correctness or imply that all flex layout cases have been checked.

No public academic HTML or research data were modified. The historical 16-page static source-delivery evidence remains separate from browser-editor test results.

## Exact next checkpoint

**C-RV29bk | Distribution source-selection loss.** Begin with `tests/editor-v2-live-source-multi.spec.cjs:1085–1101`, especially the first `#liveMoveX` input and the subsequent three-element `selectSourceGroup()` call. Examine whether a moved/translated second item overlaps target clicks, resulting in the test's **“1 selected”** observation, or whether selection state is lost in `selectLiveElement()`, the group management code, or the layout handler. Obtain in-browser selection/click geometry evidence before changing functionality. Preserve the two distinct academic-editor cases and one image-insertion case as unresolved. Continue primary-research, consent, August scoping matrix, and full public-rendering verification as separately evidence-dependent tasks.
