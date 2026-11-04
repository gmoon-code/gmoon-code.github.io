# C-RV29ep | Editor V2 malformed local-draft recovery and publication safeguards

**Date:** 4 November 2026  
**Continued from:** [C-RV29eo](EDITOR_V2_COMBINED_EDIT_PERSISTENCE_C-RV29eo_2026-11-04.md).  
**Status:** **Verified** at commit `abaeff9c462c3ae482ae4ba7a5f28b83a24ab357`. The three-engine real-source regressions passed 84/84 each (252/252); after GitHub Pages deployed the editor, public HTTPS bytes matched 22/22 and all three deployed-browser smoke jobs passed. This statement pertains to C-RV29ep, not subsequent C-RV29eq changes.  
**Latest functional code commit:** `abaeff9c462c3ae482ae4ba7a5f28b83a24ab357`.  
**Current fully passed editor browser revision on C-RV29ep close:** C-RV29ep, with 252/252 engine checks, 22/22 exact public bytes and all three deployed-browser smoke jobs passing at its tested version.

## Concrete defect discovered

`loadLiveDraft(page)` previously parsed browser storage and silently ignored malformed JSON, invalid patch records, duplicate selectors or arrays with more than 180 entries. Some invalid drafts were partially loaded; others were presented as an empty draft. `storeLiveDraft()` could subsequently overwrite the original localStorage key on the next user edit or Save, potentially losing the only stored version of the original data. These cases were not covered by the C-RV29eo 246-check regression.

## Implemented safeguards, without modifying academic site pages

- Validate the full stored draft **atomically**. Reject invalid JSON, non-arrays, over-limit lists, invalid records and duplicate selectors without loading a valid subset.
- Preserve the exact original storage string. Until the owner explicitly resolves it, do not replace it on ordinary saves.
- Display a persistent, visually prominent recovery alert beside the original-page view, with **Download original draft** and **Discard unreadable draft** actions. No user token is requested by either action.
- Download the exact original bytes as text without altering localStorage. Discard requires confirmation and compares the saved original against the latest localStorage value before deleting, so it cannot erase a version updated in another tab.
- Stop source-matched previews and live GitHub publication when the unresolved damaged draft is active. A later valid draft can be saved only after explicit resolution.
- Keep the alert specific to Live website mode and correct the confirmation message when browser storage refuses to save the newly edited draft.
- Advance both `editor-v2.js` and `editor-v2.css` fixed-version query identifiers to `20261104-editor-v2-draft-recovery-v57` in `editor-v2.html` so production browsers can obtain the corrected code after deployment.

Relevant source commits: `2d6eda29` (safe draft loader and recovery controls), `10c7dd30` (UI and version), `8c39c456` (warning styles), `023ae703` (CSS version), `b7f24ccd` (warning placement), and `abaeff9c` (visibility and save-feedback refinements).

## Added negative-case real-page regressions

The new tests in `tests/editor-v2-current-website.spec.cjs`, commit `30feebcf6643dbe913c70b9352821d4bfddb5786`, use the real GitHub-source HTML and intercept any GitHub mutation request.

1. **Malformed Contact draft:** store broken JSON, reload, confirm the warning, attempt a real-page edit and save, and assert original storage is unchanged. Attempt preview and mock authenticated publication, confirming they are blocked. Download and read the exact original text, cancel discarding once, then explicitly confirm discarding and verify that current in-session edits are saved and restored on reload.
2. **Partly invalid Research draft:** start from a valid user-created appearance patch and inject four invalid storage variants: mixed invalid records, duplicate selector records, 181 entries, and a non-array. Each must present an alert, reject partial application, retain exact storage contents after Save, and remain safely recoverable after switching pages.

**Final current-source verification workflow:** [run 41815632451](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632451) passed **84/84 Chromium, 84/84 Firefox and 84/84 WebKit (252/252)**. [Public byte-verification rerun 41815632377](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632377) passed **22/22 exact matches** on its first retry round after Pages deployed. The initial attempt had failed with **19/22** due to three still-stale editor files; this was a deployment-timing failure. [Deployed HTTPS browser smoke rerun 41815632428](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632428) passed across all three engines. [Academic-editor browser run 41815632275](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41815632275) also succeeded.

## Boundaries and next action

The C-RV29ep current-revision cross-browser results and editor delivery parity **are established by the linked runs**. Physical-device operations are **not yet established**. Do not reuse C-RV29eo's passing run as proof that this new implementation works. **Real GitHub owner-authenticated publication, post-PUT deployed confirmation, and same-origin personal-access-token isolation** remain outside the validated tier. No source academic text or original photographic assets was changed in this stage.

**Next stage:** [C-RV29eq](EDITOR_V2_MULTI_TAB_DRAFT_CONFLICT_C-RV29eq_2026-11-04.md) tests **valid** draft conflicts across simultaneous browser tabs. The damaged-draft compare-before-discard guard from this stage is limited to that recovery action. Browser-based owner-authenticated publication, storage concurrency beyond supported web-storage events, and physical-device checks remain separate.
