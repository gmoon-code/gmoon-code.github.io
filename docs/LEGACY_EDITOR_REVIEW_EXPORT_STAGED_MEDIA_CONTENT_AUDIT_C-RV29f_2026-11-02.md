# C-RV29f | Legacy editor review, HTML export and staged-image guidance

**Date:** 2 November 2026. Continuation from [C-RV29e](LEGACY_EDITOR_PARTIAL_DRAFT_RESTORATION_AUDIT_C-RV29e_2026-11-02.md).

**Status:** Selected author-facing guidance and dynamic result messages corrected, source-matched and verified with isolated mocked-function checks. Browser downloads, optional publishing service operation, source parity against deployed Pages and authenticated GitHub publishing remain untested. The comprehensive academic website content audit remains **In progress**.

## Exact inspected source and existing coverage

Read `editor.js` `stageNewImage()`, `downloadStagedImage()`, `mediaPayload()`, `reviewChanges()`, `buildExport()`, `exportHtml()`, and direct GitHub source/publication logic, including relevant status messages and the corresponding `editor.html` image, review and publishing paragraphs. Compared C-ED2 and C-RV29c–e audit decisions to avoid duplicating completed corrections.

The editor builds source-preserving HTML from `state.source`, which was fetched when the editor loaded the deployed website page. The Review changes panel calls `buildExport()` as an assembly check, **not** a fresh GitHub API source comparison. Direct publication performs the separate GitHub current-file check later. HTML export calls `buildExport()`, creates a Blob URL and clicks a temporary `download` link. This constitutes a **download request**, without proof that the browser saved the file or that GitHub Pages was updated.

The staged image is a separate browser `File` and object URL with a generated `assets/editor-*.{png,jpg,webp}` path. `downloadStagedImage()` requests the binary download using just the path's filename, while the HTML refers to the full `assets/` path. A reviewed repository update therefore needs the binary file added to that path to prevent a broken image. Direct GitHub `Publish live` refuses new staged media, and the optional pull-request service remains unconfigured. `mediaPayload()` already explicitly checks whether the assembled HTML references the staged file.

## Identified content issues and corrections

1. **Review versus publication verification.** The old status “Source check passed. Changes can be exported for review” could suggest current GitHub source was checked. It now identifies a passed **HTML assembly check against the page loaded in this editor** and explains that current GitHub source is checked separately before direct publication. An export-assembly failure already produced an explicit warning and was preserved.
2. **Obsolete pull-request assumption.** The Review changes panel previously said the staged binary **“must accompany this HTML in the review PR.”** That was misleading while the optional service is unconfigured and manual reviewed repository updates are possible. The replacement specifies separate image download and inclusion in a reviewed update, conditional on the exported HTML actually referencing the image path.
3. **Incorrect remedy for another staged image.** An image picker failure previously advised “Reset or publish the current page before adding another.” Direct Publish live specifically rejects newly staged image binaries, so “publish” was an unsupported solution. The replacement explains the one-at-a-time staging limit and advises downloading the file and exporting HTML before resetting or changing the staged image.
4. **Relative path and binary preservation.** Both the staging status and static image help now state that the HTML export does not contain the image binary and uses an `assets/` path. Authors must download the staged file separately and keep its generated filename when adding it at that repository path. The existing explanation that already-published website images can be reused was retained.
5. **Staged but no longer referenced.** `state.stagedMedia` can still exist after an editor action removes the proposed `src` reference. The old Review changes and HTML export messages unconditionally implied the image must accompany the HTML. The review now says **if the exported HTML still references the path**, the file belongs in the update. The export status checks the assembled HTML for the same quoted `src` path pattern already used by `mediaPayload()`; it distinguishes a referenced staged image from one no longer included in that HTML.
6. **Unconfigured optional service.** The static image help no longer directs the author toward an unspecified properly configured service as if it were currently available. It accurately identifies a separate reviewed repository update and states that the optional pull-request service is not configured. The existing direct GitHub publication path, token permissions and Pages deployment descriptions remain unchanged.

The revisions are bounded to accurate, practical instructional meaning. None touches public academic prose, research findings or content evidence, and the user’s natural, precise editorial voice remains the baseline.

## Implementation and verification

Three content/status commits:

- `2615f8f8fae901c60a5fe2865f3e9805803d8490` modified `editor.js` (five targeted user-facing strings).
- `20365f57fc315f25462e2d08a67c785522fad432` modified `editor.html` (two image-help paragraphs).
- `0fa8c1b1bb6ae524a67d5ef4ac5ea04592c9bbd6` modified `editor.js` (conditional staged-image review/export messages).

Final re-fetched source blobs: `editor.js` **`5c0b2972f6f7ab28ae2a053a3ef98a2864d63a90`**, `editor.html` **`c301e7033af4586e656c626ee31662b00c188f08`**, unmodified `editor-publisher-config.js` **`cf7a2260dc557daa55dff9cc4cdc42ae3be3eca5`**.

**27/27 targeted source and isolated JavaScript checks passed**. Four mocked executions of `exportHtml()` covered an ordinary HTML download request, staged image referenced by HTML, staged image no longer referenced, and failed assembly with no download request. Remaining source checks included JavaScript parsing, the 149 unique static HTML IDs, all revised messages, binary/path separation, the existing MIME/payload gating, source-preserving assembly, current-GitHub comparison, single-page GitHub commit, storage safeguards and disabled optional service. The isolated download harness simulated the link click and cannot demonstrate that a real browser actually saved anything. No live GitHub commit, authentication token or Pages deployment was attempted.

## Remaining uncertainties and exact next checkpoint

This stage provides source-level editorial correspondence for the selected messages only. Real-browser testing is still needed for actual file downloads, staged-image persistence before navigation or reload, preview/export source parity, and later manually supplied binary files. The six previously documented Editor V2 browser regression failures remain independently unresolved. The full academic content audit remains open.

**Exact next checkpoint C-RV29g:** examine the **remaining legacy editor existing-image library instructional content** in `editor.js` and `editor.html`, beginning with source asset discovery, image path/alt descriptions, picker filtering and messages about what is on the currently deployed site rather than latest GitHub main. Cross-check C-ED2 and C-RV29f before making any source-supported correction, then verify and update the master ledger. Do not infer that visible images or filenames authenticate permissions, citation rights or public-image provenance.

Maintain original final-August scoping S2C 20-study per-record evidence, original AP Biology assessment/rater/consent/assent/permission records and preferred public contact email as independent unresolved or owner-dependent items.

**Overall comprehensive academic website content audit remains In progress.**
