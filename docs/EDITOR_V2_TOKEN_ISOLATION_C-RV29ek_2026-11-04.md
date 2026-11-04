# C-RV29ek | Editor V2 script trust boundary and publishing-token safety

**Date:** 4 November 2026. **Continued from:** [C-RV29ej](EDITOR_V2_SAFE_PUBLICATION_CURRENT_SITE_C-RV29ej_2026-11-04.md).  
**Scope:** Static source analysis, deliberately synthetic browser tests and cross-engine regression investigation. No real credential, GitHub write or public scholarly page content was used or changed.

## Confirmed current architecture

Editor V2's direct publishing path (`editor-v2.js`) uses the GitHub Contents API with a user-supplied fine-grained personal access token. The editor's form has an ordinary password input and the optional remember-for-tab control keeps that token in JavaScript memory, not browser local storage. The confirmed source-hash and HTTP 409 safety cases from C-RV29ej remain intact.

The live source iframe currently has **no sandbox restriction**. The preview and before/after frames use `sandbox="allow-same-origin allow-scripts"`. Because the portfolio HTML and editor are hosted under the same website origin, first-party page scripts rendered in these frames can run with access to the editor's parent DOM. This means a **compromised or deliberately hostile page script could read a GitHub token entered into the open publishing form**. This is a concrete browser security boundary, not evidence that any of the current site scripts are compromised. All 17 current editable page files use local rather than external-hosted script tags. Code served by the repository must nevertheless be treated as trusted for this particular direct-token workflow.

## Tested proposed mitigation and why it was not retained

We briefly tested an edit frame with `sandbox="allow-same-origin"` (no page-script execution), plus preview/comparison frames with `sandbox="allow-scripts"` (opaque origins). A synthetic-only probe established script blocking in the editor and parent DOM denial in isolated previews under Chromium and Firefox. The expanded real-page suite reached **36/36 passing** in Chromium and Firefox at the intermediate revision.

That change also caused repeatable browser failures. In [WebKit run 41789065962](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41789065962), the intermediate sandboxed revision passed only **24/36** cases, failing heading-edit and publishing-dialog interactions among others. Chromium's older direct source-member drag test also repeatedly timed out in the sandboxed frame. The apparent pointer handling mitigations did not resolve that underlying incompatibility.

**Decision:** Revert the sandbox permission changes and corresponding pointer/overlay experiments rather than release an editor with broken WebKit editing or advertise a security boundary that was not cross-engine viable. Preserve the functional architecture but openly document the remaining script trust boundary. The experimental synthetic probe was removed from the regression suite rather than misrepresenting the current architecture as isolated.

## Current bounded safety improvement

The `editor-v2.html` publishing help text now explicitly warns that same-origin page scripts could read a token while it is entered. It advises using only trusted page code, restricting the token to the portfolio repository, choosing a short expiry and revoking it afterward. The editor's main workspace explanation also identifies this trust boundary. A new real-page test checks that the warning appears and cancelling the publication dialog clears a synthetic token without sending a GitHub write or storing the token in local storage.

Other than this notice and regression-test maintenance, public academic prose and publishing protocol remain untouched. The optional GitHub App/Cloudflare Worker draft-PR service documented in `publisher/SETUP.md` is not configured in `editor-publisher-config.js`; it must not be described as a functioning security replacement for Editor V2.

## Restored-build regression verification

The restored production frame configuration and updated publishing-token warning were tested on commit `0781328321325abe5b7eb9e03a0a6701ac8ab3fb`. [Actions run 41790774039](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41790774039) completed successfully with **36/36 current-website checks in Chromium, 36/36 in Firefox and 36/36 in WebKit, 108/108 combined**. This includes the new form-warning and cancelled-synthetic-token regression. The other restored-build suites also passed: **51/51 source/drag regression** ([41790698259](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41790698259)), **19/19 source-parity and insertion** ([41790698253](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41790698253)), **55/55 advanced interaction** ([41790652668](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41790652668)), and **57/57 academic editor** ([41790652717](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41790652717)). Different suites and Git revisions remain separate evidence, not one simultaneous end-to-end production session.

The post-test repository changes through the checked comparison were audit-document or generated-audit-result files only, not modifications to the restored Editor V2 application or browser tests. The earlier failed experimental sandbox results remain valuable **historical rejection evidence**, not current unresolved failures of the restored build.

## Boundaries and next checkpoint

**Remaining:** Direct owner-token publication is not isolated from same-origin website scripts. No authenticated owner-token submission, production post-deploy parity, physical-device workflow, or independent third-party security review was undertaken. Avoid presenting the token workflow as credential-isolated or hardened merely because access is repository-scoped.

**Recommended architectural direction:** Move token handling and GitHub mutations to a separately hosted, authenticated publisher origin. Prefer tightly scoped OAuth session credentials and reviewable draft pull requests, with a mechanism compatible with the 17 current Editor V2 routes. That is a separate owner-authorized deployment task, not an implicit approval to configure credentials or publish changes.

**Next checkpoint: C-RV29el.** Reconcile script-dependent Home and Contact photo/layout presentation in the actual public pages with their source-preserving editor views, using an isolated real-browser comparison rather than assuming static markup and script-rendered placement are identical. The restored Editor V2 regression suites have passed; authenticated publishing, physical-device use and a separately hosted credential service remain distinct work.
