# C-RV29g | Legacy editor existing-image library and alt-text guidance

**Date:** 2 November 2026. Continued at the exact checkpoint saved in [C-RV29f](LEGACY_EDITOR_REVIEW_EXPORT_STAGED_MEDIA_CONTENT_AUDIT_C-RV29f_2026-11-02.md).

**Status:** Selected image-library statements and narrowly related selection/filtering behaviour were corrected and source-verified. The wider comprehensive academic website content audit remains **In progress**.

## Source and coverage

Read the image-library discovery, selection, insertion and search implementation in `editor.js`, including `availableImages()`, `renderMediaResults()`, `openMediaLibrary()`, the `mediaSearch` event handler, the quick composer, original-image replacement, added-image fields and `safeExistingImagePath()`/`validateParagraphAdditions()`. Compared the relevant image guidance in `editor.html` with prior C-ED2 and C-RV29f findings. The full legacy editor script and HTML were re-fetched after the changes. No public academic page or research claim was edited.

The browser fetches the HTML of the pages named in the editor's page picker with `cache:"force-cache"`, reads `img[src]` elements, retains paths matching a relative `assets/` pattern, deduplicates by path and retains the first occurrence's `alt` attribute. If no `alt` is available, the filename becomes the displayed label. The code **does not** enumerate every repository asset, independently verify the image binary, check the current GitHub main branch or establish permission to reuse the image. Some listed pages can fail to load without stopping the scan. These source limits make “existing website images” and an unconditional numerical claim about all images on the site too broad.

## Corrected issues

1. **Source and completeness of image choices.** The library heading, introduction, browse buttons and quick/insertion labels now say that image *paths are referenced by editor-listed website pages*. They do not imply a verified, exhaustive inventory of the repository or current GitHub branch. Static guidance notes that the page copies may be cached or incomplete and that path presence does not verify file availability or image rights.
2. **Transparent partial scans.** `availableImages()` now records when a listed page cannot be retrieved. Search results describe image paths found in retrieved page copies and disclose the number of missing page responses. Empty search results are not presented as proof that no existing website images exist.
3. **Recorded descriptions versus alt-text recommendations.** The library retains the first matching image's recorded `alt` as a *possible suggestion*. A filename can still identify an unlabelled image in search results, but it is **not** automatically inserted as a new image description. A new image placement requires text appropriate to its content and context. Inspector notes explain that replacing an original image path does not update the existing `alt` automatically.
4. **Context for reused images.** Original-image, inserted-image, added-block and inline-composer labels now direct the author to review descriptions for the new use, while preserving the underlying image-path pattern and input limits. The help text explicitly advises checking whether the chosen file loads and whether reuse is permitted. The editor's existing alt-text requirement for new image additions was left intact.
5. **Search during asynchronous loading.** Previously `openMediaLibrary()` rendered the entire discovery result even if the author had already typed a search while requests were pending. It now applies the current search query after the fetch completes. The existing real-time filter remains, and result counts refer to the filtered paths rather than the entire inventory.

These revisions clarify author-facing claims and improve evidence-sensitive handling of accessible descriptions. They do not authenticate third-party licences, copyrights, citation requirements or provenance, and the presence of a publicly referenced image alone should never be taken as permission to reuse it.

## Implemented commits

Four narrowly scoped commits changed only `editor.js` and `editor.html`:

- `29d2e1d2ccb57661d49da90bea418f2cd242432b`, `editor.js`, media discovery disclosure, first-occurrence suggested-alt handling and scan-status text.
- `7781f9bf1e90860039e15f9c944f92e5a7829e00`, `editor.html`, media scope, rights and alt-text contextual guidance.
- `74404252bee3be21eeaaf6ac1f7a898e997367e4`, `editor.js`, respect an entered search term after asynchronous discovery.
- `5d9249a1789a548454b7e3fd469e19b68a83868e`, `editor.js`, align all remaining generated image insertion/selection labels with the actual `assets/` pattern.

Final fetched blob hashes were **`f175cdc107ec77d9efc8309d902f54091ef1c88f`** for `editor.js` and **`305d624fb735871787989211771ba0abc8104f20`** for `editor.html`. The optional publisher configuration was not changed. No public academic HTML, manuscript, source dataset or original study documentation was changed.

## Verification and limits

**23/23** initial source and isolated mock-API checks passed. The harness exercised local-path-only discovery, deduplication, first occurrence, filename-only fallback, missing-page disclosure, sorted results, caching, filtered count language, and image selection into an added block without treating filenames as alt text. It also checked JavaScript parsing, **149 unique HTML IDs**, documented limits and unchanged publication/draft-recovery boundaries.

An additional **14/14** isolated and source checks passed. This run specifically simulated a delayed page response, with a search typed before the fetch resolved. The final displayed list and count correctly reflected the current query. Generated image labels, safe-path restrictions, scan warnings, current GitHub comparison and direct staging safeguards were also rechecked.

These were **37 targeted checks**, not 37 end-to-end browser tests. No network images were independently decoded in the test harness, no image permissions were verified, and a real browser or authenticated GitHub publication was not exercised. The six previously known Editor V2 browser regression failures are separate unresolved functional issues.

## Exact next checkpoint and independent blockers

**Exact next checkpoint C-RV29h:** review the legacy editor's remaining page-find, content-browser and navigation-status guidance (`pageFindStatus`, `browseElementStatus`, `updateOutline()` and relevant search, selection and source-loading code). Evaluate any claims of exhaustive page coverage, saved state, availability or verified content against the code. Correct only substantiated author-facing wording or tightly bounded feedback errors, then run targeted checks and append the ledger. Preserve C-ED2 and C-RV29c–g changes and do not reinterpret source content without its primary evidence.

Maintain the independent final-August original scoping S2C 20-study per-record evidence, original AP Biology assessments and independent rater/consent/assent/permission records, preferred public email decision and six Editor V2 browser regressions as unresolved.

**Overall comprehensive academic website content audit: In progress.**
