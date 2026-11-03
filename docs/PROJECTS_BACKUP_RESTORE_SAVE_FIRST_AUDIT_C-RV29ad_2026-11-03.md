# C-RV29ad | Restore a project only after browser persistence succeeds

**Date:** 3 November 2026. **Resumed from:** C-RV29ac. **Scope:** `research-methods-studio.html#methods-privacy`, the companion application's `assets/pilot-ui.js` Restore backup event, genuine `assets/pilot.js` save/recovery/backup validation, and controlled source-execution regressions. **Disposition:** The working-project overwrite hazard is corrected and CI tested. **No public academic website HTML edit warranted.** Comprehensive academic website content audit remains **In progress**.

## Original, reproducible inconsistency

The prior companion application `gmoon-code/research-methods/assets/pilot-ui.js` blob **047a52f374bb820a9c77fc1c719d5df81f79cb62** bound a user-chosen `Restore backup` file to this sequence:

1. Parse selected JSON, validate the recovery-envelope fingerprint and reject privacy-only nonrestorable copies.
2. Obtain explicit affirmative user confirmation before replacing the current browser project.
3. Create a restored project, **delete the keys of the current live project object and overwrite them with the restored candidate**.
4. Only then invoke the provided `save()` callback, which writes to browser storage and may return `{ok:false}` if localStorage is unavailable or quota is exhausted.
5. Report failure if the storage write fails.

Thus, after a failed save, the UI displayed an error, but the actual **in-memory project already contained the attempted restored data** rather than the student's previous current work. Because other UI components reference that same long-lived project object, this could mislead students about which project they were viewing or which copy remained locally saved. The academic page's general claim of JSON backup/recovery functionality was accurate but this implementation path was unsafe under storage failure.

This was **independent** of the preceding C-RV29ac change protecting the `Download full recovery backup` to new-project path from auto-deletion. C-RV29ad concerns **restoring** an external file, not exporting one.

## Minimal change actually committed

[Companion application fix ed15e72](https://github.com/gmoon-code/research-methods/commit/ed15e721059075b50c1f4367af7c7575ea48fd62) changes only the ordered sequence in `assets/pilot-ui.js`.

The handler continues to validate JSON and the backup envelope, rejects nonrestorable privacy copies, and requires a confirmation dialog. After constructing the restored candidate with `P.applyRestore(project, v.project)`, it now calls **`P.safeSave(key, restored)` before modifying the current in-memory project**. It replaces the current project's keys only when the saved result explicitly reports `ok === true`, then schedules reloading the restored project. When saving fails, the original project object remains in memory; the UI reports the problem and advises the student to export their currently open work before leaving the tab if storage is unavailable.

The old `save()` callback closed over the **already-mutated live object** and could not safely persist a candidate without first replacing it. The new direct call to the established `P.safeSave` routine is deliberate. Full project normalization is already performed by the storage routine, and the application's ordinary startup pipeline reconciles its canonical fields again after reload. The restore does **not** silently activate networked Chat or alter the content-publication version.

## Executed original-code regression tests

[Test file 03e2a02](https://github.com/gmoon-code/research-methods/commit/03e2a025dc85cd3f35a473694f1f314be815c92f) adds `tests/backup-restore-save-first.test.mjs`. It runs the actual `assets/pilot.js` and `assets/pilot-ui.js` source in a controlled Node VM with mock DOM, browser storage, the real backup-envelope fingerprint implementation and a simulated selected JSON file. **Six behavioural test cases** verify:

1. A full, valid recovery packet is saved to the browser's original project key **before** replacing the live in-memory project.
2. A storage write failure leaves the original in-memory project unchanged; in the tested immediate-write-failure condition, the previous saved storage string also remains intact and no reload is scheduled.
3. A cancelled restore preserves the original project in memory and storage.
4. Invalid JSON is rejected before confirmation and mutation.
5. A recovery-envelope project modified without matching its checksum is rejected.
6. A privacy-minimized copy is correctly identified as **not a complete restorable backup**.

[CI change c27795d](https://github.com/gmoon-code/research-methods/commit/c27795df328848a119db079c57f2b201cb95f5fe) adds the two Pilot source files and the new test to the repository's content-audit regression trigger, running the restore suite alongside existing checks.

The [Content audit regression run 41565659749](https://github.com/gmoon-code/research-methods/actions/runs/41565659749) completed **success** on the final commit. Actual job logs show **6/6 restore tests passed**, the preceding **8/8 reset tests**, **11/11 public loader tests** and **37/37 Chat/adapter tests**. Together **62 tests passed** in those separate test suites. The independent [Pages deployment workflow 41565660150](https://github.com/gmoon-code/research-methods/actions/runs/41565660150) was initially in progress and was subsequently **verified completed successfully** for the same source commit **c27795df328848a119db079c57f2b201cb95f5fe**. A successful Pages workflow still does not verify live browser caching, individual restored files or external filesystem integrity.

## Scope limits and next hazard

The new ordering guarantees only that a failed `P.safeSave` **does not mutate the current live project object**. The generic `Pilot.safeSave` routine itself performs **multiple nontransactional localStorage writes**. It saves a potential recovery snapshot, then writes the new primary project and last-save metadata. If a later metadata write fails **after the primary write has already succeeded**, the routine can report failure while the underlying primary key has changed. The application has no native multi-key localStorage transaction. This distinction is material, so **complete persistent-data atomicity is not claimed** from this stage's immediate-failure test.

The academic website's wording, “JSON backup and recovery option,” is accurate without promising a transactional database, cryptographic validation, universally available storage or a successful file transfer across browsers. The technical caveat and independent-file-backup recommendation are appropriate. The change improves the actual behavior rather than introducing formulaic prose into a scholarly project page.

**Public academic HTML revisions:** None. **Companion application restoration:** Corrected at source and CI level. **Physical-file, quota-edge and real-browser storage behavior:** Not independently tested.

## Exact continuation

**C-RV29ae | Multi-key localStorage save and failure recovery integrity.** Inspect `assets/pilot.js::safeSave` across backup snapshot, primary and metadata writes. Test a failure specifically at the **metadata write after a successful primary write**, alongside quota errors and recovery snapshots. Determine whether a small best-effort rollback, more robust write order, or clearer failure semantics can prevent silent replacement of a previously saved project. Avoid presenting localStorage as offering transactions; add executable tests and preserve genuinely recoverable old data where possible. Update the academic website's privacy/recovery description only if its current claims become inaccurate.

Other unresolved dependencies remain the original **final-August S2C twenty-study study-level coding**, **original AP Biology student assessments/rater decisions/consent/assent/school authorization**, the **owner-selected public contact-email decision**, and **six Editor V2 browser regressions**. The overarching comprehensive academic website content audit remains **In progress**.


## C-RV29ae follow-up | Partial-write save defect corrected | 3 November 2026

The nontransactional `Pilot.safeSave` **metadata failure after primary overwrite** hazard recorded above was examined and **partially mitigated**, not ignored. [C-RV29ae](PROJECTS_LOCAL_STORAGE_SAVE_ROLLBACK_AUDIT_C-RV29ae_2026-11-03.md) implements **best-effort restoration of the previous primary value** when a later save step fails, protects a newer cross-tab write from accidental rollback and reports explicit uncertainty when rollback cannot succeed. [The completed regression workflow](https://github.com/gmoon-code/research-methods/actions/runs/41566251630) passed **68/68** automated tests including six failure-path cases. The [Pages build](https://github.com/gmoon-code/research-methods/actions/runs/41566251685) also completed successfully. Browser localStorage still does not support multi-key transactions, and failed rollback remains a documented limitation. Exact subsequent checkpoint **C-RV29af** audits the separately labelled privacy-minimized backup output for possible disclosure of remaining sensitive notebook content.
