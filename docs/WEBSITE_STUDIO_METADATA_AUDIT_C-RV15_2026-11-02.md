# Stage C-RV15 | Website Studio duplicate-page metadata and route collision audit

Date 2 November 2026. Continued from [C-RV14](WEBSITE_STUDIO_CONTACT_AUDIT_C-RV14_2026-11-02.md), after an interrupted connection during a Help-dialog copy edit.

## Recovery and exact source inspection

Re-fetched `studio/index.html` and verified the interrupted edit **had committed**. The current help paragraph says a duplicated page retains source content and may retain source search-indexing settings, and asks the author to check citations, image credits and links. Inspected `studio/studio.js`, `studio/navigation.json`, `studio/pages.json`, the existing root HTML inventory and the 15 editable Studio manifest entries.

Discovered **23 root HTML files**, of which **15** are listed as editable in Studio. The remaining **eight** are `404.html`, `about.html`, `editor-v2.html`, `editor.html`, `editors.html`, `fluid-layout-lab.html`, `pungmul.html` and `writing-biological-classification.html`. The page creation collision check had tested only editable manifest pages and `BASE_PAGES`, leaving these unlisted published URLs available for erroneous reuse. This was a source integrity issue because a new draft could collide with another authored research or tool page.

## Implemented source corrections

1. **Protected existing unlisted routes.** Added a `RESERVED_PAGES` list containing all eight root routes not present in `studio/pages.json`, and updated `createPage()` to reject requested paths in that list. This preserves published page and redirect addresses even when the authoring manifest deliberately omits them. Production commit [4ae0d38](https://github.com/gmoon-code/gmoon-code.github.io/commit/4ae0d38bf4b2acf906e9f2cc7d320184ca3902b0).
2. **Always assign a new page canonical.** Checked all 15 editable source pages. Fourteen have canonical link elements; `teaching-osmosis-practice.html` deliberately has `noindex, follow` and no canonical. The former optional chaining `?.setAttribute('href', ROOT+path)` silently did nothing when duplicating the latter. Revised creation to add a missing canonical link to the cloned document head, then set it to the new path. The duplicate-page dialog now also specifically directs the author to check inherited citations, image credits, links and search-indexing settings. Commit [1ae3bf2](https://github.com/gmoon-code/gmoon-code.github.io/commit/1ae3bf2d4411b4b475d411a7bb5990ad90bb36e6).
3. **Regression coverage.** Expanded `tests/studio-author-content.test.mjs` with an actual filesystem inventory of root `.html` files, asserting that every one is present in the editable manifest or reserved-page list, with specific historical/academic pages protected. Updated the canonical assertions to check creation when missing and added a known non-indexed osmosis source and duplication guidance check. Test commits [fb6a2b6](https://github.com/gmoon-code/gmoon-code.github.io/commit/fb6a2b6c13f9a6ac68a541588e95336f48c316c5) and [839f1f2](https://github.com/gmoon-code/gmoon-code.github.io/commit/839f1f21a501d69a9d43e14124d1cbf889407ddf).

## Actual verification and interpretation

- Original Contact-vs-About manifest regression completed successfully in [run 41360372353](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360372353).
- New root-page inventory regression completed successfully in [run 41360831315](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360831315).
- The intermediate [run 41360943646](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360943646) failed because an old test still expected the removed optional-chained canonical implementation. The test was updated to assert the improved semantics. **The final [run 41360983025](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360983025) completed successfully** with the expanded test suite. This is a genuine Node 22 regression run on repository sources, not merely author-calculated assertions.

The work made no changes to public biography, scholarly conclusions, research methods or selected photos. It preserved the redirecting `about.html` and existing visitor routes. If an author duplicates a no-index page, the new copy can still intentionally retain `noindex`; the dialogue explicitly explains that review responsibility. No claim is made that copying a published page transfers copyright rights for photos or references.

## Remaining limits

The corrected test suite is source-based. It does not cover authenticated publishing, in-browser HTML editing, preview image loading, or whether public GitHub Pages serves the newest commit. Those need separate live parity or browser tests. The six previously identified Editor V2 interaction regressions are unaffected. The private 20-study charting data, student-response and consent/rater records, personal credential documents and preferred contact-email choice remain unavailable or unresolved.

## Exact next checkpoint

**Stage C-RV16 | Public served-file parity, canonical/indexing and audit closure boundaries.** Attempt to retrieve the publicly served academic pages and compare their visible titles, canonicals, research statuses and corrected Massachusetts 5–12 licence wording to the repository sources, without assuming deployment success equals byte parity. Inspect the latest GitHub Pages deployment status first, then conduct a manageable reader-visible cross-page spot check if the site is accessible. Record stale or absent content precisely; do not alter public pages merely because a crawler cannot retrieve them. Check the outstanding Editor V2 browser regressions and any author-dependent primary documents as separate evidence tracks. Update the comprehensive coverage ledger and a next checkpoint.

**Status:** C-RV15 source protections and duplication guidance corrected, native source regression successfully completed. Browser and published-site verification remain open.
