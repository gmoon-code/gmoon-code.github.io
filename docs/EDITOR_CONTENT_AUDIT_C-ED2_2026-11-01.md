# Editor content audit | C-ED2

Date 1 November 2026. Continued after Website Studio C-ED1.

## Scope

Reviewed instructional text, publishing descriptions and image-publication claims in `editors.html`, `editor.html`, `editor-v2.html` and `publisher/SETUP.md`. Compared the relevant statements with actual `editor.js`, `editor-v2.js` and `editor-publisher-config.js` source. This review focuses on truthfulness and clarity of published instructions. It does not replace tests of editability, rendering, token privileges, image binary uploads or navigation.

## Findings and changes

1. `editor.html` described `Publish live` as sending a reviewed page directly to GitHub Pages. Source code actually compares the draft against the current GitHub file, then sends a `PUT` commit to `main`; Pages deployment occurs later and may still be pending. Revised the instructions to distinguish GitHub commit from subsequent Pages deployment. Also specified that the direct GitHub path needs no additional publishing server. Source commit [6d4c585](https://github.com/gmoon-code/gmoon-code.github.io/commit/6d4c58563a6c2ba6111daa92349ab8b6527ca235).
2. The same source explicitly rejects `state.stagedMedia` during direct publication. Existing instructions could imply that new images are published with live page text or must be reviewed only through a particular PR service. Clarified that direct publication does not support new image files and that images must be published by a separate reviewed update or configured publisher. Commits [6d4c585](https://github.com/gmoon-code/gmoon-code.github.io/commit/6d4c58563a6c2ba6111daa92349ab8b6527ca235) and [d1c6bbc](https://github.com/gmoon-code/gmoon-code.github.io/commit/d1c6bbc9c5bca2dd22c03a392c4976dd67ec67f3).
3. `editor-v2.html` said choosing a library image added it `directly to the real webpage`. This could be misread as instant public publication, even though the user is editing a live-page draft. Revised this to describe adding or replacing an image in the draft, and preparing newly uploaded photos for later review and publication. Commit [e5ba22d](https://github.com/gmoon-code/gmoon-code.github.io/commit/e5ba22de9145926aa73062682f831b7e273ec21d).

The editor directory `editors.html` correctly distinguishes local drafting, review and the separate publishing rules of the three connected applications; this copy was preserved. The legacy publisher configuration `editor-publisher-config.js` has empty endpoint and client ID, so the historical `publisher/SETUP.md` installation instructions describe a service that is currently unconfigured. No claim that the optional PR service was actively connected was made.

## Verification

Initial `editor.html` revision re-fetched after commit; eight targeted implementation/source checks passed. They confirmed descriptions of commit/deployment, image-upload limitations, GitHub API PUT to `main`, unconfigured legacy publisher and JavaScript syntax. The subsequent precise image wording changes in `editor.html` and `editor-v2.html` were committed through complete-file SHA-guarded replacement. A later source refresh and native/browser verification are still advisable before marking these specific subsequent replacements fully verified. No live GitHub token was used.

## Remaining scope

The actual editor UI includes many explanatory tips and controls beyond the reviewed publication and image boundaries. Their source descriptions, keyboard shortcuts, styling claims, and ability to preserve image aspect ratios require separate content/implementation checks. The `studio/pages.json` manifest discrepancy from C-ED1 remains open. Owner-authenticated publishing and live Pages parity were not exercised.

## Exact next checkpoint

**Stage C-ED3 | Editor V2 instructional claims and source-to-preview status.** Audit `editor-v2.html` instructions on live webpage mode, grouping, copy/paste, cropping, screen-specific editing, source parity and publication against the actual implementation, prioritising any statements that could cause incorrect academic content, unexpected edits or false promises of data preservation. Re-fetch all changed source files, run static checks and existing editor CI where available. Continue remaining public supplementary text inventory, including downloads and administrative instructions. Preserve the main public pages' earlier completed editorial reviews and primary-source verification limitations.

**Status:** Three editor HTML files evaluated, source corrections committed; subset checks passed, native/interactive verification incomplete.
