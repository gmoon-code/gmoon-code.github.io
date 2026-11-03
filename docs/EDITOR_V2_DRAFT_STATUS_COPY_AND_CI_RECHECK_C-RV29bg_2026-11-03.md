# C-RV29bg | Correct obsolete Editor V2 status copy and test expectations; independently re-run browser checks

**Date:** 3 November 2026. **Continues from:** [C-RV29bf](EDITOR_V2_BROWSER_RUN_PROVENANCE_C-RV29bf_2026-11-03.md). **Outcome:** Implemented **one precise visitor-facing Editor V2 fallback-copy correction** and **five matching test-literal corrections**. The later GitHub Actions real-browser runs independently confirm that the stale-status assertion now passes, while unresolved functional and timing-related test failures remain. A **new successful public HTTPS main-text parity run independently checked 16/16 sitemap academic pages**, including both previously unconfirmed Action Research edits. **No public academic research page, editor functional JavaScript, authentication or publication algorithm was changed.** Overall content/research-source audit **In progress**.

## Direct code evidence for the copy correction

The previous `editor-v2.html` source displayed a static initial label:

> No saved live-page edits.

In the *actual* `editor-v2.js`, the runtime `renderLiveEditCount()` already set the empty state to:

> No live-page draft edits. Original website unchanged.

When there was exactly one pending live patch, the runtime generated **“1 draft edit · Original website unchanged”**. The more precise draft language avoids suggesting the user had published or securely persisted changes, and expressly distinguishes the unpublished draft from the original source. Existing [C-RV29a](EDITOR_V2_DYNAMIC_SOURCE_STATUS_AUDIT_C-RV29a_2026-11-02.md) had already examined the same publication-state concern. The static fallback had been left inconsistent with that source.

**Implemented exact changes:**

1. `editor-v2.html`, original Git blob **`5f881ae8fb4bcf207bd97dbaf74ad9ad638c8a7f`** → **`8a1a5a28629e80daaa9d4fef6fbafa1b283bed4c`**, Git commit **`e4a40217b93b45e5f74c639384a8435899fb5848`**. Replaced just the one static `#liveEditCount` fallback sentence with the exact runtime empty-state wording.
2. `tests/editor-v2-live-source-multi.spec.cjs`, original **`86a4fdd3ad149c13b88d74a07129c7509eb68639`** → **`f9fe647a8d8969b601f7888f18ee85e70964689e`**, commit **`febe680e0463e93661731b8fefb49d34fc499279`**. Replaced one obsolete expected `No saved live-page edits` substring with `No live-page draft edits`.
3. `tests/academic-editor-v2.spec.cjs`, original **`0af1aa7d1edeb69e6762ba5f75b064e55565706c`** → **`4f65cc472c1873d211138daca13617a8185235cb`**, commit **`fdb3fbef8c509037660f563e05b6d70989695a00`**. Replaced two old `1 saved edit` expectations with `1 draft edit` and two `No saved live-page edits` expectations with `No live-page draft edits`.

**Verification:** Independently refetched the current versions and the three preceding original Git blobs. Every full-file comparison matched **exactly the stated substitutions and nothing else**. The old two status phrases have **zero remaining occurrences** in those three edited files. Other tested scripts had no matching stale assertions. The behavior-defining `editor-v2.js` and the stylesheets were not edited.

## Actual new GitHub Actions real-browser results

After the editor/test changes, the repository's configured push-triggered GitHub Actions independently started real Chromium/Playwright suites. I retrieved the **new individual jobs and full decoded logs**, not merely their public status badges.

| Workflow and actual run | Tested code revision | Current test result and interpretation |
| --- | --- | --- |
| [Editor V2 browser regressions, run 41591212963](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591212963), job `125768135812` | `febe680e0...`, after first test-expectation fix | **47 passed, 4 failed**. Previously **46 passed, 5 failed**; the one obsolete status-text expectation now passes. Remaining four concern picture effects reset, format painter image-effect preservation, match widths, and source-box distribution. |
| [Editor V2 advanced editing interactions, run 41591212803](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591212803), job `125768134548` | `febe680e0...` | **51 passed, 4 failed**, versus earlier **50 passed, 5 failed**, overlapping the same four source-multi cases. Do not double count them as eight independent failures. |
| [Academic editor v2 browser checks, run 41591224230](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591224230), job `125768638698` | `fdb3fbef8...`, after the broader test-literal fix | **55 passed, 2 failed** versus earlier **43 passed, 5 failed** when the run stopped at `--max-failures=5`. The two surviving failures are **live text in progress persisted across mode switch/reload/page changes** (30-second timeout) and **reflow text-box footprint** (geometry assertion). The older label-expectation failures no longer appear. |
| [Editor V2 source-parity and live-object checks, run 41591205489](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591205489) | `e4a40217...`, editor HTML copy update | Failed in its existing **image fit/crop insertion timeout** case. This test's source was unchanged by the two later test-file updates, and no success claim is warranted. |

**What remains:** Among the original six named regression test cases in the first two suites, **one stale-label case was resolved and five test cases remain failing** (four source-multi image/layout tests plus the one insertion timeout). The separate broader academic editor suite currently adds **two distinct failed cases** involving live text persistence and reflow, giving **seven distinct observed failing cases across these three sets of test coverage**. These are **tests reporting unexpected results**, not seven established user-level functional failures with independently assigned root causes. In particular, image-insertion and live-text persistence both timed out, and may require separate diagnosis before attributing blame to a specific code path. No false blanket statement that Editor V2 is fixed or that all original failures still reproduce.

## New, stronger public academic site parity evidence

The one visitor-facing `editor-v2.html` update also triggered the existing `Published academic main-text parity` workflow for the academic site's sitemap-listed source. The actual new run **[41591205491](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41591205491)**, job **`125768109854`**, had **conclusion success**.

I retrieved and parsed the workflow job's full recorded page-level results: **all 16/16 academic pages** had remote **HTTP 200**, `equal=true`, and matching **source-text SHA-256** and **served-text SHA-256**, using an independent HTTPS GET from a GitHub Actions runner. The run checked the source revision **`e4a40217b93b45e5f74c639384a8435899fb5848`**, which **already contained both C-RV29ap and C-RV29aq Action Research public wording corrections**. The new successful log therefore provides an independent remote-content check for the **current corrected Action Research main text**, resolving the precise previous main-text parity gap flagged in [C-RV29be](PUBLIC_MAIN_TEXT_HISTORICAL_ACTIONS_PARITY_C-RV29be_2026-11-03.md).

I additionally compared the complete, nontruncated Git trees of that successful test source revision and the later current Git revision **`7d980d680ac8a6fc3ea96bda2fa9d442df9bccac`**, finding **26/26 HTML page blobs identical** after the test; subsequent commits had affected test files and audit documentation only. Therefore the page source tested at 06:39 UTC still corresponded to all 16 indexable page source texts. **This independently verifies remote normalized static main text at that timestamp**, not byte-for-byte HTML, responsive design, web assets, JavaScript-generated content, current-later CDN availability or actual browser interactions. It does not confirm original student transcripts or research ethics.

## Editorial decision and next checkpoint

The correction directly improves one user-visible Editor V2 fallback statement and removes five test assertions that were *testing the wrong words*. It preserves the original site's scholarly claims and the editor's true unpublished draft state. All three exact source edits and the improved CI outcomes were verified. **Do not represent the four remaining image/geometry tests, two academic text/flow tests or image insertion timeout as fixed.**

**Exact next checkpoint C-RV29bh | First remaining live-browser functional failure, constrained diagnosis.** Inspect only the exact code and original test for the **image effects reset CSS `scale` assertion**, with the current browser failure log and editor source. Determine whether it is a test expectation issue like the status copy, an unsupported CSS/Playwright computed-style assumption, or an actual implementation discrepancy. Avoid modifying editor code or original academic content without a demonstrated root cause. If a safe correction is warranted, implement it narrowly, run or collect an authentic browser rerun, and verify image-crop controls remain unaffected. Preserve independent study-data/permission limitations and all currently red tests separately.
