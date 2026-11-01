# Editor V2 content audit and real-browser regression evidence | C-ED5

Date 1 November 2026. Continued after [C-ED4](EDITOR_CONTENT_AUDIT_C-ED4_2026-11-01.md).

## Coverage

Reviewed the remaining high-risk instructions in `editor-v2.html`, including live-source verification, preview/publishing, grouping, same-size and alignment commands, photo effects, on-page deletion, responsive screen variants, local storage and mode switching. Compared with the relevant `editor-v2.js` source for source provenance, original/added grouping, draft storage and the source-preserving publication assembler. Previously corrected claims were retained. The larger website's scholarly research text was not altered in this interface-specific stage.

## Current browser evidence and its limitations

Inspected **actual GitHub Actions job logs**, not merely run-status badges. Three editor browser runs on commit `13e8334205684d15f508408019ca87c0d722601b` failed after Playwright and Chromium setup succeeded.

- [Editor V2 browser regressions, run 41317174254](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41317174254) and [Advanced editing interactions, run 41317174172](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41317174172) each recorded **four failed cases** from `tests/editor-v2-live-source-multi.spec.cjs`. Failures concern image scaling/effect persistence (expected computed background-size `1 1` versus `1`), format painter leaving a source image's geometry unchanged, matched-width group geometry (57.25px error against a tolerance below 2px), and multi-selection of differently sized boxes (expected 3 selected, observed 1).
- [Academic editor v2 browser checks, run 41317174199](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41317174199) recorded **two failed cases** in `tests/academic-editor-v2.spec.cjs`: a 30-second timeout during live-text save/mode-switch/reload navigation, and reserved-flow-footprint behaviour (14.84375px neighbour displacement against a tolerance below 4px).

The errors are direct observations of failing scripted browser expectations on the tested commit. They require functional debugging and comparison with current deployed source before assigning root cause. **These failures are not evidence that the preceding content-only HTML wording changes caused the defects.** They also mean that claims of fully successful Editor V2 browser functionality would be false at this checkpoint. Conversely, separate S4 accessibility and S6 text enlargement runs succeeded for their narrower checks.

## Editorial decision

The source already distinguishes Live website from independent free canvas, describes storage as local, describes source fallback as unverified and records data needed for edits. No additional prose revision in the inspected subset was demonstrably superior. The functional test failures have been documented as a QA issue instead of being hidden by rewriting the instructions or weakening browser assertions. No implementation change was attempted because this stage is the requested scholarly/content audit and root cause was not established.

## Current release confidence

The main website's GitHub Pages builds may be superseded by concurrent commits. A recent successful Pages run was observed on commit `9cdbafd9024ad537d2a1855a56e15f2f0f88ec6b`, while later runs remain a separate state to check. Public served HTML and browser click paths were not independently fetched in this environment. The academic pages retain their prior editorial status and unresolved primary-record evidence checks.

## Exact next continuation

**Stage C-ED6 | Editorial review of remaining supplementary routes and linked support documents.** Inspect `fluid-layout-lab.html` and other remaining public helper/preview text, evaluate whether their claims imply real deployed/published content, and update the supplementary coverage index. Preserve the C-ED5 browser-failure references for a separate functional remediation effort. Then resume the sitewide scholarly accuracy gaps by consulting original research records and verified primary papers for pages already edited, rather than arbitrarily rewriting strong prose.

**Status:** High-risk Editor V2 text reviewed at source and source correspondence established in C-ED1–ED4. Browser verification **failed on identified regression cases**. Functional issue triage pending, overall academic site remains **In progress**.
