# C-RV29c | Legacy visual editor draft, export and publication guidance

**Date:** 2 November 2026. Continuation of [C-RV29b](EDITOR_V2_IMAGE_RECONNECT_PUBLISH_SCOPE_AUDIT_C-RV29b_2026-11-02.md).

**Status:** Source-level editorial corrections implemented and verified within the selected content scope. Browser interaction and authenticated publication have **not** been verified. The comprehensive academic website audit remains **In progress**.

## Coverage and prior work preserved

Re-read the previously completed C-ED2, C-ED3 and C-ED4 reports before selecting the uncompleted part of the legacy editor. Inspected current `editor.html` author-facing draft, export, media picker, token and publishing text against `editor.js` save/restore, source loading, HTML generation, local file download and direct GitHub publication code, and `editor-publisher-config.js` optional publisher configuration. C-ED2 had already corrected the central GitHub-commit-versus-Pages-deployment explanation and the limitation on uploading new images. Those verified decisions were retained.

The relevant operations are distinct. `loadPage()` fetches the currently deployed HTML page. `saveDraft()` tries `localStorage` and can report failure, while `restoreDraft()` requires a matching source fingerprint. `buildExport()` assembles edited HTML without publishing; `exportHtml()` requests a browser download using a Blob URL. Direct publishing reads the current GitHub `main` file, compares its decoded contents with the editor-loaded source, checks that the draft has not changed during the request, and commits a single HTML file with the GitHub Contents API. It rejects new staged-media binaries. The separate older pull-request service remains unconfigured because `editor-publisher-config.js` has empty `apiBase` and `clientId`. A successful GitHub commit is not proof that GitHub Pages has deployed.

## Corrections implemented

1. **Conditional draft storage and backup.** The keyboard shortcut explanation now says Ctrl/Command+S *attempts* to save when browser storage is available and recommends an exported HTML file when a separate copy is needed. This avoids suggesting that local storage is infallible or that a shortcut creates an external backup.
2. **Review and export actions.** The add-content guidance no longer implies that a configured GitHub proposal is necessary. It distinguishes reviewing an addition before direct publication from exporting for separate review. The added-block status explicitly says that reviewing or exporting does not publish the draft.
3. **Optional publisher versus direct publishing.** The static and generated optional-service statuses now say the pull-request service is not configured and distinguish it from direct GitHub publishing and HTML export. The earlier generic “GitHub publishing is not configured” could be mistaken for a limitation on the functioning direct path.
4. **Existing-image picker.** The media picker no longer predicts that a separate media publisher will handle future uploads. It states that the picker selects existing portfolio images and that new image files require a separate reviewed update.
5. **Loaded source versus current GitHub file.** The confirmation help now describes the actual comparison between the current `main` file and the deployed page version loaded into the draft. This is more accurate than claiming the editor can establish that GitHub has remained unchanged since an unspecified starting time.
6. **Session-only token and permission status.** The token instructions now describe in-memory retention for the current page session, including that reload or navigation ends the session. The connection message identifies the successful account/repository **read** check. It does not claim that a read-only probe proves permission to commit; GitHub checks write permission at publication.
7. **Draft-restoration categories.** The initial restoration status calculation now counts additions, responsive groups, block ordering and changed section order as well as directly edited or removed elements. Previously it could state “No changes” after restoring one of the omitted categories. The later `loadPage()` status already counted those categories, and remains unchanged.
8. **HTML download and commit result language.** The status now reports a browser HTML **download request**, without asserting that the user has saved the file to disk, and identifies the GitHub commit link without the ambiguous term “published” before Pages deployment.

These changes follow the author's preference for plain, specific, non-promotional instructions. They do not rewrite already adequate guidance or alter public academic writing.

## Commits and source verification

Four sequential content/status-copy commits:

- `d45911642ab07bd3b40e132b327e6f83b57b3fae`, `editor.html`.
- `9d9290155ce30cfd152f074c9949239b0fe468df`, `editor.js`.
- `89b746349ff76253a89172721a5e5d0af38d2e11`, `editor.html`.
- `c933a5bf0f0f162447ce359a2f6c7d9f25c43af8`, `editor.js`.

The final re-fetched blobs are `editor.html` **`99bddf95a863b2697ac95d17d35a0971bc1ec409`**, `editor.js` **`b9ec8e0732a50c8f158e24f5b7015d050ffbc011`**, and unmodified `editor-publisher-config.js` **`cf7a2260dc557daa55dff9cc4cdc42ae3be3eca5`**. GitHub commit-file inspection confirmed that each of the four audit commits changed **only** its stated editor file. Separate automatically generated test-result files also changed in intervening repository commits; those are **not** part of this content audit.

**25/25 final source assertions passed.** They cover revised messages, accurate source/loading and publishing boundaries, optional publisher configuration, conditional browser persistence, staged-image safeguards and removal of the misleading older wording. The final JavaScript parsed without executing its browser code. `editor.html` had **149 static element IDs, all unique**. These are source and syntax checks, not browser functional tests, downloads, authenticated publishing or GitHub Pages parity. No public academic HTML or research data was changed by these four commits.

## Open limitations and next checkpoint

A separate **status-persistence problem remains**. Multiple `editor.js` handlers call `saveDraft()` and then immediately call `updateStatus()`. If `localStorage` rejects a write, a subsequent operation message can conceal the warning “Draft storage unavailable · Export your HTML”. Not every later message explicitly claims durable saving, but the lost warning may prevent users from knowing that an edit exists only in their current session. The source-level changes above **do not repair that problem**.

**Exact next checkpoint C-RV29d:** systematically inspect the legacy editor's post-save status overwrites and page-switch/unload messaging against `saveDraft()` failures and stale-fingerprint behaviour. Correct only verifiable author-facing feedback errors, avoid broad changes to draft persistence or publishing algorithms, verify the final copy and record the separate runtime validation need. If the whole subcluster is already covered, continue with another confirmed unreviewed supplementary written-content source.

Preserve the six known failed Editor V2 browser cases separately as unresolved functional failures. Keep the original final-August scoping S2C 20-study codes, original AP Biology assessment/rater/consent/assent/permission documents, and preferred public contact email unconfirmed pending authentic evidence or owner choice. No source-level editor check can resolve these independent blockers.

**Overall comprehensive academic website content audit: In progress.**
