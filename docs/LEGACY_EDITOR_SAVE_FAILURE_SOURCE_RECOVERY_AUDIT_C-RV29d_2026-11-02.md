# C-RV29d | Legacy editor failed browser saves, page switching and older draft preservation

**Date:** 2 November 2026. Continued from [C-RV29c](LEGACY_EDITOR_DRAFT_EXPORT_PUBLISH_AUDIT_C-RV29c_2026-11-02.md).

**Status:** Selected guidance and related safeguards corrected and source-verified with isolated function checks. Actual browser unload prompts, persistent storage and live publication were **not** verified. Comprehensive academic website content audit remains **In progress**.

## Source and coverage

Examined the current `editor.js` save and restore routines (`updateStatus`, `saveDraft`, `scheduleDraft`, `restoreDraft`), every direct `saveDraft()` caller followed by another `updateStatus()`, page change handling in `loadPage()`, reset confirmation, `beforeunload` handler, and the corresponding explanations in `editor.html`. Re-read the C-RV29c audit and retained C-ED2–4 explanations of direct GitHub commit versus later Pages deployment, optional pull-request service status, and staged image limitations. No academic content or research assertions were reworded.

The original implementation caught local-storage write errors and correctly displayed “Draft storage unavailable · Export your HTML”, but many direct `saveDraft()` callers immediately replaced that warning with an ordinary update message. Other operations updated the same status while a failed save remained unresolved. Switching the selected page called `saveDraft()` but proceeded even if the write failed, so current in-memory edits could be lost. A source-fingerprint mismatch set `state.staleDraft` without applying the stored browser draft, but `saveDraft()` only skipped writes while the new draft contained no edits. Once edited, the newer in-memory draft could overwrite the older stored record. The reset confirmation did not identify that it could delete this older record.

These are verifiable source-level issues. Browser-specific handling of `beforeunload`, actual storage errors, successful file downloads and authenticated publication require separate runtime testing.

## Implemented corrections

1. **Persistent status disclosure after a save failure.** Added a short-lived `state.draftSaveIssue` field used by `updateStatus()`. A failed browser write now retains the actionable message “Draft not saved in browser · Export HTML before leaving” even when an edit handler later displays a different operation status. A successful later storage operation clears the warning.
2. **Accurate save outcome.** `saveDraft()` now returns success/failure while retaining its existing local-storage JSON shape, draft key, source fingerprint and edit payload. It reports success only after `setItem()` or `removeItem()` returns without error. A message about free-positioned or layered content being “saved” was changed to “updated”, avoiding conflict with a failed save.
3. **Older browser draft retained.** When `state.staleDraft` indicates a different source fingerprint, new edits are kept in the active session but are not written over that older browser draft. The status explicitly says the older draft was retained and the current edits have not been stored; the author must export HTML before leaving. With no new edits, the stored older draft remains untouched and the existing “not applied” distinction is preserved.
4. **Page switching when edits are not stored.** If the selected page would change and current edits cannot be saved, the editor keeps the existing page and both page selectors in place, explains that the edits are still open in the current session and prompts the author to export HTML. This is deliberately limited to unsaved current edits. Switching can still proceed when there is no changed content at risk.
5. **Page close warning.** `beforeunload` attempts its normal synchronous draft save and requests the browser's native confirmation if changed edits remain unstored. The public instruction explicitly says that a browser close warning may not appear. This is a best-effort safeguard, **not** a guarantee of a browser prompt or recoverable draft.
6. **Reset deletion warning.** A mismatched older browser draft is specifically mentioned in the reset confirmation, since `resetPage()` clears `staleDraft` and can remove that stored record. The blocked-switching notice and static help explain the consequence. Existing reset, editing, export, media staging and GitHub publication operations were otherwise retained.

Corrections maintain straightforward, specific author guidance without promotional language, unfounded promises of persistence or unnecessary rewrites.

## Commits and verification

Five narrowly scoped commits were created.

- `c99a800a91b0ee33f9ecb4c22d80aee20f420ddb`, `editor.js`, save outcomes, retained warnings and source mismatch protection.
- `8fa9d29cdd262df173389c5daba94ab45bba3ac2`, `editor.js`, page-switch and best-effort unload handling.
- `4005acec4a2694827b867aa07d7be5fb4c3bd5e1`, `editor.html`, plain-language save and older draft guidance.
- `e93d8d75f7ee4563ac741be67714ea6d26eea0ad`, `editor.js`, reset confirmation specifying deletion of the older stored draft.
- `2dcfeda4b2b371186f6c500dfed88867fd492fe2`, `editor.html`, matching reset explanation.

Final refreshed GitHub blob hashes are **`52064378045f21d613f08f662c471b79a20914c1`** for `editor.js` and **`44c650d15e378e4326304b499ce28e887f3a4114`** for `editor.html`. Optional `editor-publisher-config.js` remained `cf7a2260dc557daa55dff9cc4cdc42ae3be3eca5`.

**32/32 final targeted checks passed.** These include isolated JavaScript function executions with simulated storage acceptance, storage rejection, save retry, stale source drafts, blocked page switching and old-draft reset prompts; updated source assertions; syntax parsing of the complete `editor.js`; 149 unique static `editor.html` IDs; and source invariant checks for existing direct publication and staged media restrictions. The tests exercise isolated branches with mocks, **not** a genuine browser session. No authenticated GitHub commit or GitHub Pages deployment was attempted. The six existing Editor V2 browser regression failures were not modified or retested.

## Unresolved risk and exact next checkpoint

**A separate draft-recovery problem remains.** `restoreDraft()` can set responsive groups, additions or edited nodes before later validation throws. Its catch handler currently says the original page has been left available, even though partial edits may remain. The later `loadPage()` status may report “Draft restored” based on non-empty edit state without independently establishing complete restoration. A subsequent save may replace the earlier browser record with partial data. C-RV29d did not modify this more complex recovery sequence or claim it is safe.

**Exact next checkpoint C-RV29e:** inspect and correct legacy editor incomplete-restoration messages and any source-backed safeguards required to prevent a partial restoration from being presented as complete or overwriting the previous draft. Check validation ordering, status precedence, reset effects and whether the current preview is trustworthy enough for export; do not alter the GitHub publishing algorithm or assume browser tests have passed. Preserve all C-RV29c–d improvements and the six independent Editor V2 browser failures.

The final-August original scoping S2C 20-study matrix, AP Biology original assessments, rater/consent/assent/permission records, and preferred public email decision remain independent unresolved evidence/owner blockers.

**Overall comprehensive academic website content audit: In progress.**
