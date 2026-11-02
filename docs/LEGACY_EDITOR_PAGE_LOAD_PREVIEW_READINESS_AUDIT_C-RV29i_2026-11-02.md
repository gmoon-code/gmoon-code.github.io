# C-RV29i | Legacy editor asynchronous page loading and preview readiness

**Date:** 2 November 2026. Continued from [C-RV29h](LEGACY_EDITOR_PAGE_SEARCH_BROWSE_OUTLINE_AUDIT_C-RV29h_2026-11-02.md).

**Status:** Source-grounded loading feedback and narrowly related preservation safeguards were implemented and tested with isolated mocked JavaScript functions. Browser iframe delivery, real download persistence and authenticated publication have not been tested. Overall comprehensive academic website content audit remains **In progress**.

## Reviewed scope and previously verified decisions

Examined `editor.js` `loadPage()`, `renderPreview()`, `updateStatus()`, source parsing and indexing, draft restoration, attempted draft saving, iframe `onload` and preview failure notices. Reviewed the matching initial status, script reference and page picker in `editor.html`. Cross-checked the C-RV29c–h reports and ledger to preserve verified stale-draft protection, image staging restrictions, source preservation and direct GitHub publishing boundaries.

Before this stage, `loadPage()` incremented its request token, but an earlier request that failed before returning HTML could still enter its catch handler, overwrite the later request's status and reset the selectors. It replaced the active `state.page`, `state.doc` and original-element indexes before all operations including draft restoration and `renderPreview()` had completed; a later exception could leave a partially new working state behind with the older iframe still visible. It also discarded a staged image file **before** confirming that the requested page had loaded successfully. Although the preceding C-RV29h update deferred the heading change until after rendering, the main status still said the page was ready or its draft restored without establishing that the iframe's edit handlers had attached.

An author could also continue editing or stage a different image while a page request was awaiting a response. The earlier single save/check at request initiation could miss those later edits. Finally, the initial `editor.html` text asserted “Local draft · Not published” and “0 unsaved changes” before even the first page had loaded; its script query string still carried an October gesture-safety version identifier despite the many newer source corrections.

## Corrections implemented

1. **Stale request errors cannot override a newer request.** `loadPage()` now tests its request token immediately after the fetch response and after the response body, and before reporting any caught error. The normal page selectors are restored only for the current request's failure.
2. **A failed page preparation retains the previous draft.** After the requested source has been parsed and a real `main` element confirmed, the loader snapshots the prior in-memory working state and relevant mutable collections. An indexing, restoration or preview-preparation exception restores that working state, attempts to rebuild its preview and gives a specific failed-switch notice. This is an **in-memory rollback**, not a claim of atomic localStorage or GitHub behaviour.
3. **Staged binary preservation during failures.** The old image is no longer cleared before the fetch. It is discarded only after successful source preparation and a page switch, following the existing confirmation. Failures before that point keep the staged file available.
4. **Preview readiness separate from source retrieval.** The page-load status now says “Page source loaded · Preview initializing · Not published” after the source and preview markup have been prepared. An iframe `onload` callback announces the prepared “Ready to edit”, “Draft restored” or “Older draft not applied” state only after its editing setup succeeds. A failed iframe setup reports a preview problem and retains a warning across later edits. Placement validation failure is likewise retained as a warning until a successful subsequent preview; recovery clears the warning.
5. **Late iframe event guard.** The preview callback captures the page-load token and ignores an event when a newer requested page has superseded it. This is a bounded source guard, not evidence that all browser-specific iframe event sequencing has been tested.
6. **Edits and staged media changed during fetching.** Immediately before committing a different page, the loader tries to save any edits made while waiting for the source. If storage refuses current edits, the old page remains selected with an explicit export recommendation. A different image staged during the fetch requires fresh confirmation before its file can be discarded.
7. **Initial interface and script revision.** Static text now says “Loading editor · Not published” and “0 edited elements”, avoiding an unsupported initial saved-draft claim. The `editor.js` query-string revision was updated to the current audit stage so that the deployed editor HTML requests the newly reviewed script rather than reusing an old URL token.

The existing draft JSON format, research HTML, token management, GitHub Contents API publication, source comparison, and image-upload limitations were not modified.

## Source commits and verification

Six file-scoped commits were applied:

- `198c7b98b7677b6d221ce040249510ff31b2beef`, `editor.js`, explicit preview readiness and persistent failure status.
- `693656949092015bda8880bbab34bed8784a0a2f`, `editor.js`, fetch token checks, parsed-source guard, prior-draft recovery and delayed image clearing.
- `b3946c29403c8d110510dbdd00903789b882edcd`, `editor.html`, honest initial editor status.
- `217b6be0867e7be0909117733481b27f36440591`, `editor.js`, iframe token check and recovered-warning clearing.
- `4c06995cfaaee6609ab28349e106182954166e0b`, `editor.js`, recheck late edits and newly staged image before changing page.
- `b020f5c36ab4610a1214aacf459e06cb2155edb5`, `editor.html`, current script URL revision.

**42/42 targeted isolated-function and source checks passed** in four runs: (a) **15** loading/rollback cases, including network error, HTTP failure, missing main, indexing error, preview assembly error and staged-image retention; (b) **7** iframe-readiness cases, including genuine callback completion in a mock DOM, layout mismatch, recovery, callback exception and stale page token; (c) **7** overlapping-request/source/HTML invariant cases; (d) **13** in-flight edit/image recheck cases and syntax/HTML checks. The tests do **not** prove that a real browser saves drafts, attaches every iframe handler, resolves overlapping frame events reliably, downloads HTML or deploys through GitHub Pages. No authenticated action was attempted.

An earlier test harness in this sequence created an unresolved mock promise after the relevant assertions. That unresolved mock was not a repository defect and was replaced by the subsequent explicit overlapping-request test. Actual browser tests and the six previously documented Editor V2 failures remain independent outstanding tasks.

## Independent scholarly evidence and exact next checkpoint

The [53-reference Research evidence crosswalk](RESEARCH_OVERVIEW_53_REFERENCE_COVERAGE_CURRENT.md) records **39 substantial-original-text F**, **13 abstract/indexed A**, **one bibliographic/book M** and **zero undocumented P** references as of C-RV28t. This does not establish that every article was read cover to cover or that all research interpretations are conclusively verified. Recent cross-page verification stages C-RV28u–w reviewed the principal published academic pages. Accordingly, the next bounded source-verification task should return to the Research overview rather than presuming another legacy-editor submodule is the highest-priority unreviewed content.

**Exact next checkpoint C-RV29j:** inspect the `research.html` authored paragraph that cites **Airton (2023)** and the matching bibliographic entry, cross-check the 53-reference crosswalk and earlier C-RV23b claim-audit report, then seek accessible original full-text or authoritative publisher material to determine what Airton's article can actually support. Verify the population/context, conceptual framing, attributed inference, and nearby prose/paragraph connections. Update its evidence tier only if substantial original material is genuinely inspected; otherwise retain its A-tier status and document the limitation. Make public-page changes only when a specific error or genuinely better, voice-preserving wording is established. The next audit stage should be short, source-faithful and separately recorded.

Maintain the final-August S2C original 20-study coding matrix, original AP Biology assessments and independent rater/consent/assent/permission records, public contact email owner choice and six Editor V2 browser regression failures as unresolved independent evidence/functional blockers.

**Overall comprehensive academic website content audit: In progress.**
