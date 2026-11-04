# C-RV29er | Restorable original-layout page drafts

**Date:** 4 November 2026  
**Previous verified stage:** [C-RV29eq](EDITOR_V2_MULTI_TAB_DRAFT_CONFLICT_C-RV29eq_2026-11-04.md) passed 87/87 in each browser (261/261), 22/22 exact production files and the deployed browser smoke.  
**Stage status:** **Implemented, verification pending.** Do not advance the fully verified Editor V2 baseline from C-RV29eq until the latest 92-case/engine run and new production delivery checks finish.

## Identified gap

The previous two-tab conflict workflow could download an unstructured JSON patch array but could not restore those patches directly from the editor. The existing canvas JSON importer applies only to the independent canvas scene, not to real source-preserving web-page edits. The previously available **Export original-layout HTML** produces useful HTML for review but cannot reconstruct the editable live-page draft.

## Implemented

Added **Download editable draft JSON** and **Restore editable draft JSON** alongside the original-layout HTML export in Editor V2's live inspector. The damaged-draft and concurrent-tab warning panels also offer **Restore valid JSON backup** and **Restore saved JSON backup** shortcuts to the same validated file picker. The original unreadable browser bytes remain available through the separate **Download original draft** action.

- New versioned backups use `{"format":"moon-editor-v2-live-draft","version":1,"page":"contact.html","patches":[...]}` and download as `contact.html.live-draft.json` for the selected file. Backups include source text, layout, appearance, picture framing/effects, inserted objects and grouping where present in the patch map. The token is not part of the backup.
- Import also accepts the legacy C-RV29eq bare patch arrays **only** if their filename exactly matches `<selected-page>.unsaved-live-edits.json`. The new backup format carries an explicit page identity. Both require an existing editable page in the editor's page selector.
- Validate the JSON shape, a 3 MB file cap, 180-record limit, every patch schema and unique selectors. Before any write, test the candidate against a freshly parsed copy of the **displayed, verified GitHub source** with the same strict edit assembler used for live publication. Reject unresolved selectors and conflicting edits without changing storage or the current draft.
- Confirm any import that replaces current work. Recheck selected page, in-memory edit snapshot and source bytes after reading the selected file and again after confirmation. Compare saved browser storage with the value present before reading the file, preventing a restore from overwriting another tab's newer local draft. On mismatch, stop and display the existing cross-tab conflict alert.
- Only after validation and explicit confirmation write the restored patch list to localStorage. Reload the saved draft and editing frame. The new backup does not publish anything to GitHub. The user must review the verified preview and separately authorize publication.
- Show status explaining rejected, cancelled or successful imports. Unreadable stored drafts can be replaced by an authenticated-by-user valid local backup after confirmation, without falsely claiming that the original corrupted data has been repaired automatically.

Relevant source commits `41f5ba3e` (restorable draft workflow), `101bf89d` (correct source-element validation regex), `941bb05a` (initial UI), `5debf638` and `446a3530` (direct recovery-alert shortcuts), `97629c3b` (prevent misleading empty backups for unreadable drafts), and `945f8e30` (final cache-busted editor script `v63`). The standalone `liveDraftFile` input is created by JavaScript; it is not a static HTML form control.

## New browser regressions

Added five real-site browser cases to `tests/editor-v2-current-website.spec.cjs`, commits `864177b1` and `f7d90b1d`. Later source-matched test corrections and expansions are `48a20343` (direct warning-panel file chooser), `80bbb493` (confirm storage values, not transient status text) and `19ccf93d` (unreadable draft export protection).

1. Contact live-page formatting backup is downloaded, checked for format/page/content, then restored after clearing the draft; saved localStorage, original layout and verified preview must agree after reload.
2. Research page rejects invalid JSON, mismatched page, duplicate patches, invalid patch schema, stale source selector, independent canvas JSON and unlabelled bare arrays without altering the original stored draft.
3. A valid legacy `contact.html.unsaved-live-edits.json` backup restores over an unreadable stored draft only after confirmation, with refusal preserving its exact original storage bytes.
4. A second browser tab writes during import confirmation. The restore must not overwrite it; a conflict warning must be shown, and there must be no GitHub PUT.
5. Pungmul photograph's rounded crop, rotation, source description and picture metadata survive editable JSON import, remain in the current patch list, and appear in the verified assembled preview.

**Expected size:** 92/92 checks per engine, 276 across Chromium, Firefox and WebKit. **Final verification is not yet established**. Intermediate pre-correction [run 41819586446](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41819586446) passed 92/92 Firefox and 91/92 Chromium and WebKit. The sole failure in each browser was a test relying on one exact transient status message after another tab changed localStorage. It was replaced by direct assertions that confirmation occurred, the conflict alert appeared, storage retained the newer bytes and no GitHub write occurred. The final `v63` browser run was [41820366907](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41820366907), but its cross-tab race test exposed the blocking-native-confirm problem documented below, so it **did not pass**. The latest patched `v64` run is [41822063536](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41822063536); it and a fresh deployed 22/22 parity and smoke verification must pass before closing the stage.

## Concurrent restore race found and corrected in v64

The final scripted test revealed a **real** browser-storage collision when the first implementation used native `window.confirm()` while another tab updated `localStorage`. In Chromium the restore could write the old patch over the new one before the other tab's pending storage event was processed. This invalidated the initial claim that the v63 confirmation and immediate storage comparison always protected concurrent writes. A test failure on the transient status copy was initially misleading; after the test awaited actual confirmation, the newer bytes were observed to be overwritten in Chromium. That was treated as a production issue requiring correction.

C-RV29er therefore replaces the blocking browser-native confirmation with an **accessible, non-blocking in-page dialog**. Storage notifications and event processing continue while the user reviews the restore. On confirmation the loader compares the latest browser value with the value captured before reading the backup; if another tab has changed it, the restore stops and shows the existing conflict warning. The browser tests now deliberately write from a second tab *while that in-page dialog remains open*, then confirm the restore and assert storage and publication safety.

Relevant follow-up commits are `e40a59fc` (asynchronous restore confirmation), `30e65ede` (dialog and script/CSS v64 references), `9249f3b9` (accessible dialog styling), and `9cd3c34e` (test actions and data-race assertions). **The v64 release remains provisional until those tests are confirmed passing.** [Latest v64 three-engine test run 41822063536](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41822063536).

## Remaining limits

- No editor's local JSON backup is a publication event or authentication document. Real owner-authorized GitHub PUT remains separate from mocked browser publication.
- Restore deliberately replaces the existing draft, does not merge two divergent sets of changes automatically, and does not rewrite student or academic website content on its own.
- A malformed or partially corrupt JSON file cannot be salvaged automatically; it is preserved rather than silently applied.
- Same-origin script/token isolation and physical-device operation remain outside the currently verified tier.
- An original-page HTML export cannot be imported as an editable draft, by design. Use the new JSON backup for editability.

**Next:** Inspect the latest current-website browser results, correct any regressions, confirm source and deployed editor versions, then close C-RV29er in the master checkpoint with exact evidence. Do not treat passing previous revisions as verification for this change.
