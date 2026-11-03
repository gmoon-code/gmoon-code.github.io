# C-RV29dk | Connection Studio malformed backup could overwrite saved work before rejection

**Date:** 4 November 2026. **Continued from:** [C-RV29dj](CONNECTION_STUDIO_BACKUP_RESTORE_CHROMIUM_C-RV29dj_2026-11-04.md). **Scope:** Trustworthiness of the actual user-facing import and failure messages for syntactically valid but malformed Connection Studio JSON, with preservation of an existing local practice record. **Disposition:** A real data-integrity and copy-truthfulness defect was reproduced in the browser, corrected narrowly in the application, re-tested against all prior positive paths, and independently verified as deployed public JavaScript. No academic research prose was changed.

## Defect and original evidence

The previously current `connection-studio/app.js` `importJSON(file)` function checked a few root fields of an imported object, specifically the `app` identifier, `progress.attempts` array, and the broad presence/type of `progress.drafts` and `completedWrites`. It did **not** check individual saved attempts before presenting the destructive replacement confirmation or executing:

`progress={...DEFAULT_PROGRESS(),...parsed.progress}; if(save()){render();showToast('Backup imported successfully.')}`

A malformed but parseable JSON import with **`attempts: [null]`**, otherwise valid-looking container fields, passed the initial validation. After the user accepted replacement, `save()` wrote the malformed record to `localStorage`; `render()` then encountered an invalid null attempt and threw. The outer catch displayed **“The selected file is not a valid Connection Studio backup.”** At that point, however, the previously valid saved attempt had **already been overwritten**. This behaviour was incompatible with the interface's explicit assurance that an invalid backup is not imported and that replacement is an informed action.

## Browser-first reproduction

Added a focused negative Playwright case to `tests/connection-studio-offline.spec.cjs`, [commit `f452805`](https://github.com/gmoon-code/gmoon-code.github.io/commit/f452805c6c11e8ec4a3da9c8504f5c63bad3f8a8), which first created an authentic synthetic practice attempt, then tried importing malformed `attempts: [null]` and asserted the original browser-local JSON remained unchanged.

Actual [GitHub Actions run **41737733392**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41737733392) against the **unfixed application** recorded **two earlier tests passed, one protective test failed**. The failure log showed that the valid record:

`{"attempts":[{"kind":"diagnose","id":"d01","focus":"qualification","correct":false,"date":"2026-11-03"}],...}`

had been replaced by:

`{"attempts":[null],...}`

The protective expectation failed specifically at the original-versus-stored value comparison. This is independently observed user-data overwrite under a synthetic invalid import, not merely an imagined code smell. No genuine user's device, student work or private files were used.

## Narrow application correction

Replaced only the `importJSON` validation/commit pathway in `connection-studio/app.js`, [commit **`6509e1b`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/6509e1b7f18a4832706e59ee6df936396fc45a90), resulting in source blob **`e98793396086f31af4b37bb8ec5d0837a3a47f4d`**.

The new `validBackupProgress()` function verifies that the root progress data are a non-array object with a real attempts array and properly shaped draft and completed-writing dictionaries, checks each attempt's required identifiers, type and correctness boolean, checks draft values, completed-writing entries and optional bookmark/notes containers, and requires the actual exported schema version **1**. These checks run **before** asking the user to replace local work. For a valid import, the importer preserves the previous in-memory reference, shows the existing confirmation dialog, attempts to save the new record, and restores the old view if saving fails. If an unexpected rendering exception occurs after a successful save, the code attempts a rollback to the earlier record before reporting the invalid import.

This validation addresses the demonstrated loss of record and related malformed input shapes. It does not claim a complete security hardening against all hostile JSON or every browser/storage failure mode; the independent test exercises a bounded set.

The negative test was aligned with the improved, safer behaviour in [commit **`8ce2a38`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/8ce2a389425a1ebe7abfe8b4f61002244a98a925). It now verifies that invalid JSON is **rejected before any replacement dialog appears** and the original record remains byte-identical, including after reload.

## Independent post-correction regressions and public deployment

[Real GitHub Actions Chromium run **41738026747**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41738026747), job **126272168981**, completed **success**, with **3/3 tests passing** in the original log:

1. **Offline and private local progress**, including two offline reloads and cached application files.
2. **Valid JSON export, import and confirmation**, including accepted/declined paths.
3. **Malformed JSON rejection before replacement**, with preservation of the valid earlier practice record.

For public byte delivery, added read-only `scripts/audit-connection-studio-live-parity.py` and a GitHub Actions workflow that compares the exact seven public Connection Studio files against the checked repository bytes, with a bounded retry for deployment lag. Script [commit `4e4a5e2`](https://github.com/gmoon-code/gmoon-code.github.io/commit/4e4a5e20624dbe4d7a1f7f9c38518ff2012c2654) and workflow [commit `04c8014`](https://github.com/gmoon-code/gmoon-code.github.io/commit/04c8014f2e6f37251daccab231b2b341c6adadd4).

Independent [live HTTPS run **41738285039**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41738285039), job **126273041617**, completed **success**, reporting **7/7 exact source byte matches on its first attempt**, including the updated `connection-studio/app.js`, page HTML, stylesheet, instruction bank, service worker, manifest and icon. The public release is therefore established for the tested point in time, separate from the local Chromium behaviour result.

## Scope and continuing limits

**Genuinely corrected:** The backup importer's invalid-record handling no longer overwrites a previously saved record in the reproduced case, and the invalid-backup notice is now truthful under that test. The documented fix retains the explicit consent prompt for valid replacements. No instructional example, scholarly reference, student research record, photo, CSS or visual layout was changed.

**Not claimed:** Cross-browser or actual-device coverage, complete adversarial JSON input testing, encrypted or hosted backups, real-user history recovery where an earlier version already corrupted storage, all storage quota failures, independent authenticated user publishing, or full site-wide academic factual certification. The seven-file parity check is a point-in-time byte observation, not perpetual website availability.

The whole academic-content audit remains **In progress**, scholarly source register **46 F / 6 A / 1 M / 0 P**. Original school/participant permissions, source research response transformations, historical Unit 3 administration, independent reader records and final-August scoping matrix remain independently evidence-gated.

## Exact next checkpoint

**C-RV29dl | Reconcile newly changed supplementary application assets and return to original scholarly content.** Confirm the previous Connection Studio fix and 7/7 public parity refer to the current app source at the audit head, then inspect genuinely new primary evidence or a separate unreviewed public academic factual claim. Do not continue speculative import edge-case work without a demonstrated issue or repeat source-reviewed main paragraphs for activity. Maintain the signed/dated research source blockers and the distinct local-browser versus served-CDN verification tiers.
