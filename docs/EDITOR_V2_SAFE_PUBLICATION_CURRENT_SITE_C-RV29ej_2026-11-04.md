# C-RV29ej | Editor V2 current-site publication failure safeguards

**Date:** 4 November 2026  
**Continuation:** C-RV29ei and the interrupted 84/84 real-page responsive browser checkpoint.  
**Scope:** Existing editor publication logic, exact present repository HTML supplied through intercepted GitHub GET responses, and safe simulated publication. This is a test and evidence stage, not an authenticated production publication.

## Evidence and changes

The latest Editor V2 current-website browser workflow completed successfully in all three engines on commit `9b412e9d304faeab2c513045ceb890c8b9ee64d4`.

- [Cross-engine Actions run 41787736511](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41787736511): **35/35 Chromium, 35/35 Firefox, and 35/35 WebKit, totalling 105/105 checks**. These are engine-specific instances of the same 35 cases, not 105 independent feature types.
- Existing tests check that the selector matches the **17** current editable source files, that exact checked-out HTML is used as mocked GitHub source for each page, and that loading and previewing do not publish anything.
- Representative real-page editing tests cover heading appearance, undo and redo, local draft retention after reload, both phone and tablet viewports, and image crop preservation on Pungmul.
- The earlier simulated successful direct publication cases were expanded at intervening commits to four representative real pages. These simulate GitHub's Contents API and do not make an authenticated request.
- [Commit 9b412e9](https://github.com/gmoon-code/gmoon-code.github.io/commit/9b412e9d304faeab2c513045ceb890c8b9ee64d4) added two new browser cases to `tests/editor-v2-current-website.spec.cjs`. On actual `contact.html` source, a newer mocked GitHub GET revision blocks the attempted publication before any PUT, while the local draft and credentials-in-storage invariant are retained. On actual `research.html` source, a mocked HTTP 409 response to the one Contents API PUT is reported as failure without discarding the draft or presenting success. All other GitHub writes are blocked by the fixture. No Editor V2 production implementation was changed in this stage.

Earlier commits `5060282` and subsequent successful workflow runs also introduced and verified the source-image CSS specificity correction required for the tested Pungmul crop. The preceding 84/84 checkpoint remains valid historical coverage at its tested revision; the later 105/105 result supersedes it for the expanded suite.

## Publication architecture and residual boundaries

`editor-v2.js` uses a user-supplied fine-grained GitHub personal access token to write a selected HTML file directly to `main` through the GitHub Contents API after user acknowledgement. It re-reads the latest source, compares its complete HTML to the verified editing baseline, reassembles the current patches and supplies the current GitHub blob SHA for conflict detection. A separate optional GitHub-App/Cloudflare-Worker draft-PR service exists for the older editor, but the checked public `editor-publisher-config.js` contains no deployed connection settings and must not be credited as Editor V2's publishing mechanism.

The current set of 17 editable source pages contains no external-hosted `<script src>` tags, though pages do run first-party scripts. Editor V2 renders source HTML in a same-origin iframe and accepts a token in the parent document. This audit therefore **does not claim JavaScript-level isolation of the token from a potentially compromised same-origin page script**. This is a trust-boundary consideration, not evidence of a currently malicious script or a successful disclosure.

**Not verified:** a real owner-authenticated GitHub token submission, an actual protected-branch conflict on production GitHub, the subsequent GitHub Pages publication path, representative physical-device touch behaviour, or arbitrary untested edits on every site page. Simulated HTTP 409 and stale-source rejection establish the browser's response to those conditions, not GitHub's real-time operational behaviour in an authenticated account.

## Outcome and next checkpoint

**Completed:** new rejection and conflict regression checks, verified under Chromium, Firefox and WebKit, with unchanged production editor source. **Not completed:** authenticated end-to-end publishing or physical-device assurance. The broader website verification remains in progress under these explicit limits.

**Next: C-RV29ek.** Perform a bounded security and functional trust-boundary review of the owner-token publication dialog and source iframe, distinguishing demonstrated behaviour from hypothetical risk. Continue with non-destructive static and mocked checks; do not use or request a real GitHub token or initiate a live publication without separate, explicit authorization. Preserve existing academic prose and research-source review decisions.
