# C-RV29a | Editor V2 dynamic source, draft-saving, and publication status claims

**Date:** 2 November 2026. Continued from the exact [C-RV28z](STUDIO_BROWSER_RECOVERY_STATUS_CONTENT_AUDIT_C-RV28z_2026-11-02.md) checkpoint. This bounded **content-only** stage examined the actual `editor-v2.js` messages associated with Live Website mode, GitHub main-source verification and fallback, canvas/live draft saving, live edit counts, saved-edit/source conflicts and publication result links. Each correction was checked against the corresponding implementation and the already audited `editor-v2.html` instructions. No changes to academic HTML, research records or the functional Editor V2 publication algorithm were undertaken.

## Source baseline and previous coverage

- `editor-v2.js` original Git blob **`ca51a9f2b7d1dc5ce528a9beeb33153806ceb5c6`**, previously audited selectively in C-RV26b and the earlier C-ED1–5 sequence. This was the authoritative source at the start of C-RV29a.
- `editor-v2.html` remains **`8e84a754d0101a8c320af153e8c813ca1ddafa43`**, retaining an explicit distinction between authenticated Live Website publication and an **unlisted yet public** staging preview path.
- Commit **`5eaeb0a9a810f0151c244872a0512b7c903d9213`** made five source-backed status/help changes in `editor-v2.js`, blob **`c4e113421212d1903140ec695a7c6e76291c4cf6`**.
- Commit **`55f77d5d4632849a7fe1d931df3d823a7c21f08d`** clarified four more draft-retention occurrences and a deployment-pending URL label, final `editor-v2.js` blob **`e3d26fca2578a3bfea9b79138466f27fd0822a04`**.

All changes were limited to existing **user-facing strings and one redundant success-status emission**. None changed the GitHub endpoint, SHA conflict checks, token-retention mechanism, preview HTML assembler, page-selection handling, saved patch schema, or GitHub Contents API publication submission.

## Finding 1 | GitHub source verification is conditional, not universal

The previous Live Website mode display said:

> GitHub main · source-matched editing

and its explanation unconditionally stated that the editing view **uses the website's GitHub main HTML**. That overlooked the actual `loadLivePage()` fallback. The editor normally calls `fetchGithubPageSource()` for the main-branch HTML from GitHub's contents API, but if that fails it can fetch the **deployed website page** and explicitly set `liveSourceProvenance="fallback"`. The app presents a warning and requires fresh source verification before live publication. The fallback may differ from current GitHub main following recent deployments.

The badge/label now says:

> Website page · check GitHub source status below

The main help now explains that GitHub main is used **when available**, that a deployed-page fallback may appear if verification fails, and that **Verified preview and before/after** separately check the GitHub source before applying the same HTML assembler used by publishing. This is supported by `verifiedSourcePreviewPair()`, which forces `fetchGithubPageSource(page,{force:true})` and aborts when current page/edit state changes or the editor's displayed source differs from the latest GitHub HTML. Retaining the preview's existing “Verified” name is defensible at **source identity and patch assembly level**, not proof that user interactions or visual browser outcomes all pass.

## Finding 2 | Explicit Save could falsely overrule a browser-storage failure

The source's `storeLiveDraft()` writes the current edit patches to **browser `localStorage`** under `LIVE_DRAFT_KEY+currentPage`. It already sets a truthful result:

- On successful storage write, **“Original-layout edits saved locally · Website unchanged.”**
- On failure, **“Local draft could not be saved · Export the edited HTML.”**

However, `saveActiveDraft()` called `storeLiveDraft()` and **immediately displayed a second unconditional success message**, **“Live-page edits saved in this browser · Use Publish to update the website”**. A storage failure could therefore be instantly hidden by a later positive status despite the failed save.

The redundant unconditional `status(...)` line was **removed**. Clicking the Live Website Save control now preserves the existing `storeLiveDraft()` success **or failure** status instead of falsely declaring success. This is a narrow correction to **status propagation**, not a change in the draft saving or publication algorithms. Canvas-mode `save()` has its own correct storage success/failure messages and was preserved.

The live edit count previously described the current **in-memory `livePatches` size** as “saved edits”, even if `localStorage.setItem()` failed. The status now reports **“draft edit(s)”** or **“No live-page draft edits”**, retaining the distinction that original page publication is not triggered by saving. This is a more accurate description of the map's contents, independent of whether a durable browser backup exists.

## Finding 3 | A source mismatch keeps edits open but does not guarantee recovery

Several validation messages reported **“The draft is preserved”** or **“Your draft is preserved”** on source-edit mapping failures, image selection mismatches, changed original page source and attempted publication from unverified/deployed fallback. These code paths abort rather than deleting the in-memory edit map. Nevertheless, “preserved” could imply a guaranteed restorable backup, which browser storage does not promise. The messages now say **“The edits remain open in this editor session”** or **“Your edits remain open in this editor session”** while retaining the original source-review, reload and image-reconnection instructions.

In particular, `resolveLivePatchTarget()` still requires source identifiers and image expectations to match before allowing edits; `verifiedSourcePreviewPair()` still compares current source and draft signature; and `publishGithub()` still rejects a live-page write when the editor is using an unverified source or the main-branch HTML has changed. These safeguards and their failure handling were preserved.

## Finding 4 | GitHub commit confirmation is not immediate Pages deployment

`publishGithub()` submits one selected public or staging page to GitHub's **Contents API** with a content body, `branch:"main"`, and the current SHA when replacing an existing file. A successful response with a commit SHA confirms the **repository commit**, not that GitHub Pages has finished deploying it or that the link already serves the new content. The result intro already explains GitHub Pages may take time to deploy.

The subsequent link was labelled **“Open published page”**, which was more definitive than the commit result justified. It now says:

> Open page URL (deployment may be pending)

This accurately covers both the live selected page and the **publicly accessible** staging preview URL. The GitHub commit link, original URL target, `rel="noopener noreferrer"` and delayed-deployment explanation remain unchanged.

## Scope, style and unresolved verification limits

The changes address source provenance, draft persistence, image-edit matching and actual publish-result semantics, not graphic layout or unverified feature behaviour. They preserve existing helpful, concise, actor-specific instructions rather than imposing a generic copy pattern. The corrected wording avoids implying confidential browser storage, guaranteed recovery after reload, immediate Pages deployment or fully functioning browser previews.

**Known failure track:** The six previously recorded Editor V2 browser functional failures remain unresolved and were **not** tested or fixed by these content-only copy changes. Source-level textual accuracy does not establish correct drag/resize behaviour, persistence across reload, visual fidelity, runtime authentication or GitHub Pages deployment parity. The existing independent published static academic pages were not edited; the prior 16-of-16 published-text parity check should not be mistaken for functional Editor V2 verification.

**Required verification before finalizing this stage:** Re-fetch `editor-v2.js` and `editor-v2.html`, inspect final source hashes, verify that all new strings are present and old misleading claims absent, that `storeLiveDraft()` success and failure remain distinct without an overriding status, and that GitHub fallback/verified preview, `PUT` publisher endpoint, non-secret in-memory token and publicly accessible staging path remain intact. Confirm report and master ledger source/continuation. A JavaScript parse or browser test must be reported separately if not executed.

**Exact next checkpoint C-RV29b:** inspect another *bounded, genuinely unreviewed* editor author-facing message cluster, ideally `editor-v2.js` source-image reconnection and change-conflict guidance, or repository-scope publishing paths around the current `editor-v2-previews/` public staging URL. Contrast the instruction with the implementation without claiming successful live GitHub token access. Preserve the six Editor V2 functional failures and original scoping-review S2C study-level coding, private AP Biology responses/rater/consent/permission records and preferred public contact-email blockers.

**Overall comprehensive academic website content audit remains In progress.**
