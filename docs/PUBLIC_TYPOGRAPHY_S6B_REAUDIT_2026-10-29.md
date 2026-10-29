# Stage S6b | Closing the Action Research typography overflow | 29 October 2026

## Exact continuation

S6b continues the completed S6 public typography audit from the remaining stress failure on `research-action.html`. All earlier individual page audits and cross-site stages S1–S6 are preserved and not rerun without a concrete regression reason. The isolated condition used headless Chromium at 320 CSS pixels with **both** the WCAG 1.4.12 maximum line/paragraph/letter/word-spacing simulation and 200% text-only enlargement. In S6 this produced a root scroll width of **332px for a 320px viewport**, even though the separate spacing and enlargement tests passed. It was explicitly not labelled a complete S6 pass.

## Diagnosis grounded in browser element geometry

A temporary forensic probe, run with the same complete published HTML and CSS as the S6 browser runner, recorded actual bounding boxes, layout-grid columns and scroll widths. Its diagnostic artifact was **GitHub Actions run [40870663067](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40870663067)**, with evidence artifact **12895707731**.

- The root element was 320px wide with **332px scroll width**. Main was 292px wide, with **318px scroll width**. The overwide ancestor was `#assessment-patterns.section.research-count-section`, not a research evidence table.
- `.research-count-bars` and its `.research-count-row` descendants had fixed three-column grid tracks `55px 125px 72px` at this viewport. The `strong` label **18 of 28** acquired **111px of rendered text width** in an allotted **72px grid track**, causing its text to extend beyond the chart and page. The 7 of 28 label likewise needed **96px**. The document scroll was affected by the longer Unit 3 count.
- Both evidence table wrappers stayed within the main content width at **292px**, with their own internal **620px** scrollable contents. Temporary table containment, paint containment, overflow changes, removal of both research tables, removal of the data-selection graphic and removal of figures **all left root scroll width at 332px**. The table hypothesis was disproved. Applying a broad clipping rule to sections reduced the scroll width to 320px but would have concealed content, so it was rejected and never shipped.
- The probe was removed from the permanent public testing script after isolating the cause.

## Visitor-facing correction

Only `appearance.css` needed a count-chart layout adjustment. No evidence values, scientific interpretations, research figures or accessible table structures were edited.

- On CSS viewports **at or below 900px**, `#main.research-action-page .research-count-row` now places `Unit 2` or `Unit 3` and its complete **7 of 28** or **18 of 28** count on a single first row, with the proportional green bar spanning the entire second row. The track remains full width, and the displayed fill proportions continue to represent **7/28 (25%)** and **18/28 (approximately 64.3%)**.
- On **wider viewports**, the original horizontal label–bar–count arrangement is preserved. The grid now uses natural minimum widths for its Unit-label and count columns, so even magnified `Unit 3` and `18 of 28` remain on one line instead of forcing text out of the column or wrapping.
- Earlier small-screen versions initially fixed 320px but shifted the problem to 768px; extending the stacked layout across tablet widths removed that boundary failure. A first 901px test flagged a **test-only false positive** from assuming that vertically centred, unequal-height wide-grid items must have the same top coordinates. The corrected test uses actual left-to-right element geometry in the wide layout and explicit first-row/second-row checks in the stacked layout. Its final test also verifies the enlarged Unit label remains one line.
- Refreshed the Action Research page's stylesheet cache reference to `appearance.css?v=20261029-s6b-count-bars-v2` in `research-action.html`, so visitors receive the final CSS.
- The production version of the count-bar update is reflected in the repository commits `44c22fb`, `f3d1956`, `519359a` and the final HTML cache-key commit `523b66d`. The first narrow-only version was refined rather than left as an unresolved tablet breakpoint.

## Final verified browser tests

**[S6 full regression run 40872270816](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40872270816)** passed with test exit code **0** and overall job result **success** on exact visitor-source revision `523b66d55f525803d3b4ad96226458dcc9c6a9ca`. The report is `docs/PUBLIC_TYPOGRAPHY_LATEST_RESULTS.json`, with full per-case HTML geometry and screenshot artifact **12896158870**.

- **111/111 passing total cases**, comprising **92/92 independent reading-preference tests** and **19/19 supplementary combined-stress tests** across Chromium and Firefox.
- The combined Action Research cases now cover **320, 375, 640, 760, 768, 900 and 901 CSS pixels**, with no page-wide horizontal overflow, clipped reader content, lost numerical labels or incorrect bar proportions. Both labels occupy the intended order in the stacked and wide states. The core S6 sampling also retains Home, Research and other visitor pages in both engines.
- Count-bar proportions, the visible `Unit 2` and `Unit 3` labels and full count values are asserted programmatically. Final Chromium screenshots at **320 and 901px** were opened and visually reviewed. Both display readable, fully visible labels and proportion bars, including under simultaneous 200% text enlargement and maximum text spacing. The wide 901px image confirms `Unit 2` no longer splits across two lines.
- The existing **S4 Chromium axe and responsive** regression passed in [run 40872270878](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40872270878), and **S5 Chromium/Firefox/WebKit keyboard and forced-colours** regression passed in [run 40872270839](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40872270839), both for the same final visitor-source commit `523b66d`.
- The dedicated Action Research visitor run [40872519583](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40872519583) returned **audit exit code 0**, all **12 tested browser widths** passed, no visual/keyboard/dark-colour errors, and the **six-page A4 print output had no off-page words or missing extracted content**.

An earlier Action Research workflow at source commit `523b66d`, run **40872270889**, also passed all page/browser/print checks but was *marked failed* when two concurrent jobs tried to rebase updates to the same compact report. As a **workflow-only** reliability improvement, `.github/workflows/audit-action-visitor.yml` now has a serial run group and a bounded conflict-safe publish/retry procedure, preserving newer reports instead of failing on concurrent commits. The replacement run **40872519583** succeeded end-to-end, and this infrastructure change did not modify the visitor-facing site.

## Preserved limits and next stage

These measurements are from headless Chromium and Firefox on Linux with injected important user-style settings. CSS viewport testing, visual screenshots and automatic checks do not replace physical Ctrl+plus/native text-only zoom, macOS/iOS Safari, Windows high-contrast operating-system settings, manual screen-reader spoken-output verification or a full WCAG compliance assessment.

**S6b is complete. No unresolved issue remains in the S6/S6b measured matrix.** The next site-wide continuation can focus on bounded manual assistive-technology and native-browser preference checks when a suitable interactive environment is available. Do not repeat S1–S6b or claim unsupported physical-device verification. Retain future regression checks on the 900/901px responsive breakpoint.
