# C-RV29bo | Text reflow browser geometry measured in the correct coordinate system

**Date:** 3 November 2026. **Continued from:** C-RV29bn. **Scope:** `tests/academic-editor-v2.spec.cjs` heading reflow case, `setLiveReflowDimension()`, the source-element CSS reflow rules and the test fixture's actual Chromium coordinates.

## Diagnostic sequence and established cause

The historical academic-editor Chromium test expected a neighbouring paragraph to move less than **4 pixels** in outer-window `boundingBox()` coordinates when a heading was narrowed to **150 CSS pixels**. The recorded disagreement was **14.84375 pixels**.

Source inspection showed that `setLiveReflowDimension()` increases the heading's reserved height to accommodate wrapped text, explicitly allowing neighbouring elements to move in normal document flow. A diagnostic test in commits [`8b507e4`](https://github.com/gmoon-code/gmoon-code.github.io/commit/8b507e48210911735cf4fcd89cf7705341c7d85e) and [`608502b`](https://github.com/gmoon-code/gmoon-code.github.io/commit/608502bbafc5e72322c7a55f4fecfa1489feaafd) measured document-local geometry in Chromium. **Before reflow**, the heading height was **34 px**, and its neighbouring paragraph top was **88.890625 px**. **After reflow**, heading height was **70 px**, and neighbouring paragraph top was **124.890625 px**. Both changes were exactly **+36 px**. The enclosing editor iframe itself moved within the outer application; its outer screen coordinates therefore produced a misleading **−14.84375 px** neighbour displacement. The numeric heading width reached **150 px**.

These measurements established that the site content's natural flow and reserved wrapping height behaved consistently; relaxing the old assertion blindly or changing editor reflow code would have been unjustified.

## Test-only correction and verified result

Commit [`ebde9b7`](https://github.com/gmoon-code/gmoon-code.github.io/commit/ebde9b7ee333ec721d2ace95d3bf134816138cee) changed the test to measure heading height and following paragraph top **within the same iframe** before and after reflow. It verifies that the heading grows by more than 20 px and that the paragraph moves by the same amount, within a strict **2 px** tolerance. Text font-size, undo/redo, exported CSS and reload assertions remain intact. The test name now describes the observed content-aware reserved-height behaviour.

Actual [Chromium academic-editor run 41596652652](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41596652652) explicitly passed both the text persistence test and the previously failing reflow test, reporting **57 passed / 0 failed**.

## Verification limits

Earlier independent runs recorded **51/51** primary Editor V2 source browser cases, **55/55** advanced interaction cases and **19/19** source-parity/live-object cases. The current academic-editor suite is **57/57**; these are **separate, source-revision-scoped Chromium CI results**, not a simultaneous cross-browser test of every public-facing route. Public academic HTML, research records, scholarly bibliography and student data were not modified.

**Next stage C-RV29bp** should reconcile the precise tested Git commit of each suite against the current repository and check whether the test-only commits that followed their passing runs could affect their conclusions. Then prioritize genuinely unresolved public rendered-browser parity, original research/ethics evidence and source-tier gaps rather than repeating completed academic copy edits.
