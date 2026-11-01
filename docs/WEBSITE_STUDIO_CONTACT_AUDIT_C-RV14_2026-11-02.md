# Stage C-RV14 | Website Studio Contact navigation, safe page creation and canonical source

Date **2 November 2026**. Continued from [C-RV13](WHOLE_SITE_COVERAGE_RECONCILIATION_C-RV13_2026-11-02.md).

## Source audited

Inspected published `index.html`, `contact.html`, and the retired `about.html` redirect alongside Website Studio's actual `studio/navigation.json`, `studio/pages.json` and `studio/studio.js`. The public site's visible navigation uses **Contact**; the former About file refreshes to Contact. The authoring application had retained a visible About record and treated the old redirect as the default source when creating new content pages.

This is an **author-facing content integrity and publishing provenance defect**, not an aesthetic UI issue. The HTML metadata inherited from a redirecting template would plausibly redirect newly created pages to Contact even if their main text and title were replaced, and could falsely declare the Contact page canonical for newly created content.

## Changes implemented

1. In `studio/navigation.json`, replaced the visible `About` entry with `Contact` at `contact.html`. This aligns the author-facing navigation list with the actual published site. Commit [bbab245](https://github.com/gmoon-code/gmoon-code.github.io/commit/bbab2457ea33da8e5911f3baabac3ee176bbe4ad).
2. In `studio/pages.json`, changed the locked Main page entry from `about.html` / About to `contact.html` / Contact, leaving the other 14 entries untouched. This makes the actual Contact page editable as a main page and avoids sending an author to a redirect. The current manifest contains **15** records, correcting an old audit's obsolete count of 16. Commit [09c42d8](https://github.com/gmoon-code/gmoon-code.github.io/commit/09c42d86eb9bdb903a95585340e00eda41e8cb10).
3. In `studio/studio.js`, aligned protected `BASE_PAGES` and the page tone lookup with Contact. For new-page creation, replaced the default `about.html` template with the small actual `projects.html` source, which contains normal main content and no HTTP-equivalent meta refresh. The generated page receives a canonical URL using `ROOT+path` rather than inheriting Projects' canonical. Explicit duplication of a selected non-default page still works as before. Commit [09df736](https://github.com/gmoon-code/gmoon-code.github.io/commit/09df7368ac2e4dad39975065bf8556c83941b5d1).
4. Added dedicated [Node regression tests](https://github.com/gmoon-code/gmoon-code.github.io/commit/74c7cab8fb385100e70b9d72064f6b6ce90ad622) and [GitHub Actions workflow](https://github.com/gmoon-code/gmoon-code.github.io/commit/598837b51825212588091d9688195a45df6081d7) to check public-vs-authoring route parity, unique manifests, non-redirect default template and new-page canonical rewriting without introducing forced publication or external credentials.

## Verification

Re-fetched both JSON manifests, the production Studio script, public Home, Contact, historical About redirect and Projects template after source changes. **15/15 targeted source/JavaScript parse and configuration checks passed**: current public Contact, no visible About, locked Contact entry, unique paths, manifest/navigation agreement, protected Contact, correct default Projects template, no redirect in Projects, canonical rewriting, unchanged old public redirect and parsing of production JavaScript.

The native Node workflow was triggered on commit `598837b` ([run 41360372353](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360372353)). **It completed successfully.** The GitHub Actions run confirms both native Node test cases passed in a checked-out repository on Node 22. The accompanying Pages deployment is a separate process. The static test does not by itself exercise actual authenticated GitHub access, DOM page creation, image editing or live public loading. Those must remain separate in the outstanding QA ledger.

## Boundaries

The retired `about.html` file remains an intentionally maintained redirect for old links; its public behaviour was not changed. The existing `studio/studio.js` page creation code duplicates a supplied page when requested. For manually duplicated pages, prospective authors should still review inherited page-specific content and metadata; the corrected canonical does not guarantee a complete semantic or accessibility audit of the new draft.

No private credential was used and no publication action was attempted. C-RV14 changes the Studio authoring source and data, not the established academic biography or research writing.

## Exact next checkpoint

**Stage C-RV15 | New-page authoring metadata and supplementary source guidance.** Verify native Node workflow and latest Pages outcomes, then inspect Website Studio's new-page and duplicate-page logic for any remaining inherited `robots`, old navigation links, page metadata, image/photo provenance or title/description problems that could misrepresent user-authored academic content. Avoid feature/UX redesign, use limited tests and source-backed editorial correction only. Continue the overall factual/empirical audit separately, with original study/consent records and externally inaccessible papers labelled pending.

**Status:** Stale About/Contact and redirect-source defects corrected, 15/15 source tests passed, native CI passed. Website fully verified status not warranted.
