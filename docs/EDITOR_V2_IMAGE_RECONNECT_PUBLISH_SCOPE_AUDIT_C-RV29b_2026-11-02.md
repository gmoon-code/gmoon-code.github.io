# C-RV29b | Editor V2 deployed-image provenance and publication instructions

**Date:** 2 November 2026. Continued from the exact [C-RV29a](EDITOR_V2_DYNAMIC_SOURCE_STATUS_AUDIT_C-RV29a_2026-11-02.md) checkpoint. Bounded content-only review of **source-image reconnection, saved/draft patch verification and live/staging publishing descriptions** in current `editor-v2.js` and `editor-v2.html`. The primary question was whether an author would be told the truth about **which version of a page supplies candidate images** and whether publishing is immediately visible, without modifying functional code or inferring successful browser-level publication.

## Verified implementation and original source

The original reconnection routine `loadReconnectImages()` does **not** call GitHub's latest source endpoint. It performs `fetch(new URL(page,location.href),{cache:"no-store",credentials:"same-origin"})`, parses the **currently deployed site HTML** with `DOMParser`, and lists eligible **same-origin images under `main img[src]`**. On a delayed GitHub Pages deployment, those candidates can come from an earlier page version than `main` on GitHub. The routine identifies images by source selector, `src` and `alt`; `reconnectSavedImage()` then changes the image patch's intended selector and expected original source while leaving the proposed replacement and style fields intact. Reconnection is gated by user confirmation and a check that the destination does not already have another patch. The routine **does not, by itself, prove that the patch matches the current GitHub source or publish it**.

The separate **Check saved edits** function calls `sourcePreservingHtml()`, which obtains the latest GitHub file through `verifiedSourcePreviewPair()`, requires the displayed source and current edit signature to match, and applies the original-patching assembler. Final live publication independently checks the `currentSource` read from GitHub and the displayed source provenance, then uses **GitHub Contents API `PUT`**, setting `branch:"main"` and the current SHA. Staging publication creates or replaces a file under `editor-v2-previews/`, **which is publicly reachable even if unlisted or marked noindex**. GitHub commit confirmation is not evidence that GitHub Pages has deployed the file.

## Issue 1 | “Original source” was actually the deployed site snapshot

The reconnection panel previously instructed authors to select the **“correct original image”**, called the candidates **“Original source”**, **“original page”** and **“original images”**, and announced that it was “Checking images in the original” page. Because its source is a deployed-page GET, that wording could imply the current main-branch original has been consulted and validated, which is not what the function does.

The user-facing panel now explains:

> If an image moved or its reference changed, choose the intended image from the currently deployed page. That version may lag behind GitHub's latest source. Your replacement, size and styling remain in the draft; check the edits against GitHub again before publishing.

The static panel labels were correspondingly changed to **“Reconnect an image edit to a page image”**, **“Draft image edit”**, **“Preview of selected image from deployed webpage”**, and **“Use this page image for the draft edit.”** The buttons' HTML IDs, form fields, actual image candidates and image-replacement logic remain identical.

The dynamically generated status messages now identify **“Image on deployed page”**, **“Checking images on the deployed [page]”**, **“No eligible same-site images found on the deployed [page]”**, and **“Could not inspect the deployed page”**. The no-match explanation now permits an **earlier page version**, not simply a wrong page. After the user confirms a remapping, the message states **“Image mapping updated ... from the deployed page · Check against GitHub before publishing.”** These statements match the real data route and reinforce the existing GitHub source validation step.

## Issue 2 | Publication descriptions overstated immediacy of a GitHub update

The previous publication dialog stated:

> This updates the actual public webpage after checking the latest GitHub source.

That collapses two stages. The editor **commits the selected page file on GitHub main**, but GitHub Pages can continue serving an earlier deployment for some time.

The new Live destination description is:

> This commits the selected page’s edits to GitHub after checking its latest source. GitHub Pages may need time to deploy. The independent design canvas is not published.

The staging description is likewise specific:

> This commits a preview file at a separate public URL without replacing the existing webpage. GitHub Pages may need time to deploy.

The existing explicit warning **“Staging preview (unlisted path, publicly accessible URL)”** remains intact, and the C-RV29a result link already says the deployment may be pending. No endpoint, destination or acknowledgment behaviour changed.

## Issue 3 | In-memory draft patch lists should not imply durable local storage

The panel's dynamically generated heading previously said **“Saved edits to this webpage”** and the original Check button said **“Check saved edits before publishing.”** Those lists represent the currently active `livePatches` map. Even when browser `localStorage` fails, they can exist in memory. They were updated to **“Draft edits to this webpage”** and **“Check draft edits before publishing.”** The successful check message likewise says **“[N] draft edits match the current GitHub source”** and reminds the author that GitHub will check again at publish time. The image-reconnection control labels refer to “draft” rather than promising browser storage succeeded.

These changes complement the C-RV29a removal of the unconditional Live Save success status. They are factual distinctions about copy, not revisions of draft persistence code.

## Exact commits, files and validation

- Original `editor-v2.js` starting blob **`e3d26fca2578a3bfea9b79138466f27fd0822a04`**; **12 narrowly targeted user-facing string replacements** committed as **`99702a2ed5315c43ca171326ad15bba231c44070`**, final blob **`3f6c206637864ecbd6eb3785a40e850fd7d753cc`**.
- Original `editor-v2.html` starting blob **`8e84a754d0101a8c320af153e8c813ca1ddafa43`**; first detailed source-provenance help correction committed as **`582b171d829333094fcb62bf78ef44205f9cc5fb`**, intermediate blob `aac814d84b3aee6bd3a2e1e4ec3f42e83795798d`. Five further panel labels/copy corrections were committed as **`c0acb07aab15e98ddd765510ba5fdb30ebd3c53d`**, final blob **`5f881ae8fb4bcf207bd97dbaf74ad9ad638c8a7f`**.
- **22/22 source-specific checks passed**, including original data route, GitHub source verification, publication API invariants, all changed messages, public-staging disclosure, HTML control IDs and preservation of the prior C-RV29a edits.
- The final **305 KB `editor-v2.js` parsed as JavaScript** without running any editor code. `editor-v2.html` contained **270 static IDs with no duplicates**. Those checks are not evidence of browser-level functionality, authenticated publishing or live Pages parity.

No science content, CV, personal data, academic Home/Research pages, image files, study evidence, authorization token handling, draft schema or publishing algorithm were edited.

## Scholarly accuracy and editorial perspective

The corrections are designed for a person using the editor. They distinguish what is **currently deployed** from what is **current on GitHub**, what is merely an **editing draft** from what has actually been saved, and what is **committed** from what has been **deployed**. The source-to-claim relationships are specific; there is no exaggerated guarantee, ornamental transition, or unnecessary full rewrite of the existing guidance. The same evidence-conservative standards used for the scholarly Research pages apply to this instructional text.

**Exact next checkpoint C-RV29c:** audit a new, confirmed supplementary instructional-content surface, starting with the **legacy `editor.html` and its dynamically generated draft, export and publishing messages** compared with its associated source modules, while checking the prior C-ED and C-CS audits to avoid redoing completed source coverage. Pay particular attention to browser-local backups, whether previews are public, and distinctions between exporting a file and publishing to GitHub. If genuinely completed already, select another unverified source bank instead. Keep the separately unresolved **six Editor V2 browser interaction failures**, the final-August scoping S2C per-study matrix, original AP Biology assessment/rater/consent/assent/permissions records, and the preferred public email decision on their established independent tracks.

**Overall comprehensive academic website content audit remains In progress.**
