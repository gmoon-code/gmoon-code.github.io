# C-RV29dj | Connection Studio export, reset and replacement confirmations verified in an actual browser

**Date:** 4 November 2026. **Continued from:** [C-RV29di](CONNECTION_STUDIO_OFFLINE_LOCAL_PROGRESS_CHROMIUM_C-RV29di_2026-11-04.md). **Scope:** Application claims about progress/draft export to a user-controlled file, import from an earlier export, replacement confirmation, reset confirmation and persistence after subsequent reload. **Disposition:** An added Chromium browser test independently verified the claimed positive/negative paths without changing the application or its authored material.

## Source claims and actual implementation

The Progress and Review view in `connection-studio/app.js` states:

> Drafts and practice records stay in this browser when storage is supported. Export a backup, or import an earlier export on this device. An import replaces the current saved progress.

The same view provides **“Export drafts and progress”**, **“Import a backup”** and **“Reset local progress”** controls. The original `downloadJSON()` function constructs a JSON `Blob` containing the application identifier, schema version, ISO export timestamp and `progress` data, downloads it via an in-browser object URL and then revokes that URL. The original `importJSON(file)` function uses `FileReader`, validates several required fields, and asks the user to confirm replacing the currently saved record before assigning the imported data and saving to browser `localStorage`. The reset action similarly presents a destructive-action confirmation, then clears the in-memory record and attempts a local save. If storage rejects a write, a separate warning is displayed. There is no claim of cloud synchronization or retrieval after browser storage has been deliberately cleared without an external backup.

## Actual independent browser test

Extended the pre-existing `tests/connection-studio-offline.spec.cjs` with a second test, [commit `554ef66`](https://github.com/gmoon-code/gmoon-code.github.io/commit/554ef66bc746db7a24360364e846f986314b3fa7). The test drives an actual Chromium browser with a **synthetic** exercise attempt and writing draft, then:

1. Completes an exercise and edits a real text-area draft, confirming one recorded activity.
2. Clicks the actual Export control, receives a JSON download, verifies the filename/date pattern, parses the download bytes, and confirms it includes the correct application and schema version, **one attempt and a nonempty draft**.
3. Confirms Reset and observes that the interface now reports **zero logged activities**.
4. Attempts to re-import the exported JSON but **dismisses** the replacement confirmation, confirming the local record remains empty.
5. Imports again and **accepts** the confirmation. The interface reports **“Backup imported successfully”**, exactly the previous exercise attempt and draft are restored in browser-local storage, and the activity counter returns to one.
6. Reloads the page and confirms the restored activity persists.
7. Declines another Reset confirmation and verifies the restored activity remains intact.

The [real GitHub Actions run **41737393578**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41737393578), at test commit `554ef66bc746db7a24360364e846f986314b3fa7`, completed **success**, job **126269988166**. Original log explicitly shows both **“Connection Studio retains private progress and works offline after first visit”** and **“exported backups restore local attempts only after user confirmation”** passing, with **2 passed (1.6 seconds)**. The first independent [C-RV29di run 41737034207](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41737034207) had already verified offline use at 1/1; this later run confirms both under the current exact test source.

## Credibility and remaining limits

**No public-site edits** were warranted. The tested export and replacement wording is accurate for valid application-generated JSON under supported Chromium storage conditions. No student records, workbooks or user personal drafts were accessed; all test data is synthetic and remains in the isolated browser runner. The browser test does **not** certify encryption, user-specific account authentication, multi-device synchronization, all possible malformed imports, quota/storage-failure behaviour, assistive technology usability or browsers beyond the tested Chromium version. The app's imported JSON validation remains a distinct potential follow-up, and should not be described as comprehensive security validation.

The test and workflow add source-level automated verification for a previously untested piece of the academic site's supporting material. The teaching content, exercise bank, site pages, CSS, photos, service worker, original research and citation text were left untouched.

The complete research source register remains **46 F / 6 A / 1 M / 0 P**. The overall academic website content audit remains **In progress**.

## Exact next checkpoint

**C-RV29dk | Malformed Connection Studio backup handling and accurate user feedback.** Examine whether a malformed but syntactically valid JSON backup can bypass the current `importJSON` shape checks, then create broken progress/readable views while still showing “imported successfully”. Test only with synthetic data and do not weaken the existing explicit replacement confirmation. If a real bug exists, correct precisely and verify with a Chromium test; otherwise record the negative evidence. After that, return to independent substantive scholarly-source or changed academic page claims.
