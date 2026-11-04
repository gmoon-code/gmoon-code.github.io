# C-RV29et | Editor V2 Free Design Canvas draft recovery

**Date:** 4 November 2026  
**Continued from:** [C-RV29es](EDITOR_V2_BROWSER_STORAGE_FAILURE_C-RV29es_2026-11-04.md).  
**Status:** **Verified for repository browser behaviour and exact public HTTPS file delivery.** Residual owner-authenticated publication, direct-token same-origin isolation and physical-device checks remain separately open.

## Scope and observed defects

The Free Design Canvas saves independent scene JSON using `moon-academic-editor-v2:<page>`. This is distinct from the original-layout source-edit draft keys. Prior to this stage, a Canvas `localStorage` write failure produced only a transient status; the user could navigate away while the current scene existed solely in memory. An unreadable saved Canvas was replaced in the visible workspace with an empty scene, without a persistent recovery interface that protected the original stored bytes. Two tabs could overwrite each other's Canvas draft without an explicit conflict resolution. Staging publication could proceed from a Canvas not verified as locally saved. Finally, the JSON importer rejected files above 3 MB even though legitimate Canvas backups containing inline photographs can exceed that size.

## Implemented safeguards

- Added separate Canvas loaded-raw, dirty, failed-save, unreadable-draft and concurrent-tab conflict state, with a persistent Canvas warning shown while its workspace is open.
- Kept the current Canvas scene in memory when browser storage refuses reading or writing. Added an immediate downloadable JSON backup and explicit save retry.
- Preserved unreadable stored bytes; provided a download of the original and a confirmation-gated discard with a last-moment comparison against the actual storage value.
- Checked saved Canvas versions before overwriting, including cross-tab storage events. Added explicit load-newer and keep-current options, each with confirmation and a fresh conflict check.
- Committed active Canvas text and attempted any pending save before page navigation. Warned before discarding edits that could not be saved, and added a `beforeunload` safeguard.
- Refused staging publication when Canvas storage is failed, conflicted, unreadable, out of sync, or contains changes not recorded as saved. Rechecked just before the GitHub write. No real GitHub writes occurred during testing.
- Raised Canvas JSON restore size support from 3 MB to 64 MiB so larger backups can be restored. Original-layout JSON imports retain their independent, stricter bound. Existing scene validation and per-page identity checking remain in effect.
- Changed only the editor JavaScript, editor HTML, current-website browser tests and their pull-request workflow. Public scholarly HTML pages and original photographs were not edited.

Implementation merged through [PR #11](https://github.com/gmoon-code/gmoon-code.github.io/pull/11) at commit [`d71450ae`](https://github.com/gmoon-code/gmoon-code.github.io/commit/d71450ae2ace8dda928bec136cd549a16b340a86). The deployed editor HTML references `editor-v2.js?v=20261104-editor-v2-canvas-recovery-v66`.

## Source-faithful test evidence

Five new real-page Playwright cases, added to `tests/editor-v2-current-website.spec.cjs`, cover the following.

1. Canvas quota denial on Contact, visible edits, downloadable restorable scene, cancelled page switch, blocked staging PUT and successful retry/reload.
2. Corrupted stored scene JSON, unchanged original bytes, explicit download and confirmation-gated discard.
3. Two independent tabs with dissimilar Canvas edits, protected newer saved draft, backup and owner-confirmed overwrite.
4. Denied Canvas storage reads after changing to Research, visible warning, restorable export and successful retry.
5. Import of a valid Canvas JSON backup larger than the old 3 MB limit.

[PR cross-browser run 41831570259](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41831570259) passed **99/99 in Chromium, 99/99 in Firefox and 99/99 in WebKit**, **297/297** engine checks in total. The independent advanced Canvas, standard editor and accessibility PR checks also passed. [Post-merge current-site run 41832795836](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41832795836) completed successfully.

## Public delivery boundary

The first [exact-delivery run 41832796073](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41832796073) failed **20/22** because `editor-v2.html` and `editor-v2.js` were still serving prior code while Pages builds were cancelled in rapid succession by generated audit-result commits. Those results must not be described as a pass.

A subsequent successful [GitHub Pages deployment 41833143601](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41833143601) completed. **Attempt 2 of delivery run 41832796073 passed 22/22 exact HTTPS file comparisons** with zero failed resources. [Deployed-browser smoke 41832795773](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41832795773) initially passed in Chromium, Firefox and WebKit, though that initial smoke preceded the exact-byte confirmation and cannot alone establish browser execution of the later deployed v66 revision.

## Limitations and next checkpoint

The tests intercept publication and never use a real personal access token. They verify staged and original-page guards, not owner-authenticated GitHub publication. The editor's direct-token form remains exposed to trusted same-origin page scripts, as previously documented; stronger credential isolation requires a separate authenticated publishing design. Physical mobile and tablet devices have not been tested.

**Next C-RV29eu:** independently evaluate real owner-authorized publication and the safe authentication boundary. Use no credentials in chat or test fixtures. Preserve the distinction between intercepted REST PUT tests, verified delivered bytes, production browser smoke and actual owner-authorized commits.
