# C-RV29bp | Passing Editor V2 Chromium suites reconciled to current source

**Date:** 3 November 2026. **Continued from:** C-RV29bo. **Scope:** Actual checked GitHub application files and browser-test files at each separately tested source commit versus the latest default-branch files. No new application code or public academic prose was changed.

## Independent latest recorded browser evidence

| Suite | Tested commit | Outcome |
| --- | --- | --- |
| Editor V2 browser regressions | `68c90369a665cde84fae18db7786e1af8d764de0` | **51/51 passed**, Actions run `41594681399` |
| Editor V2 advanced editing interactions | `68c90369a665cde84fae18db7786e1af8d764de0` | **55/55 passed**, Actions run `41594681368` |
| Source-parity and live-object checks | `4bec181452838125ce46da303c4593730eb4cb4a` | **19/19 passed**, Actions run `41595195115` |
| Academic-editor V2 browser checks | `ebde9b7ee333ec721d2ace95d3bf134816138cee` | **57/57 passed**, Actions run `41596652652` |

The suites ran independently, at different Git commits, with locally simulated website fixtures and Chromium. Their combined result is not a simultaneous all-browser or actual production-public reader verification.

## Exact Git source-blob parity check

For each of the three distinct tested commit SHAs, independently used GitHub file fetch with an explicit historical `ref` and then current default-branch fetch for:

- `editor-v2.js` – **`9a88e1f910fab85cef34d6ee564dc3a6bbfa4710`** in all tested commits and the latest default branch.
- `editor-v2.html` – **`8a1a5a28629e80daaa9d4fef6fbafa1b283bed4c`** in all tested commits and the latest default branch.
- Each suite's corresponding test file – exact byte-identical Git blob at the tested commit and the latest default branch:
  - `tests/editor-v2-live-source-multi.spec.cjs` – `5039732b9fda3766dab0e426314e60779db24442`
  - `tests/editor-v2-live-insertions.spec.cjs` – `a1596c74f5d848ae2a07682d2e8e995a0140ad12`
  - `tests/academic-editor-v2.spec.cjs` – `e15272ec8c30ad9442e39f99d00e00094e4d1005`

All **nine file-pair comparisons** were exact Git blob SHA matches. Consequently, intervening reports and test-only commits did **not** invalidate the concrete successful test results for the unchanged editor application or the three test sources. This establishes source equivalence, not cross-browser equivalence or complete functional coverage.

## Academic/content evidence boundary

The site-wide source editorial inventory historically covers **26 routes**. Independent public HTTPS normalized main-text equality was confirmed for **16/16 sitemap pages** in earlier Actions runs. That is static text delivery evidence and does not test full CSS layouts, scripts, device interactions or browser accessibility.

Outstanding content evidence includes authenticated original AP Biology assessment responses and adjudication sheets, actually executed consent/assent/permission records, final **August** scoping coding rows and their learner-profile adjudications, restricted research originals, owner-decided public contact details and complete production-rendered browser parity. No status tier for any of those was promoted in this stage. The research bibliography register remains historically **42 F / 10 A / 1 M / 0 P** unless original source reading evidence changes.

## Exact next checkpoint

**C-RV29bq | Production-reader rendered-browser verification planning grounded in actual current page assets and route status.** First reconcile current public source/deployed delivery for a bounded representative page, then verify its rendered layout and behaviours with actual browser evidence if available, retaining the previous 16-page static main-text parity as a distinct claim. If production browser access is blocked, document the exact environment limitation and move to the next substantive original-evidence item; do not relabel the site Fully verified.
