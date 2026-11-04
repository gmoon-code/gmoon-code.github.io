# C-RV29ef | Website Studio clean-draft status wording and public delivery

**Date:** 4 November 2026. **Continued from:** [C-RV29ee](FLUID_LAYOUT_LAB_TRANSFER_COPY_AUDIT_C-RV29ee_2026-11-04.md). **Scope:** Actual current Website Studio `studio/index.html` loaded interface, `studio/studio.js` generated save/publish status, draft-state rules, original public-delivery parity workflow and the existing Studio source regression. **Outcome:** One misleading user-facing status corrected, one source-level regression assertion added and the exact public-byte parity expanded to include the newly edited JavaScript file. No academic or research page prose edited. Overall website audit **In progress** for remaining supplementary and external evidence boundaries.

## Evidence and prior-review reconciliation

At resumption, GitHub `main` was `72075f8731f78046662e83981a3c4a338da247bc`; the nontruncated tree still contained **26 HTML files**. Source inspection and prior stages [C-RV26d](STUDIO_MODULE_CONTENT_SCOPE_AUDIT_C-RV26d_2026-11-02.md), [C-RV26e](STUDIO_COMPONENT_GUIDANCE_AUDIT_C-RV26e_2026-11-02.md), [C-RV28y](STUDIO_ACCESS_PERMISSION_HELP_AUDIT_C-RV28y_2026-11-02.md), [C-RV28z](STUDIO_BROWSER_RECOVERY_STATUS_CONTENT_AUDIT_C-RV28z_2026-11-02.md) and [C-RV29dn–do](STUDIO_GENERATED_GUIDANCE_PUBLIC_BYTE_PARITY_C-RV29do_2026-11-04.md) demonstrate completed review and precise fixes for the 15-page Studio editing manifest, shared navigation/footer scope, conditional recovery, token authorization, local draft retention and already-delivered generated footer caution. These were **not** reopened or recounted as new page-level editorial coverage.

The remaining uncorrected `studio/studio.js` `updateStatus()` branch previously assigned:

> `el.textContent=dirty?"Unpublished changes":"Everything published";`

The predicate `hasChanges()` checks only `state.manifestDirty`, staged `state.deleted` and dirty entries in `state.drafts`. It does **not** inspect all browser sessions, all site files, an authenticated live deployment, or a durable history of GitHub Pages builds. “Everything published” overstated what that status could verify. The broader phrase also ran on a clean initial Studio session, before any publish from that session.

## Exact implementation

Changed the clean branch **only** to:

> `el.textContent=dirty?"Unpublished changes":"No pending changes in this Studio session";`

The existing “Unpublished changes” branch remains, as do the control enable/disable logic and all publication operations. The separate successful Git reference update at `git/refs/heads/main` still produces **“All changes were published together. GitHub Pages may need a few minutes to refresh.”**, accurately distinguishing a successful source commit from eventual public deployment.

- [`studio/studio.js` correction `56b4ae56`](https://github.com/gmoon-code/gmoon-code.github.io/commit/56b4ae56c297c0233a0c461721cbe5dc63c29b0f) modifies exactly one user-visible status expression. Exact readback verified source blob `4d4ab898dfda96a1ee87185e32215e687dc689f4`.
- [`tests/studio-author-content.test.mjs` addition `dddf1e13`](https://github.com/gmoon-code/gmoon-code.github.io/commit/dddf1e13404c657f0e6acc43c924aec666ecf6e0) adds one source-level regression checking the `hasChanges()`-bounded status, absence of “Everything published”, continued non-force Git branch update and distinct publish-success wording. Exact readback verified.
- The source-matched [Website Studio content and source-map regression **41780503798**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41780503798) completed **success** for commit `dddf1e13...`, with the new test included. This is a Node source-regression result, **not** a live authenticated publish.
- [`scripts/audit-studio-guidance-public-parity.py` `f607e346`](https://github.com/gmoon-code/gmoon-code.github.io/commit/f607e34650387ed82221251d6676a36c76a1e3b0) now checks **three** exact public resources, `studio/index.html`, `studio/studio.js` and `studio/studio-chrome.js`, rather than only the HTML and Chrome script.
- [`.github/workflows/studio-guidance-public-parity.yml` `82bc3a50`](https://github.com/gmoon-code/gmoon-code.github.io/commit/82bc3a509b482f748371e9b791415b8039ad6f64) adds `studio/studio.js` to the push trigger and updates the check's description. No production site/authoring code other than the clean-status text was changed.

The [expanded public HTTPS byte-parity run **41780716930**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41780716930), at exact script-and-workflow commit `82bc3a509b482f748371e9b791415b8039ad6f64`, completed **success**. The parity script requires **all three** delivered HTTP responses to match the original source bytes for a zero exit code. This is therefore an exact **3/3** served-source check **at the time of that test**, encompassing the corrected Studio status expression. It is **not** a test of authenticated GitHub publication, browser draft recovery, appearance at every viewport or every generated text branch.

## Editorial disposition and source boundaries

The corrected status is short and appropriately limited to the observable state. It avoids announcing that every website change has been published when Studio only knows its current pending draft state. The site's static owner instructions, previously corrected recovery notices, dynamic Header & Footer warning, and all 19 editorially reviewed academic/legacy HTML pages are unchanged. The author's final scoping and classroom research manuscripts remain the sufficient sources of record for those website descriptions; no underlying student or ethics files are requested. The Research bibliography source-access tiers remain **53 total, 46 F / 6 A / 1 M / 0 P**.

**Exact next checkpoint C-RV29eg | Supplementary generated-copy closeout and limited external-source distinction.** Reconcile remaining author-facing dynamic status/help messages with the dated C-RV26/C-RV28/C-RV29 source reports and decide which supplementary writing components have documented coverage rather than endlessly repeating clean source checks. Prefer a **specific new source contradiction** or close the available source-writing scope at its justified evidence level. Preserve separate limits on restricted external scholarly originals, authenticated production editor publishing and physical/assistive-technology testing. Do not reopen completed academic-page prose or requests for underlying original student data. Overall content audit **In progress**, rather than unqualified Fully verified.
