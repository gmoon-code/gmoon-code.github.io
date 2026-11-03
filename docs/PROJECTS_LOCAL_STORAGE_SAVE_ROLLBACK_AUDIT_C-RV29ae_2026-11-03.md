# C-RV29ae | Local browser save integrity when metadata writes fail

**Date:** 3 November 2026. **Resumed from:** C-RV29ad. **Scope:** Original `gmoon-code/research-methods/assets/pilot.js::safeSave`, its recovery snapshot, primary project and metadata writes, existing `Pilot & Recovery` restore UI and the academic website's claims about local notebook persistence. **Decision:** Corrected a genuine partial-write rollback weakness and verified it through six new execution-based tests. The academic website's existing cautious text remains appropriate. Comprehensive academic website content audit **In progress**.

## Original mechanism and supported risk

The companion application's original `assets/pilot.js` source blob **264fce6516faf81341cb170612d011788db5be43** performs a local save using multiple distinct `localStorage` keys. The save routine normalizes the working project, optionally writes the previous primary as a recovery snapshot, then writes the new primary project JSON and finally writes its `_pilot_meta_v2` metadata.

The old sequence had a notable failure path. If `localStorage.setItem(primaryKey,newJSON)` succeeded **but** the subsequent `localStorage.setItem(metadataKey,newMetadata)` failed, the catch block returned `{ok:false}` and announced save failure. However, the **new primary project had already overwritten the previously saved one**. Thus a caller could see a failed save and assume the old persistent project was still available. This was consequential for C-RV29ad's **save-before-in-memory-replace** restoration. The UI then retained the previous in-memory project after the failed save, while a browser refresh could load the attempted restored project instead. A recovery snapshot could exist, but was conditional and not a substitute for deterministic restoration of the primary key.

The underlying standard localStorage API provides per-key `setItem` atomicity but **no transaction spanning the primary, recovery and metadata keys**. The goal was to improve a specific partial-failure path without misleadingly claiming a fully transactional database.

## Actual correction committed to companion application

[Implementation commit e33a1efa](https://github.com/gmoon-code/research-methods/commit/e33a1efa55d9ca933818eb7e42589c7f3470d024) updates only the `safeSave` function in `assets/pilot.js`.

- Before writing a new primary, it remembers the exact previous serialized primary value and records when the new primary write has actually succeeded.
- If a later metadata write fails after primary success, it **attempts to restore the previous primary JSON**. For a first save with no prior primary, it removes the newly written key instead.
- Before rolling back, it rereads the primary value and compares it with its own attempted write. If another browser tab has written a different value, it **does not overwrite that other writer's data**.
- It distinguishes the return statuses **`rollback:"restored"`**, **`rollback:"not-needed"`**, **`rollback:"failed"`** and **`rollback:"changed-elsewhere"`**. When an attempted rollback fails or another writer intervenes, its save-failure event explicitly warns that the previously stored copy **may have changed**, advising the user to export the open project before closing the tab.
- It preserves ordinary successful save metadata, the conditional local recovery snapshot and existing error-signalling mechanisms. It makes no network requests and does not silently change project versions.

**Limit:** Restoring the old primary is **best effort**. Browser quota, storage denial, concurrent writes or system interruption can prevent successful rollback. The warning deliberately refuses to assert that prior storage is safe when the rollback failed. This stage cannot ensure data durability across browser clearing, devices or private-browsing modes.

## Original-code tests and workflows

[Regression commit d44484b](https://github.com/gmoon-code/research-methods/commit/d44484b3629220fd00cda194d6de6d1ddab80708) adds `tests/pilot-save-rollback.test.mjs`, loading and executing **the real `assets/pilot.js` source** in a Node VM with an instrumented simulated `localStorage`. Six cases cover:

1. Ordinary successive saves and the existing local recovery snapshot.
2. Metadata write failure **after successful primary overwrite**, with successful rollback to the earlier project.
3. A first-time save whose metadata write fails, where the newly written orphan primary is removed.
4. A failed primary write where rollback is unnecessary and the old project stays present.
5. A rollback that itself fails, requiring an explicit **storage-may-have-changed** warning.
6. A simulated concurrent second-tab write, which the first tab's attempted rollback must **not erase**.

[CI change af18fa7](https://github.com/gmoon-code/research-methods/commit/af18fa7ccd1263c9b4bebc99127c670b99d77a0b) includes the new tests in the existing **Content audit regression** workflow, retaining triggers for `assets/pilot.js` changes. [Final automated regression run 41566251630](https://github.com/gmoon-code/research-methods/actions/runs/41566251630) completed **success** on commit **af18fa7ccd1263c9b4bebc99127c670b99d77a0b**. Original job logs report:

| Suite | Passed |
| --- | ---: |
| Research Chat backend and adapter | 37/37 |
| Public instructional guidance loader | 11/11 |
| Backup/new-project confirmation | 8/8 |
| Backup restore before live mutation | 6/6 |
| Multi-key project save and rollback | 6/6 |
| **Total across five suites** | **68/68** |

The corresponding [GitHub Pages build/deployment run 41566251685](https://github.com/gmoon-code/research-methods/actions/runs/41566251685) was **queued** on the initial status check. Its final result must be verified rather than anticipated; passing CI is not a proxy for delivery or live browser cache state.

## Academic website writing and credibility

The original public `research-methods-studio.html#methods-privacy` accurately says student notebooks are **designed** to remain locally stored unless optional networked features are chosen and that independent backup is important before changing devices or clearing browser data. It offers JSON backup and recovery without promising a transaction across browser keys or guaranteed persistence under quota/storage failure. The implementation section further distinguishes published guidance from student records and avoids a general privacy-certification claim.

A public prose rewrite about transaction internals would burden a visitor-facing academic project page with low-level operational detail and weaken its coherent progression from research workflow to practical backup and responsible privacy limits. The code had the specific defect, so correcting the code and documenting the uncertainty in the audit records was the justified choice. **No public HTML edits made.**

## Remaining uncertainty and exact continuation

No test here confirms physical file saves across browsers, backend retention or all possible concurrent `localStorage` interleavings. A reported successful local save only describes accepted browser writes in that session, not a separate safe copy. The earlier original research and editorial/browser-test blockers remain independent.

**Exact next checkpoint C-RV29af:** inspect the separate `assets/pilot.js::privacyCopy` output and the **“Download privacy-minimized copy”** UI label in `assets/pilot-ui.js` against the actual exported fields. In particular, determine whether project context, open-response text, notes, chat history, student identity and other sensitive material remain in that reduced JSON file. Distinguish a selective data-minimization feature from anonymization or a safe-to-share guarantee. If the current label or disclosure risks a false impression, correct only what is justified, build source-level tests and preserve the explicitly nonrestorable nature of the privacy copy.

Independently unresolved whole-site matters remain **final-August S2C twenty-study row-level source coding**, **AP Biology original assessments/rater decisions/consent/assent/school permissions**, the **owner-selected published contact email**, and **six Editor V2 browser regression failures**. Comprehensive academic website content audit **In progress**.
