# C-RV29h | Legacy editor page search, element browsing, outline and page-load copy

**Date:** 2 November 2026. Continued from [C-RV29g](LEGACY_EDITOR_IMAGE_LIBRARY_CONTENT_AUDIT_C-RV29g_2026-11-02.md).

**Status:** Source-grounded author-facing status and instructional improvements implemented and checked with isolated JavaScript harnesses. Browser functionality and page-reload conditions were not tested. The comprehensive academic website content audit remains **In progress**.

## Reviewed content and source behaviour

Reviewed the complete `editor.js` implementations of `refreshPageFind()`, `choosePageFind()`, `navigatePageFind()`, `browsableElements()`, `updateBrowseControls()`, `browseElement()`, `updateOutline()`, `loadPage()`, preview setup, editable-index generation and the relevant `editor.html` search, outline and page-switch instruction text. Rechecked the C-RV29g audit ledger and preserved prior C-RV29c–g draft-saving, publishing and image-library safeguards.

The finder searches indexed elements under `main` in the *current preview document*, matching image `alt` descriptions or other element text. Nested matches can be suppressed to avoid redundant parent entries. It calculates a complete count, retains at most 80 navigable results and displays buttons only for the first 30. After selecting a match, the old status said `keys.length results`, potentially presenting 80 as the total even if 95 matched. The initial list also did not explain why navigable results beyond the first 30 were absent from the visible list.

The sequential element browser filters the current iframe to visible indexed elements under `main`, excluding elements inside `nav`. Describing these as `original elements` or all editable content overstated the actual population. The heading outline contains `main h1, h2, h3`, with pending source removals skipped. It does not represent every heading level or every page section. Section reordering is locked where internal navigation makes section moves unsafe. The old static instructions did not adequately qualify that restriction.

The loading function set the preview heading to the newly chosen page **before** fetching that page, meaning a failed network request could momentarily label the existing preview as the attempted destination. The source status already reported a load error and restored selectors on ordinary network failure.

## Implemented revisions

1. **Complete search count retained across navigation.** Added `state.pageFindTotal` to hold the full number of matched indexed elements, while preserving the existing 80-result navigation cap. Both the initial and selected-result statuses now distinguish the full count, selected result and capped navigable range. If more than 30 navigable results exist, the status explains that only the first 30 have listed buttons. Existing keyboard and Previous/Next navigation continue to reach matches beyond the visible list.
2. **Search scope described precisely.** Both HTML initial help and JavaScript status now refer to the current preview and its indexed editable content. Empty search results are not portrayed as proof that no matching content exists anywhere outside the editor's search scope.
3. **Element browser claims scoped.** The dynamic status now says it browses *visible indexed elements outside navigation*, and states how many are available. The static heading and initial message were aligned. Selection remains preview-only and does not assert a permanent original-source change.
4. **Heading outline correctly bounded.** The outline's accessible label specifies heading levels 1–3 in `main`, and the empty message makes the same boundary explicit. The static instruction now notes that sections linked to protected in-page navigation cannot be moved.
5. **Failed page load no longer changes the preview title.** The preview heading assignment now follows successful source retrieval, draft restoration and preview setup instead of preceding the network request. This is a narrow feedback correction. It is not a broad transactional rewrite of `loadPage()`.

All revisions preserve the substantive academic page content, source-provenance constraints and the author's established preference for accurate, proportionate wording. No public academic pages, scholarly assertions or research records were changed.

## Commits and verification

Two narrowly scoped source commits were made:

- `60167e0d11c9c2b474d579b383128daa7fb7a722`, `editor.js`, finder counts, bounded browse/outline feedback and page-heading timing.
- `005bce4521d73da59edbc93c369d132314c8fd61`, `editor.html`, revised find, browse, heading-outline and section-lock guidance.

Refreshed code blob IDs: `editor.js` **`6ae1a8ab5c80d3958a8b5db1ee4d2f85cb8bb7d3`**; `editor.html` **`4e4bc4e409e472f1cf50b5bc8d9cf8a453e707cb`**.

An isolated search/browser/outline harness passed **25/25** checks. Its scenarios included 95 matching elements with 80 navigable and 30 listed buttons, selecting result 46, wraparound, zero and blank queries, absent preview, exclusion of hidden/navigation elements, outline removal filtering and no-heading language. It also verified complete JavaScript syntax, 149 unique static HTML IDs and unchanged source/publication and media-library invariants. The first mock outline attempt failed because the **test fixture** omitted an expected `dataset` property; the fixture was corrected without changing repository code and the full final set passed.

A separate isolated `loadPage()` harness passed **8/8** checks for rejected fetches, HTTP failure, selector restoration and unchanged preview heading; successful loading updated the heading and ended in the expected readiness status. **33/33 applicable final isolated/source checks passed**. These do not count as browser-end-to-end tests or prove reliable actual page switching under all concurrent, stale-response, malformed-document or preview-loading conditions.

## Remaining uncertainty and next checkpoint

**Exact next checkpoint C-RV29i:** inspect *remaining page loading and preview readiness author messages* around stale response tokens, selector synchronisation, request failure, partial parser/index failure, preview frame readiness and old/new page state. Identify whether any of those messages misleadingly imply a fully loaded, editable or saved page. Make only justified, bounded status or copy corrections, test affected cases, update the ledger. Avoid widening the project into an unbounded editor redesign or claiming live-browser parity. If this narrow cluster is exhausted, move to a distinct unreviewed authored-content source as identified from the persistent coverage ledger.

The six previously documented Editor V2 browser regression failures remain independently unresolved. The final-August original S2C scoping 20-study coding matrix, original AP Biology assessments and rater/consent/assent/permission records, and preferred public email selection remain separate source/owner blockers.

**Overall comprehensive academic website content audit: In progress.**
