# C-RV28z | Browser-local recovery status and conditional draft-retention messages

**Date:** 2 November 2026. Continued from verified [C-RV28y](STUDIO_ACCESS_PERMISSION_HELP_AUDIT_C-RV28y_2026-11-02.md), using the exact source-level checkpoint. This **content-only** stage inspected the source-generated Studio Plus IndexedDB recovery status and quick-start guidance in `studio/studio-plus.js`, along with GitHub login, API-error, conflict, main-ref update, and publication error notices in `studio/studio.js`. It cross-checked current `studio/index.html` and the newly corrected access dialog but did **not** modify their content. No user token was supplied or used; no public academic page or publication algorithm changed.

## Confirmed original files and actual implementation

| Source | Source blobs and scope |
| --- | --- |
| `studio/studio-plus.js` | Before `39b8c2c5b736036e9c1f5591b80680e59734b6e0`; after `d28ec0499d519220c252701e1f9ab56c756af5c9` |
| `studio/studio.js` | Before `0d90269bc4b30bd88f1c885900ca818ea10db58f`; after `53c07189cd5719d6214746fccb08cb9f33a7e7ea` |
| `studio/studio-access.js` | Remains `52d85893c7ca6101cdd935af3863713f23c3bd04` after C-RV28y |
| `studio/index.html` | Remains `468d7e26d0412c8186fd3d43cbd983e457fb957f` |

**Actual persistence and recovery.** The Studio core stores its live drafts, uploads and deleted files in JavaScript Maps during the current session, and saves the GitHub token in memory, optionally also in tab-scoped `sessionStorage`. Studio Plus separately creates an **IndexedDB** database through `indexedDB.open(STORAGE_DB,1)`, stores a `working` snapshot of dirty drafts, manifest changes, uploads and deletions when storage succeeds, and prompts for permission to restore the snapshot at sign-in. This snapshot does **not** contain the publishing access token. A storage failure sets `recoveryAvailable=false`, presents a warning and instructs keeping the tab open; on sign-out, the app clears in-memory drafts and **attempts** `deleteRecord()` for the recovery snapshot. None of those behaviors guarantees a recovery file will survive browser/device cleanup, and a local browser database is not a privacy or access-control certification.

## Finding 1 | The local recovery status must not imply confidential storage

The browser status previously said:

> Saved privately in this browser

This was unqualified. “Privately” can imply a security guarantee despite normal same-origin browser data access, local browser storage risks, user access to the browser profile and the possibility of losing data through cleanup.

It now says:

> Recovery copy saved in this browser

The source displays this status **only after `writeRecord(snap)` resolves**, so the narrower statement is supported. It neither claims encryption nor durable retention beyond the available browser storage. In the quick-start guidance, the former **“Draft recovery stays on this device”** was also changed to **“Draft recovery uses this browser when storage is available.”** That establishes the actual storage boundary and acknowledges failure conditions without turning instructional help into a security policy.

## Finding 2 | In-session draft retention is not guaranteed backup safety

The Studio core previously used several overly broad assurances after API errors:

> Your drafts are safe.

> Your drafts remain safe.

It also used the connection notice:

> Your edits stay private until you publish.

The first two unqualified statements appeared in GitHub secondary-limit/rate-limit and non-fast-forward branch-update handling. In those failure paths, the code does **not** clear drafts and will generally retain them in the **current open editing session**, but it does not prove that recovery was persisted, that a browser reload will succeed or that the owner can reconstruct an edit later. The changed notices now say **“Your current drafts remain open in this Studio session”**, retaining the specific retry advice and GitHub error detail. In the source-change conflict message, “Your draft is safe” now reads **“Your draft remains open in Studio”**, preserving the following instruction to review the newer version before publishing. The general connection notice now states **“Your edits remain unpublished until you publish”**, which describes publication state without claiming anything about storage confidentiality.

The ordinary catch block already says **“Your drafts are still here. Publishing stopped…”**; that phrase directly describes the current live Studio state and was retained. The `studio/index.html` alert **“Publishing stopped. Your drafts have not been cleared.”** is likewise a justified current-session observation, not a promised indefinite backup.

## Precise edits, commits and constraints

**Studio Plus** had two user-facing status/help replacements in commit `466cd9afea3aec001d1cf6053095f07fb3f6936a`:
1. **“Saved privately in this browser” → “Recovery copy saved in this browser”**.
2. **“Draft recovery stays on this device” → “Draft recovery uses this browser when storage is available.”**

**Studio core** had connection, rate-limit and conflict text replacements in commit `2aaf84c33fcb15489fc9c991297bd5ffb92c780c`. A thorough scan then found another **“Your drafts remain safe”** in the non-force main-branch update error path, which was also corrected in commit `4881a3d95ea5d192a079359cd16c0ac1b554582f`. These are purely author-facing strings within existing errors/toasts. The functions `github()`, `loginWithToken()`, `setAccessToken()`, `logout()`, `publish()`, `saveRecovery()`, `restore()` and `onSignOut()` were not altered algorithmically. The GitHub API calls, `sessionStorage` key, IndexedDB store, source conflict checks, Git blob/tree/commit generation and `main` ref update logic were preserved.

**User voice:** These short labels are practical, restrained, actor-specific and accurately scoped. Nothing in the changes asserts a measured teaching effect, publication readiness, personal credential status, security certification or verified runtime behavior. No stylistic filler or broad rewriting of functioning interface copy was added.

## Validation and exact next checkpoint

Independently re-fetch final `studio/studio-plus.js` and `studio/studio.js` to verify expected Git blobs, exact new text and absence of blanket “safe/private” messages at the edited points. Check `indexedDB.open`, `writeRecord`, `readRecord`, `deleteRecord`, `onSignOut`, error fallbacks, token storage choice, draft Maps, preserved access-dialog claims, and the GitHub non-force `main` ref update. Re-fetch the master ledger after saving this report and record the actual test count. No browser-level persistence, permission or publication success is inferred from source-only tests.

**Exact next checkpoint C-RV29a:** investigate `editor-v2.js` **dynamic user-facing error, saved-draft, staging-preview and publication-status messages** against its actual live source and `editor-v2.html` warnings. Prior C-RV26b/C-ED1–5 audited selected instructions but documented **six failing browser cases**; choose a small, genuinely unreviewed message cluster rather than repeating entire completed editor work. Pay particular attention to promises of “verified” previews, successful saving or “private” staging when actual source behavior may be conditional. Implement only supported copy corrections, while keeping browser runtime failures separate from textual fidelity.

**Other blockers unchanged:** original August S2C 20-study charting and original AP Biology responses, ratings, consent/assent and school authorization records remain **Blocked** absent authentic source data; the author’s preferred public contact address is still unresolved. Six Editor V2 browser functionality failures remain a separate verification track. The comprehensive website content audit remains **In progress**.
