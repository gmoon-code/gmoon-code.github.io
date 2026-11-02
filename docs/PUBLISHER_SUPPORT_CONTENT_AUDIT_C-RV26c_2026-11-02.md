# Stage C-RV26c | Optional proposal publisher, direct publication and preview source provenance

**Date:** 2 November 2026. Continued directly from [C-RV26b](SUPPLEMENTARY_AUTHOR_HELP_AUDIT_C-RV26b_2026-11-02.md) without repeating the main academic Research/Teaching audits. Content-only source review of the confirmed optional publisher setup document, current legacy editor source, publisher worker, public configuration, and Editor V2 preview-path code.

## Verified source files and access scope

| Repository path | Current source SHA | Purpose |
| --- | --- | --- |
| `publisher/SETUP.md` | `83e813976fd12219bce68e40270a216a88bdca30` | Instructional document corrected in this stage |
| `publisher/worker.mjs` | `f634d0bbb96a997b63f877e23c148488252cad4f` | Unconfigured optional Cloudflare Worker for draft GitHub pull requests |
| `publisher/wrangler.toml` | `6c3a64fa72c39e6b564856074225d41e4abfb56a` | Optional worker nonsecret configuration |
| `editor-publisher-config.js` | `cf7a2260dc557daa55dff9cc4cdc42ae3be3eca5` | Public optional proposal connection, with empty `apiBase` and `clientId` |
| `editor.html` | `2b6533e6d1523941aa29eef5ad7a889f4d93b246` | User-facing legacy direct publication and optional PR choices |
| `editor.js` | `716c4da87c9b9bbe0fa4841fc90a1db21b6707e4` | Direct GitHub API path, token-authorized PUT to `main` |
| `index.html` | `bbc4cac2ddc7ce3b719b59d31529228f3cb6ba46` | Home source size versus optional service limits |
| `contact.html` | `ac42543da2d79999e1eb93bff6759e6095022b56` | Presence in site versus absence from optional 17-page allowlist |
| `editor-v2.html` | `8e84a754d0101a8c320af153e8c813ca1ddafa43` | Publicly accessible staging label clarified in C-RV26b |
| `editor-v2.js` | `ca51a9f2b7d1dc5ce528a9beeb33153806ceb5c6` | Generated preview path implementation |

A source-path lookup for `publisher/README.md`, `studio/README.md` and `editor-v2-previews/README.md` returned **404**. A previous `editor-v2-previews/index.html` lookup likewise returned 404. These missing *specific paths* do not establish absence of the `editor-v2-previews/` directory or of dynamically generated page-specific files. The current Editor V2 code constructs preview file paths on publication; it does not require an index page. GitHub source-code search returned no usable path results for generic preview/publisher keywords, so no directory-wide inventory is claimed.

## Original evidence and three corrections to `publisher/SETUP.md`

1. **The optional service is not the only way to publish.** The original introduction stated that the editor remained useful for drafting/export *until* its optional private proposal service was configured. That had become misleading after the separate direct-to-GitHub path was added to `editor.html` and `editor.js`. The new introduction expressly explains that the optional service is **not configured in the checked public frontend settings**, while owner-authorized direct publication from the editor still supports committing a reviewed file to `main`. The latter workflow does **not** create a draft PR or use this Worker. The later no-worker paragraph now specifies that **GitHub App sign-in and draft PR proposals through this optional service** are disabled, without implying that all forms of GitHub publishing are disabled. [Commit accc023](https://github.com/gmoon-code/gmoon-code.github.io/commit/accc023deab672d35ea40532e77ceaa00a53fb5a).
2. **Actual size limit.** `publisher/worker.mjs` declares `MAX_CONTENT=250000` and rejects an edited HTML payload with `enc.encode(edited).length>MAX_CONTENT`. The current Home `index.html` is **413,007 JavaScript string code units** before UTF-8 encoding, already substantially above the 250,000-byte ceiling. Its replacement cannot be accepted by the current optional proposal service under that limit. The revised guide makes this limitation explicit without promising it can be bypassed.
3. **Actual allowlist limitation.** The Worker's `ALLOWED_PAGES` has **17** distinct HTML paths but omits **`contact.html`**, despite Contact being a current ordinary site page. The revised guide notes that the legacy proposal service does not allow Contact, so “17 allowlisted pages” is not mistaken for unrestricted page coverage. The restriction is limited to the optional service; source permissions and rules for the separate editor still require their own checks. [Commit 883260](https://github.com/gmoon-code/gmoon-code.github.io/commit/883260cb6c8842106452efc99544891d0050b3e9).

The rest of the original guide describes the optional service only. Its 15-minute AES-GCM encrypted session, owner login verification, review branch/draft-PR workflow, image proposal restriction and need to configure GitHub App/Cloudflare Worker secrets are corroborated by the current Worker/config source at the claims examined. The direct editor does not inherit that service's encrypted-session design or PR review process. Language about approval and changes remaining off the public site until a PR merges is therefore **conditional on the optional proposal path**.

## Editorial, security and scientific-content integrity

The revised text names actors and actual processes, avoids claims of existing deployment, and distinguishes repository write access from installed optional PR infrastructure. It makes the possible exposure of unpublished material through publicly accessible staging previews explicit via the cross-reference to C-RV26b. No personal account credentials, secret keys or private participant evidence were accessed or copied. The changes relate exclusively to source documentation and avoid speculative UI modifications.

The source checked `editor-publisher-config.js` has empty values. That is **source-level evidence of no connected optional endpoint in the checked frontend code**, not an independent probe of every external deployment or a finding that a privately deployed Worker does not exist elsewhere. Current public website delivery, authenticated owner actions, browser draft persistence and six previously failing Editor V2 browser regression cases remain independent verification tasks.

## Verification

**20/20 targeted assertions passed** after the guide corrections, checking the current source text versus optional Worker/direct editor implementation, exactly **17** allowed paths and Contact's exclusion, current Home being larger than the **250,000-byte** UTF-8 HTML restriction, `draft:true` PR creation, encrypted session lifetime, optional configuration being blank, authorized direct `main` publication code, separate generated `editor-v2-previews/` staging path and visibility disclosure.

**Modified files:** only `publisher/SETUP.md`, in two precisely scoped commits above. No main academic pages, editor JS behavior or security rules were modified.

## Exact next checkpoint

**C-RV26d | Remaining auxiliary Studio/editor instructional modules and repository-provenance limits.** Inspect confirmed user-facing `studio/studio-plus.js`, `studio/studio-details.js`, `studio/studio-canvas.js` and other HTML-linked source modules for dynamically generated editorial help not present in `studio/index.html`. Cross-reference `studio/pages.json` against actual page selection text, source-backed scope and reset/undo instructions. Distinguish a code-based content check from an authenticated browser test. Inventory additional preview/publisher paths only when confirmed by a repository-supported listing or explicit file reference. Record the next actual unreviewed text rather than restarting the 19 academic pages or 53 Research citations. Unavailable original action research and scoping code records, external full texts, live-site parity and Editor V2 browser failures remain open. **Overall academic website audit In progress.**
