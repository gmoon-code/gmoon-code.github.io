# C-RV29ag | Research Methods Studio live preview and shared browser-project disclosure

**Date:** 3 November 2026. **Resumed from:** C-RV29af. **Scope:** Original academic `research-methods-studio.html#preview`, related `#methods-privacy` paragraph, public `site-previews.js` iframe builder, and linked `gmoon-code/research-methods/assets/app.js` student storage logic. **Result:** A visitor-facing **timing and specificity defect in the shared-project disclosure** was corrected in the academic website HTML, with source/VM regression tests and successful project-detail browser-audit CI. This does **not** certify deployed live-app isolation or all browsers' storage behaviour. Comprehensive website content audit **In progress**.

## Original source and actual relationship between preview and live project

The original academic HTML blob **911924f5f3b22a3106984cf1b96e716fe1732b9d** displayed a visitor-facing introduction suggesting the opening guidance could be explored and a **“Show the live preview”** button. It included the warning:

> The preview and full-size application may share a locally stored project in this browser. For extended writing and backups, use the full workspace.

**This warning was inside `div.project-preview-active`, which is hidden until after the visitor opened the iframe.** The public page therefore omitted the consequential fact at the moment the visitor decided whether to open an embedded copy of their existing project. The cautious “may share” was also less precise than the actual source path.

The original [`site-previews.js`](https://github.com/gmoon-code/gmoon-code.github.io/blob/main/site-previews.js), GitHub blob **0a4c659eca2d9eca6d80fb6f906988e0d9ea13cf**, sets `sources.methods.path="/research-methods/"` and builds the iframe with `new URL(config.path, location.origin)`. It checks `url.origin === location.origin` and sets `iframe.src=url.href` only on a direct **Show preview** click, not during initial website load. It configures `iframe.sandbox` with **`allow-scripts` and `allow-same-origin`**, along with `allow-forms` and `allow-popups`. Closing the preview removes the iframe and restores button focus, but does **not** remove the application's saved notebook from the browser.

The current linked application's [`assets/app.js`](https://github.com/gmoon-code/research-methods/blob/main/assets/app.js), GitHub blob **f31cfe3080cc4ab8ccd55974410db9c1aa67404e**, defines `KEY = "research_methods_studio_v1"`. Its `load()` calls `Pilot.safeLoad(KEY)`, and its `save()` calls `Pilot.safeSave(KEY, project)`, with many form-input handlers invoking that save routine. No special preview-only project namespace or read-only demo mode is requested by the iframe. Both `https://gmoon-code.github.io/research-methods-studio.html` and `https://gmoon-code.github.io/research-methods/` have the **same scheme, hostname and port**, differing only in path. Standard browser `localStorage` is scoped to origin, not URL path. As MDN explains, it is shared among windows and tabs of one origin, and an iframe retaining `allow-same-origin` does not gain an opaque storage origin merely because it is embedded.

Relevant browser references:

- [MDN, Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) and [Using Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API), on same-origin sharing.
- [MDN, iframe `sandbox`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe), on `allow-scripts` and `allow-same-origin`. MDN cautions that combining both permissions for a **same-origin iframe** does **not** form a strong security isolation boundary.

**Mechanism:** In an ordinary browser session with the saved notebook available, opening the iframe can display a previous project; editing fields in that iframe can save back into the same project that the full-size workspace uses. The preview is **not a separate demo notebook**. Two already-open tabs can retain different in-memory states, so immediate synchronization of every unsaved field is not asserted. A private-browsing session, blocked local storage or distinct browser profile may have a different project or none at all. Merely closing the iframe does not reverse local storage writes. The original visible “may share” is insufficient as a pre-opening notice.

## Actual academic website revision

[HTML source correction 06e58a6](https://github.com/gmoon-code/gmoon-code.github.io/commit/06e58a6e8f461dc791504cc8e018f3b95efe126f), changing **only `research-methods-studio.html`**, made three bounded wording improvements:

1. The introduction now accurately calls the embedded view **the published Research Methods Studio workspace**, not just opening guidance.
2. The **previously hidden** project-sharing notice was moved in meaning to a new **visible** paragraph inside `div.project-preview-before`, **before** the Show preview button. It explains that the live application can access an existing browser-stored research project, may display earlier work and can change the project available in the full workspace; it asks visitors to consider who can see their screen before displaying private work.
3. The caption inside the open preview now states that both views use the **same locally stored project when browser storage is available**, that closing the iframe does **not undo saved edits**, and that the full workspace is preferable for longer writing and backups.

These changes preserve the author's concise, thoughtful, careful style. The paragraph develops a concrete sequence from live-workspace identity to possible disclosure and editing consequences. The adjacent privacy section explains local storage, independent backups and the optional Research Chat network boundary. No decorative transition, inflated security or learning outcome claim was introduced. There are **no em dashes** in the revised preview text. Existing markup, styles, preview resizing and focus behaviour remain unchanged.

**No other site pages or linked application files were edited in this stage.** The `site-previews.js` iframe permissions were not altered, as changing origin isolation without adapting the embedded application would likely interfere with its expected browser persistence and functionality. The report records that these permissions do **not** constitute a privacy sandbox; a safe read-only demonstration would require a distinct, independently specified product change. The narrow task was to correct the actual site's explanatory wording rather than silently redesign the workspace.

## Regression evidence and caveats

[Test creation d53f5ce](https://github.com/gmoon-code/gmoon-code.github.io/commit/d53f5cea76ad144e4c6897b0af6571d81f09791e) added `tests/methods-preview-storage-disclosure.test.mjs`. Its three tests check:

- The project-access, visibility and editing warning exists in **visible pre-open markup**, physically preceding the opener, rather than only in the hidden active preview.
- The active caption accurately mentions shared storage, saved edits and backups; the section maintains the distinct optional Chat server disclosure.
- The **actual unmodified `site-previews.js`** is run inside a controlled Node `vm` with mocked elements. The test confirms no iframe on initial rendering, correct same-origin URL and iframe permissions after clicking, phone-size control, iframe removal on closing, and focus restoration.

[Workflow integration 16ef274](https://github.com/gmoon-code/gmoon-code.github.io/commit/16ef274e153f73f21ab6dd610984d4ef7f9411a5) adds the new test to the site's existing **Research Methods Studio detail visitor audit** and triggers it when the test changes. [GitHub Actions workflow run 41569164959](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41569164959) completed **success** for commit **16ef274e153f73f21ab6dd610984d4ef7f9411a5**. Job logs confirm **3/3 source/VM tests passed**. The existing Playwright Methods detail page test and screenshot/report-collection steps in that workflow also completed successfully. Earlier [Projects overview and preview visitor audit 41569070740](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41569070740) and [public accessibility semantics run 41569070647](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41569070647) completed successfully on the initial HTML-change commit.

**Scope limitation:** The project's local GitHub Actions HTTP server serves the **academic website repository**, not necessarily a full checkout of the separate Research Methods Studio app at the `/research-methods/` path. The source-level iframe URL and state test is real, and the academic page browser audit passed, but these workflows are **not evidence of an actual deployed application browser session opening and editing a previously saved real notebook**. No live visitor's data was opened; no privacy certification or backend data-retention validation was claimed. The six previously unresolved Editor V2 browser failures are also separate and remain unresolved.

## Exact continuation

**C-RV29ah:** examine `story-method.html#preview` and its shared `site-previews.js` embed against the same **pre-opening versus after-opening browser-progress warning** problem. Verify the Story Method application's actual storage key and whether a saved learner journey may appear or change in the embedded preview. Compare with its prior Story Method per-page audit, then make only a justified content revision and add source/bounded browser checks. This is a different visitor-facing page with a related shared-origin mechanism, not redoing the Research Methods Studio checks. After this local cross-page consistency work, return to the site-wide content ledger to locate remaining genuinely unfinished substantive writing and scholarly verification.

Previously documented independent blockers remain **the original final-August S2C twenty-study source-level coding matrix**, **AP Biology primary student responses, rater/consent/assent/school permission evidence**, **the owner's public contact-email choice**, and **six Editor V2 browser regression failures**. Comprehensive academic website content audit **In progress**.
