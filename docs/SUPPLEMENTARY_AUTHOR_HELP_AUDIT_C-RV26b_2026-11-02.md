# Stage C-RV26b | Website Studio and Editor V2 author-facing instruction accuracy

**Date:** 2 November 2026. Continued exactly from [C-RV26a](SITE_CONTENT_COVERAGE_RECONCILIATION_C-RV26a_2026-11-02.md). Content-only audit of remaining high-risk author-facing instructions, checking them against implementation rather than assuming that visible controls work in a real browser. Retained the C-ED1–5 corrections and unresolved six Editor V2 browser test failures.

## Verified files and code level

| Source | Blob SHA after this stage | Scope |
| --- | --- | --- |
| `studio/index.html` | `e41c1b8549e89f98997be92e6bba446cb275d067` | Author-facing instructions for selected layers, reset, responsive editing, local drafts, token access, creation, deletion, menu changes and publish |
| `editor-v2.html` | `8e84a754d0101a8c320af153e8c813ca1ddafa43` | Live editing, source-preview, photo formatting, grouping, local locks, staging versus published destination, token and acknowledgement |
| `studio/studio.js` | `0d90269bc4b30bd88f1c885900ca818ea10db58f` | One-commit GitHub publish, draft page creation/deletion, token session storage, conflict check |
| `studio/studio-details.js` | `362e5aef077a5b25ebb05a96f035de7d5f8f5899` | Reset details per selected area and selected screen |
| `studio/studio-access.js` | `1a9d0af72d524d5fe82f1bbf3e2621c611d89ce3` | GitHub access test and narrow error/permission guidance |
| `editor-v2.js` | `ca51a9f2b7d1dc5ce528a9beeb33153806ceb5c6` | Live GitHub source checks, branch publication, staging preview path, local drafts and in-memory token |

## Demonstrable wording issues and implemented corrections

1. **Website Studio left-sidebar help, grammar.** Before: `Page layers in the left sidebar shows the structure of the selected page.` The title was inside `<strong>` in HTML, but the subject–verb error remained. After: **“The Page layers panel in the left sidebar shows the structure of the selected page.”** This names the UI area clearly, fixes agreement and retains the sentence's position and function. Committed in [f43e550](https://github.com/gmoon-code/gmoon-code.github.io/commit/f43e55058d2f972b6035bdcf93a88fa81c9800fa).
2. **Website Studio reset scope, factual precision.** Before: `Customize one detail at a time. Every setting can be reset to the original site style.` That universal promise exceeded what the current control establishes. `studio/studio-details.js` wires `detailResetButton` to `resetAll`, which clears its defined **fine-detail CSS properties** in the selected scope, or deletes a defined responsive rule for the selected screen. It does not reset every unrelated global site setting, page copy or all independent tool controls. After: **“Adjust one detail at a time. Use Reset details in this area to clear fine-detail styling for the selected area and screen size.”** This matches the confirmed UI and code; other unaffected settings are no longer implied to reset. Same commit as above.
3. **Editor V2 staging destination, public visibility.** Before: `Staging preview (private draft path, publicly accessible URL)`. Despite the warning about public access, **private** could suggest an access-restricted destination. `editor-v2.js` writes its staging HTML into `editor-v2-previews/` on the public `main` branch. `updatePublishTarget` expressly says the preview is created at a separate **public** URL without replacing the page. After: **“Staging preview (unlisted path, publicly accessible URL)”**. This removes a misleading privacy implication while maintaining the crucial disclosure that knowing the URL is sufficient to access it. Committed in [f11b61d](https://github.com/gmoon-code/gmoon-code.github.io/commit/f11b61d1d3a1f6a72f9ad72233b7425b0f936b23).

None of these changes modifies scholarly prose, user data, files to be published or GitHub credentials.

## Additional accuracy and authorial review

Website Studio's content accurately identifies the GitHub token as the publishing authorization; optional token remembering uses `sessionStorage`, subject to normal browser-session semantics and its prior C-ED1 caveat. Its `publish` routine checks source versions, creates blobs/tree/commit and advances the `main` ref **once**, supporting the explanation that edits publish together. Newly created or deleted pages are only marked in its draft state until publishing. The “a duplicated page may retain search-indexing settings” warning remains sensible. The help also cautions readers about hiding essential information on phone layouts.

Editor V2's token retention uses the `githubTabToken` variable in memory and is not written to Web Storage by its retained-token feature. Local *drafts* and position locks use `localStorage`, which is a different category of information. The implementation distinguishes GitHub-verified original source from a deployed-page fallback, requires unchanged source HTML for live publication and presents a public staging option as an independent destination. The existing grouping limitation between source and inserted objects remains correctly stated. These findings concern source code, **not** successful end-to-end operations or public browser parity.

The edited instructional prose is concise and user-oriented, with natural action-first instructions. The reset clarification removes an overbroad claim; the staging clarification prevents “private” from carrying an inaccurate security implication. No new formulaic phrase or em dash was added. The additional detailed control descriptions were read in context, with existing C-ED1–5 editorial decisions retained.

## Verification

After both changes, re-fetched the HTML and corresponding JavaScript. **31/31 targeted source checks passed**, including the corrected strings, prior inaccurate strings absent, `resetAll` event and CSS/rule behaviour, GitHub single-update publish logic, draft/token storage separation, staging branch/path, preview disclosure, live original-file protection, group-category warning, **200 unique Studio HTML IDs** and **270 unique Editor V2 HTML IDs**. The single local fragment on each page resolved. This is a bounded **source correspondence** result, not a real browser test.

**Known unresolved:** The previously documented [C-ED5](EDITOR_CONTENT_AUDIT_C-ED5_2026-11-01.md) records **six distinct failing Editor V2 browser test cases** across three workflows. This stage neither reran nor fixed those failures. No credentials were supplied, no authenticated GitHub publication was attempted, and live GitHub Pages bytes/screens were not compared. **Do not claim full working editor functionality.**

## Exact next checkpoint

**C-RV26c | Supporting publisher/preview source prose.** Use supported repository discovery to enumerate actual `publisher/`, `studio/`, editor preview and user-facing help/documentation files. Confirm file existence before claiming a route is missing. Content-audit the remaining instructions describing deployment, access tokens, generated previews, publish authorization or persistence, and correct any demonstrable source discrepancy. Preserve existing fixes and do not perform a functional editor redesign. Record any unavailable directory or changed deployment source separately and keep an exact next checkpoint for genuinely uncovered scholarly content.

The independent original AP Biology participant/ethics/rater records, August scoping final 20-study codes, restricted scholarship, site live-parity and six browser failures remain open. **Whole academic content audit remains In progress.**
