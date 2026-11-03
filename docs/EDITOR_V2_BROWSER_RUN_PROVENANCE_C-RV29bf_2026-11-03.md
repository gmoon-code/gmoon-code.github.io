# C-RV29bf | Editor V2 real-browser regression evidence and cause classification

**Date:** 3 November 2026. **Continues from:** [C-RV29be](PUBLIC_MAIN_TEXT_HISTORICAL_ACTIONS_PARITY_C-RV29be_2026-11-03.md). **Outcome:** Retrieved the **actual GitHub Actions browser workflow runs and decoded job logs** for the last editor-source revision tested on **2 November 2026**. Their failures are real Playwright test results, but one repeated class is a **stale wording expectation**, not a verified editor functional defect. The remaining image/layout failures must be investigated on their own terms. The run-commit test and editor files were compared with the later repository and found **unchanged** at this stage's initial checkpoint. This provenance audit makes no claim of browser tests passing or of a repaired functional editor.

## Original source and CI revision checked

The latest relevant pre-stage editor test source revision was Git commit **`c0acb07aab15e98ddd765510ba5fdb30ebd3c53d`**. A full non-truncated Git tree comparison with the **pre-C-RV29bg** current revision confirmed identical blobs for `editor-v2.js` **`3f6c206637864ecbd6eb3785a40e850fd7d753cc`**, `editor-v2.html` **`5f881ae8fb4bcf207bd97dbaf74ad9ad638c8a7f`**, `editor-v2.css` **`3d50b33601261b38770bb50611e2a0021c7f4f31`**, and all tested Editor V2 `tests/*.spec.cjs` sources. Thus the 2 November test failures were **not simply failures against an unrelated older editor implementation** at this stage's start.

Actual workflow runs, all dated **2 November 2026 at about 12:13 UTC**:

| GitHub Actions workflow | Run and job | Actual result | Scope of evidence |
| --- | --- | --- | --- |
| [Editor V2 browser regressions](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41442875309) | Run `41442875309`, job `125268795090` | **5 failed, 46 passed** | `tests/editor-v2-live-source-multi.spec.cjs` |
| [Editor V2 source-parity and live-object checks](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41442875241) | Run `41442875241`, job `125269119733` | **1 failed, 18 passed** | Source-parity, insertion and arrangement suites |
| [Editor V2 advanced editing interactions](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41442875236) | Run `41442875236`, job `125268796295` | **5 failed, 50 passed** | Advanced canvas plus source-multi overlap, not five novel defects |
| [Academic editor v2 browser checks](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41442875471) | Run `41442875471`, job `125269181499` | **5 failed, 43 passed** with `--max-failures=5` | Broader academic editor suite, not a full 48-case unconditional pass/fail count |

## Distinguish obsolete test expectations from functional failures

The common live-source suite's first failing case `hover preview and keyboard layer navigation identify real source elements without editing them` expected the `#liveEditCount` message to contain **“No saved live-page edits”** after the browser initialized the live draft state. The actual rendered message was **“No live-page draft edits. Original website unchanged.”** The authoritative `renderLiveEditCount()` implementation in `editor-v2.js` explicitly renders that newer wording when there are no current patches, and **“1 draft edit · Original website unchanged”** when one patch exists. The static `editor-v2.html` fallback still had the old sentence. This is a **source copy/test expectation mismatch**, not established proof that live hover preview or keyboard navigation failed.

The broader academic editor suite contained **two** old expectations for `1 saved edit` and **two** for `No saved live-page edits`. Each is inconsistent with the actual newer source status message. At least four of the suite's failing expectations therefore concern the **labelled state text**, although the suite's separate image library failure and live-text timeout cannot be dismissed on the same basis.

The **other four** live-source failures were materially different:
- PowerPoint-style picture adjustments did not yield the expected CSS `scale: 1 1` on reset.
- The format painter test found a mismatch in the target image's preserved adjustments after copying an effect.
- Match widths did not give the expected target width within two pixels while preserving first-selected reference properties.
- Distribution of differently sized source elements failed to retain the expected multi-selection count or spacing precondition.

The separate source-parity workflow's failure was an **image fit/crop insertion test exceeding its 30-second timeout**. This is a real failed test observation, not independently diagnosed proof that the image feature is always unusable to a visitor. These four plus the separate insertion timeout comprise **five potentially functional failures** in addition to the stale status-label assertion. The term **“six outstanding browser regression failures”** should refer to the dated six failing test cases, and the labels should be revisited after the stale assertion is corrected.

## Exact next stage

**C-RV29bg | Status-copy consistency fix, test-only expectation repair and CI evidence.** Replace just the one stale static `editor-v2.html` empty-draft status with the genuine `renderLiveEditCount()` wording and update the literal expectations in the two affected browser tests. Keep published academic prose, authentication, editor operations and algorithms unchanged. Verify exact source diffs, inspect automatically triggered browser CI, and report which tests genuinely remain red. Do not claim functional correction without observed test success.
