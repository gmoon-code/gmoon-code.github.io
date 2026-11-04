# C-RV29ei | Actual local Chromium test of Fluid Layout Lab staged content transfer

**Date:** 4 November 2026. **Continued from:** [C-RV29eh](CURRENT_SOURCE_EDITORIAL_CLOSEOUT_AND_VERIFICATION_LIMITS_C-RV29eh_2026-11-04.md). **Scope:** One genuinely untested author-facing editor interaction, deliberately separated from the completed academic website prose review. **Outcome:** Local Chromium test passed, including three supported new content blocks and an unchanged unpublished legacy editor draft. No academic HTML or writing rewritten.

## Source baseline and reason for this test

GitHub `main` at resumption was `ccafd5758fff650fd15a376fcc0df4aedbf9e808`, unchanged from the C-RV29eh checkpoint. The complete recursive Git tree contained **26 HTML files**. The final manuscripts remained the source of record for the author's website research descriptions; the **19 ordinary/legacy academic source-writing reviews were already closed**, and there was no new prose error or changed page to justify reopening them.

Earlier [C-RV29ee](FLUID_LAYOUT_LAB_TRANSFER_COPY_AUDIT_C-RV29ee_2026-11-04.md) corrected author-facing instructions in `fluid-layout-lab.html` which had wrongly suggested that **all newly added blocks could not transfer**. The sender's `insertionBlocks()` and `validateInsertions()` functions already supported source-anchored paragraphs, headings and links. The receiving `editor.js` validates these through `validateParagraphAdditions()`, stores accepted entries as a browser-local draft, and does not publish them. The original [Editor directory and Fluid Lab import audit](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41779187823) had passed, but its automated browser actions tested the Contact/legacy-About source imports and keyboard/navigation controls, **not the newly staged additions or their local editor handoff**.

## Precisely extended local-browser test

Modified only [`scripts/audit-editor-routes.py`](../scripts/audit-editor-routes.py) through GitHub source commit [**`c9794ed88ffe`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/c9794ed88ffec50c66afb1805b9ba2976ff093fa). The new `verify_staged_content_handoff()` test runs in a **fresh, isolated Playwright Chromium browser context** with a 1120 × 860 viewport. The existing 390 × 844 directory/import/skip-link regression is retained.

The new path does the following in the local static website served by `python -m http.server`, without owner credentials or remote publishing.

1. Imports the real **Contact page** into the experimental Fluid Layout Lab as source-linked blocks.
2. Selects an imported text block and uses the actual UI prompts to stage **one paragraph**, **one heading**, and **one link** to `research.html`.
3. Opens **Review text edits** and asserts the status reports **three staged additions** and that the review panel lists all three insertion types.
4. Downloads the generated **Publishable edits** review HTML. It checks the exact notice reports **three new content blocks** and that the page contains each test insertion and the correct `research.html` link destination.
5. Uses **Review transferable edits in legacy editor**, confirms the native transfer dialogs, follows the same-origin navigation to `editor.html`, and waits for the legacy editor's local draft record for `contact.html`.
6. Reads the actual **browser localStorage draft**, asserting the three ordered kinds `paragraph / heading / link`, the preserved relative link destination, the selected Contact source page, and consumption of the temporary `sessionStorage` handoff key.

A failure at any of these stages is recorded with a specific test name and causes a nonzero script exit. All test content is synthetic and exists only in the isolated ephemeral local browser context. This does not modify `contact.html` or the actual deployed academic website.

## Executed verification

The exact-source [**GitHub Actions run 41784065285**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41784065285), job **126422014544**, completed **success** with **all steps passing**. The job installed **Playwright 1.57.0** and its Chromium build, ran the extended script against the checked-out repository over localhost, then printed **`Editor directory and Fluid Layout Lab import checks PASS`**. The run uploaded the browser evidence artifact **`editor-route-audit-results`**, ID **13299864720**, containing the JSON result record and original Contact-import screenshot. The test assertions were part of the same script invocation and are included in its success exit code, not inferred from the earlier source-only inspection.

The source file `scripts/audit-editor-routes.py` was fetched again after the edit with **exact content readback**. No `fluid-layout-lab.html`, `editor.js`, public research/teaching text, citations, student information, website contact choice or publishing configuration changed.

## Verified scope and remaining limitations

The supported staged paragraph, heading and link insertion path is **browser-tested in local Chromium**, including the generated applied HTML and receiving editor's unpublished local draft. The earlier copy corrections in C-RV29ee are therefore supported by both implementation inspection and this actual interaction test. It remains **unverified** that a real owner can authenticate and publish such a draft to GitHub, that every other insertion/error path is correct, or that physical devices and non-Chromium/assistive-technology environments behave identically. Source tests do not become production publishing certificates.

The Research bibliography remains **53 references, 46 F / 6 A / 1 M / 0 P**. The author's final submitted manuscripts remain **sufficient website source documentation**, with no raw student, consent, grading, reader or scoping charting records requested.

**Exact next checkpoint C-RV29ej | Browser rejection of stale or conflicting supported-content handoffs.** With the positive local staged-content transfer now exercised, the next compact functional test can verify whether the receiving editor correctly refuses a handoff whose original anchor has changed, or when a browser-local draft already exists. This would directly test user-visible rejection/status language and preserve the rule that a failed transfer must not overwrite an existing draft. If no new defect emerges, record that limited browser result without rewriting completed academic pages. Keep authenticated publishing, external A/M publication access and physical accessibility as distinct boundaries. Broader whole-site verification remains **In progress**, with current-source academic editorial writing **complete at its documented tier**.
