# C-RV29eq | Editor V2 concurrent browser-tab draft safeguards

**Date:** 4 November 2026  
**Previous verified stage:** [C-RV29ep](EDITOR_V2_CORRUPTED_DRAFT_RECOVERY_C-RV29ep_2026-11-04.md).  
**Status:** Provisional until the final e3b7b004 regression and the public delivery of the final script version both pass. The earlier two-tab revision passed all 86 tests per engine (258/258); later publication-race refinements still require their own complete outcome.

## Confirmed earlier baseline

C-RV29ep passed [84/84 in Chromium, 84/84 in Firefox and 84/84 in WebKit (252/252)](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632451), the [22/22 exact public-byte rerun](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632377), and the [three deployed HTTPS browser smoke jobs](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632428).

The first two-tab regression revision passed [86/86 in Chromium, Firefox and WebKit (258/258)](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41817011756). This proves the tested two-tab actions at `5181b52c`, but not later source changes.

## Risk and implementation

`storeLiveDraft()` previously wrote the browser storage key unconditionally. Two editor tabs open to the same HTML file could hold different copies of the valid draft; the older tab could then overwrite the newer one without any warning.

The editor now preserves the raw saved draft value observed when opening the page. Before each normal save, it compares browser storage with that original value and refuses to overwrite a changed draft. A `storage` event from another tab provides the same warning early. A prominent alert near the live-page preview offers three explicit choices.

- **Download this tab's edits** saves the current patch records as a JSON backup without modifying browser storage. This is a *technical backup*, not a directly importable edit package.
- **Load newer saved draft** asks for confirmation before replacing current in-memory edits, rechecks the current stored bytes and reloads the selected source page.
- **Keep my edits instead** asks for explicit confirmation, checks that storage has not changed again since the prompt and writes this tab's patch records in place of the newer version.
- Ordinary Save, attempted live publication and browser page navigation cannot silently resolve the conflict. Navigation asks for confirmation; browsers that support the standard `beforeunload` warning may also prompt before closing a tab that has conflicting unsaved edits.

Publication is guarded by `assertLiveDraftNotSuperseded()`, first before contacting GitHub and again in `requireUnchangedDraft()` before the GitHub PUT. This checks the current browser storage synchronously, covering a second tab saving during the source-verified GitHub GET even if the storage notification has not yet been handled. The existing GitHub file-SHA check and exact-original-source comparison remain in force.

## Browser tests

Added to `tests/editor-v2-current-website.spec.cjs` and run with actual website HTML and intercepted GitHub writes.

1. Two real pages in the same browser context load Contact, the first tab saves a change, the second attempts its own edit and is blocked from overwriting storage or publishing. The second tab downloads a copy of its edits, cancels an overwrite, then explicitly replaces the saved draft; the first tab receives the conflict warning and can accept the newer version.
2. Two tabs load Research; switching pages with unsaved conflicting edits requires an explicit confirmation, with the cancelled navigation preserving both the page selection and the newer localStorage value.
3. A second tab writes a newer draft while the first tab's mocked GitHub file GET is being handled. The publication must fail before any PUT request, preserve the newer stored draft and display the conflict warning.

The third test was added in commit `e3b7b00475996ab97726cd78563208498862e718`. The latest edited JavaScript is referenced by `editor-v2.html` as `editor-v2.js?v=20261104-editor-v2-multi-tab-v60` (code commit `4a7dc7e6`, cache-reference commit `c6679abb`). Final current-source browser run: [41817895451](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41817895451).

One intermediate pre-two-tab test run [41816920748](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41816920748) recorded a Chromium timeout waiting for `interests.html` to complete GitHub-source loading (83/84), while Firefox and WebKit passed. Subsequent full [41817011756](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41817011756) passed all engines. Do not treat the failed intermediate run as a passed run or diagnose the timeout as fixed without a repeatable cause.

## Limits and outstanding checks

At this writing, the last current production byte match is **C-RV29ep**. Delivery of `v60` and the final C-RV29eq run are still pending verification. No real owner-authenticated GitHub PUT was executed. There is no automatic merge of divergent browser-tab edits. The conflict resolution intentionally requires the owner to select one draft, and the JSON emergency backup is not currently restorable through the UI. Cross-device live editing and physical-device browsers remain untested.

**Next evidence:** final 87-per-browser run, latest successful 22/22 public editor-delivery parity, three deployed-browser smoke checks, any discovered browser failure corrections, then close C-RV29eq and update the master checkpoint.
