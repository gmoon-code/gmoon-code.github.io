# C-RV28y | Website Studio GitHub permission test and draft-recovery guidance

**Date:** 2 November 2026. Continued from the exact saved [C-RV28x](FLUID_LAYOUT_REVIEW_CONTENT_AUDIT_C-RV28x_2026-11-02.md) checkpoint. Content-only audit of the **dynamically generated GitHub publishing access dialog** in `studio/studio-access.js`, cross-checked against the current `studio/studio.js` token, publish and draft implementation, the `studio/studio-plus.js` IndexedDB recovery code, and the already audited owner-facing page instructions in `studio/index.html`. This stage did **not** exercise real personal-access tokens, make an authenticated GitHub publish, evaluate the separately documented six Editor V2 browser regression failures or modify the public academic portfolio prose.

## Actual source and access scope

| Confirmed source | Git blob | Material examined |
| --- | --- | --- |
| `studio/studio-access.js` before correction | `1a9d0af72d524d5fe82f1bbf3e2621c611d89ce3` | Complete dynamically created access-dialog HTML strings; authorization probes, token replacement, error notices and event handlers |
| `studio/studio-access.js` after correction | `52d85893c7ca6101cdd935af3863713f23c3bd04` | Precisely four author-facing strings corrected; underlying API calls and event handlers preserved |
| `studio/studio.js` | `0d90269bc4b30bd88f1c885900ca818ea10db58f` | GitHub API token dispatch, `loginWithToken`, `setAccessToken`, tab-session token handling, sign-out clearing and main-branch publication logic |
| `studio/studio-plus.js` | `39b8c2c5b736036e9c1f5591b80680e59734b6e0` | Browser IndexedDB recovery snapshot, storage failure, restoration on sign-in, session cancellation and sign-out cleanup |
| `studio/index.html` | `468d7e26d0412c8186fd3d43cbd983e457fb957f` | Login help, optional token remembering, access controls and publish status language |

The main app stores editable page drafts in an in-memory `Map` (`state.drafts`), with IndexedDB recovery handled **separately** by Studio Plus when browser storage is available. The GitHub token itself is kept in `state.token`, and **only if the owner selects tab-session remembering** is it additionally stored in `sessionStorage` under `ye-eun-moon-studio-token`. The recovery snapshot contains drafts, images, deletions and manifest state, but **not** the access token. On sign-out, `studio.js` clears the in-memory draft/upload/deletion maps, and `studio-plus.js` attempts to delete the IndexedDB recovery record. The access-dialog's `replaceToken()` route, by contrast, changes the token **without signing out or clearing those in-memory drafts**. Recovery cannot be guaranteed if IndexedDB is unavailable or cleared; persisted local data should not be equated with an authenticated private server.

## Finding 1 | Drafts are not necessarily confined to one tab's memory

**Previous access-dialog prose:**

> Your unpublished drafts stay in this Studio tab. Do not sign out to change your access token.

The second sentence correctly warns that signing out could clear current changes. The first sentence can nevertheless be misleading. The core drafts are in current-session memory, but an optional **IndexedDB recovery snapshot may persist across browser tabs or reloads** and may be restored after reconnecting and accepting the restore prompt. Conversely, that recovery is conditional on browser storage rather than guaranteed. The distinction is important where an author is trying to fix a failed publication without losing a draft.

**Corrected prose:**

> You can update your token without signing out or clearing this session’s drafts. When browser recovery is available, a local draft copy may also be saved.

This promises only what the token replacement handler directly preserves; it acknowledges conditional local recovery without declaring it encrypted, confidential, universally restorable or available indefinitely. It also avoids copying draft content into the token field or sign-out flow.

## Finding 2 | A token does not “open the website” as an authorization requirement

**Previous access-dialog prose:**

> A token can open the website but still lack the permission needed to publish. Test it here without changing the live site.

The public academic website is not opened by a GitHub token; the token is used to connect the **owner authoring application to GitHub's API**, where repository permissions and different API operations can vary.

**Corrected prose:**

> A token may connect to GitHub without permission to write to this repository. Check its Git object access here without changing any published page.

The new wording names the actual access boundary and clearly distinguishes the test from public-page modification.

## Finding 3 | Git blob write permission is not an end-to-end publication check

`verifyCurrent()` does **two specific checks**. It reads `GET /repos/gmoon-code/gmoon-code.github.io` and confirms `repo.permissions.push`, then performs `POST /repos/gmoon-code/gmoon-code.github.io/git/blobs` with a small UTF-8 payload. The resulting SHA confirms that GitHub accepted creation of an **unattached Git object**. It does **not** publish the blob, amend a file tree, create a commit, update the `main` ref, perform complete page/change validation, establish GitHub Pages deployment, or prove that a future publish with changed repository state will succeed.

By comparison, the real `studio/studio.js` `publish()` flow checks saved Git blob SHAs against the current repository tree, prepares image and HTML blobs, creates a new tree/commit and then issues `PATCH /git/refs/heads/main` with `force:false`. It can fail **after** the blob-write preflight through races, validation, GitHub branch restrictions, rate limits, changing permissions, network conditions or deployment delay.

**Previous success notification:**

> Publishing write access verified. You can close this panel and try Publish changes again.

**Corrected success notification:**

> GitHub accepted an unattached Git object. This does not test the full publishing process. You can close this panel and try Publish changes again.

The separate explanatory line stating that the test **“does not create a commit, move the main branch, publish files, or change your drafts”** was retained, since it accurately describes the Git operation. The user's real document state is still protected by an explicit later publish, not by the test.

## Finding 4 | New token acceptance is not a guarantee of successful publication

`replaceToken()` temporarily switches `state.token` to the proposed value, calls `GET /user` to confirm **the exact owner account `gmoon-code`**, checks repository `push` permission, and creates another unattached Git blob. If the sequence fails, it restores the original in-memory token; if successful, it resets it briefly before invoking `setAccessToken(next)` so the existing tab-session remember setting remains authoritative. It **does not** publish the current drafts. The prior notice's last clause overstated what was checked.

**Previous success notification:**

> New token verified and connected. Your current drafts are unchanged. You can now publish.

**Corrected success notification:**

> New token passed the GitHub write check and is connected. Your current drafts are unchanged. Review your changes and try publishing.

This does not assert that the full publication will necessarily succeed; the original follow-up toast confirming token update without sign-out remains justified.

## Implementation and content preservation

The changes are **four exact text substitutions** in a single file. GitHub commit `1da19772d2c4baf99de98a82ecee16815fae21e1` updated only `studio/studio-access.js` to blob `52d85893c7ca6101cdd935af3863713f23c3bd04`. It did **not** alter `github()`, token inputs, API request endpoints, blob-creation payload, permission flags, the `setAccessToken(next)` call, snapshot/recovery persistence, error handling, dialog IDs, publish handlers or the root academic website. The initial and resulting messages were compared with all the corresponding functions in situ.

The revised author copy is explicit, modest and task-oriented. It avoids implying that a Git blob preflight guarantees successful GitHub Pages release, that a public website needs a token just to be opened, or that browser drafts necessarily reside in a single ephemeral tab. No superficial stylistic changes were made to otherwise correct instructions.

## Verification target and exact continuation

Re-fetch the corrected `studio/studio-access.js` and its three source dependencies to assert **four new string descriptions and absence of the four older descriptions**, intact GET permission and POST blob checks, stable `setAccessToken` and sign-out logic, IndexedDB persistence and recovery attempts, optional `sessionStorage` token remembering, and preserved normal publish commit/main-ref workflow. Check dialog IDs and generated controls for uniqueness against the static `studio/index.html` IDs, then record the actual count. The earlier C-RV28x source checks passed **19/19**, and the public Research/Teaching pages should remain unchanged.

**Exact next checkpoint C-RV28z:** examine the still-authored **Studio Plus draft-recovery and publish-state labels**, especially `studio/studio-plus.js` status text such as **“Saved privately in this browser”** and **“Unfinished edits restored”**, against IndexedDB failure and sign-out operations. Consider whether “privately” creates the same inaccurate confidentiality implication corrected earlier in the Fluid Layout Lab. Check for similar overly strong draft-safety assurances in `studio/studio.js` publishing error messages, but do not change error behavior or functional algorithms. Preserve the six unresolved Editor V2 browser failures, the author preference for public email and final-August scoping S2C / original AP Biology assessment, rater, consent/assent and authorization records as separately **Blocked** without authentic evidence.

**Overall comprehensive academic website content audit remains In progress.**
