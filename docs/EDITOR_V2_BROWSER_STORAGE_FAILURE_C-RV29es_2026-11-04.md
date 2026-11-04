# C-RV29es | Editor V2 browser-storage failure recovery

**Date:** 4 November 2026  
**Continued from:** [C-RV29er](EDITOR_V2_EDITABLE_DRAFT_JSON_RESTORE_C-RV29er_2026-11-04.md).  
**Status:** **Implementation and tests committed, cross-engine verification pending**. Do not claim this stage passed before final current-revision Actions and public-delivery checks complete.  
**Prior fully verified baseline:** C-RV29er passed 92/92 source-faithful cases in each of Chromium, Firefox and WebKit (276/276), 22/22 production exact bytes and deployed-browser smoke in all three engines.

## Identified defect

Before C-RV29es, an original-layout source draft that failed `localStorage.setItem` due to browser quota or storage policy displayed only a transient status. Other editor operations could overwrite that status, leaving the user unaware that browser persistence had failed. Reloading or switching to another page could therefore discard the only in-memory copy of recent edits. A denied `localStorage.getItem` on first load similarly lacked a durable recovery warning. Original-layout GitHub publication could proceed from an unsaved in-memory copy without an explicit confirmation that a recoverable local draft existed.

## Fixes

- Track a page-scoped browser-storage save failure separately from malformed JSON and concurrent-tab draft conflicts. If browser storage cannot be read or the editor cannot persist an edited source draft, display a persistent recovery alert above the live website preview, visible independently of transient status messages.
- Keep the current source-preserving edits in memory, offer an immediate **Download editable JSON backup** in the established versioned and restorable format, and provide a **Retry saving in this browser** action. No GitHub token or publication is required for these actions.
- A successful explicit retry clears the storage warning, records the exact string written to localStorage and returns the draft to normal saved state.
- Prevent silent page switching and browser unloading when the tab contains changes that have not been saved because of storage refusal. The page switch prompts for confirmation, and beforeunload uses the browser's supported unsaved-work prompt.
- Block live GitHub publication until the local draft has been saved. The check runs before attempting a GitHub read or write. Preview and JSON export remain available to preserve recovery options.
- When a valid backup restore fails to write to localStorage, preserve its previously stored data and show the same persistent storage-failure warning rather than only a fleeting rejection.
- No academic page content, original image assets or live GitHub source were intentionally changed by these editor safeguards.

Relevant source commits: `aeef2fde7f8d26ca3a741bd137d564518124afeb` for the save guards and `6a3ffb94c03b8cc1102e6a9e8ccacc183e9fc9b1` for warning UI and cache version `v65`.

## Added source-faithful browser tests

Commit `ba7c94afc020710917f8db6a437a69c204d3bd95` adds two tests to `tests/editor-v2-current-website.spec.cjs`, using actual repository HTML source and intercepting all GitHub write operations.

1. **Quota refusal on Contact:** patch `Storage.prototype.setItem` for live draft keys to simulate a real quota exception, make a source text-formatting edit, assert the storage warning remains visible and the edit remains in the page while localStorage remains empty; download the exact in-memory patch records in a restorable JSON backup. Attempt mock GitHub publication, confirm no GitHub PUT. Cancel an attempted page switch, confirm repeated retry fails while storage is blocked, then restore writes and confirm retry saves the draft and survives reload.
2. **Read refusal on Research/Contact page transition:** patch `Storage.prototype.getItem` for live draft keys to raise `SecurityError`, switch page and assert the persistent warning, failed retry and downloadable versioned backup. Restore browser storage access, retry successfully and verify no GitHub PUT.

**Current browser workflow:** [C-RV29es current website run 41827530696](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41827530696). Status remains provisional until inspected.

## Remaining verification

- Final Chromium, Firefox and WebKit outcome for 94 cases per engine if both added cases complete.
- New public HTTPS byte parity for 22 checked resources, including `editor-v2.html` and `editor-v2.js` with `v65`.
- Deployment smoke in all three browsers.
- Separate Canvas storage failures, owner-authenticated real GitHub publication, direct-token same-origin isolation and physical-device interactions remain outside this stage. The backup is locally downloaded and must be kept by the owner; no cloud persistence is implied.

**Next checkpoint:** only after successful workflows and parity, close C-RV29es and select the next genuinely outstanding issue without redoing verified live-source editing or backup restoration.
