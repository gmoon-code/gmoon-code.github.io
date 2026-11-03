# C-RV29ac | Confirmed backup handoff before clearing a browser research project

**Date:** 3 November 2026. **Resumed from:** C-RV29ab. **Scope:** User-facing `research-methods-studio.html#methods-privacy` and original companion application's New Project modal, JSON full-backup creation, `Pilot & Recovery` controls, project storage clearing, and relevant automated tests. **Disposition:** A concrete project-data loss hazard was **corrected** in `gmoon-code/research-methods`, with execution-based regression coverage and a successful CI/deployment workflow. **No academic website prose changed.** Whole-site content audit **In progress**.

## Exact prior source and observed hazard

The original companion application's `assets/app.js` blob **74cfdf2d8cbcfa2c64aab919648e3cbf2c860971** exposed a New Project modal with a **“Download backup and start new”** button. Its click handler called `download("research-methods-studio-full-backup.json", JSON.stringify(Pilot.backupEnvelope(project,"full")), "application/json")`, then unconditionally set a **250-ms timer** to execute `Pilot.clearProjectStorage(KEY,{clearOnboarding:false})` and `location.reload()`.

The browser download helper creates an Object URL for a Blob and calls the anchor's `.click()`. This method requests a download, but it **does not report that the file was actually written, retained, accessible on the student's device or restorable**. Browser settings, a cancelled save dialog, a blocked download, device security controls, storage exhaustion or the student's subsequent file handling can prevent reliable possession. Consequently the former timer could erase the only currently available notebook even if no independent recovery backup had been obtained.

The independently available **Pilot & Recovery** full-backup control already allows downloading a `rms_project_backup` full envelope, with the warning that it may contain raw data, source notes and manuscript content. The `privacy` envelope is a deliberate nonrestorable, reduced-detail copy. `RMSPilot.validateBackup` checks the full envelope's simple version/checksum fingerprint on later restore; the fingerprint is **not cryptographic authentication** or evidence of a saved filesystem file. The public website says independent backups are important and reports a JSON backup/recovery option. Its existing claim was appropriately cautious; the **defect was in the companion application's transition between download initiation and destructive reset**.

## Actual implementation correction

The companion repository was updated at [commit a99bedec](https://github.com/gmoon-code/research-methods/commit/a99bedec25744671223b7125dc4916c027fd1a88), changing only the New Project modal handler in `assets/app.js`:

1. The first option now says **“Download full recovery backup”**, not that clicking it will automatically start a new project. It creates the same complete JSON envelope and requests the file download, but **does not erase the project or reload**.
2. A second panel is revealed **only when download initiation did not throw**. It explicitly states that a download request **does not confirm the file was saved** and asks the student to **locate the saved full recovery JSON** on the device or school-approved storage.
3. A checkbox must be selected before **“Start new with saved backup”** is enabled. The click handler additionally checks its state and requires a final affirmative browser confirmation. Cancelling the modal, leaving the checkbox unchecked or declining the final confirmation leaves the current notebook intact.
4. When download initiation throws, an error is reported in a live status region. The confirmation panel stays hidden and no project deletion occurs. A second download attempt clears any previous checkbox selection and requires fresh confirmation.
5. The separate, explicitly destructive **“Start new without backup”** action still exists, retaining its own confirmation. Both confirmed reset paths now check `Pilot.clearProjectStorage` results for primary, recovery and metadata keys and **do not reload if those calls report an error**. The code reports that storage was not cleared completely rather than falsely announcing a fresh project.

The interface also includes a cancellable modal, clear labels and an `aria-live` status line. Its wording is direct about the limits of browser download APIs, without claiming application-level proof that the downloaded file exists or passes later restore verification. The code no longer schedules project deletion with a timer.

## Execution-based regression coverage

A new dedicated [test file](https://github.com/gmoon-code/research-methods/blob/main/tests/backup-reset-confirmation.test.mjs), committed at [2237e28](https://github.com/gmoon-code/research-methods/commit/2237e283d1b1080b4f8dc99140c6697636f01d27), **extracts and executes the actual New Project modal handler from `assets/app.js`** inside a controlled Node VM with mocked DOM, download, storage and confirmation functions. It does **not** merely assert that desired words appear in an unrelated test double.

Eight behavioural cases were tested:

- The modal explicitly distinguishes download initiation from a saved, located recovery file.
- Requesting a full JSON export starts a download but leaves the notebook and browser session in place.
- Cancelling the modal after a download attempt preserves the project.
- A thrown/blocked download request cannot expose the reset-confirmation path or delete data.
- The checkbox and affirmative final confirmation are both required before deletion.
- Reattempting the download resets earlier acknowledgement.
- Reported errors from browser-storage clearing stop the reload and display a warning.
- The separate no-backup action still requires affirmative confirmation and checks storage removal.

The dedicated test uses a **controlled browser simulation**, not physical storage devices or live Chrome/Firefox download UI. It checks **the actual code path** of the event handler and prevents accidental regression to automatic deletion.

[Workflow commit b5ff6dd](https://github.com/gmoon-code/research-methods/commit/b5ff6dd6fc75af960ffdf6cf8b63ed93f925a6ce) added both `assets/app.js` and the test file to the existing **Content audit regression** workflow's path filter and added a dedicated Node test step. The [final CI run 41564971992](https://github.com/gmoon-code/research-methods/actions/runs/41564971992) completed **success** on that commit. The actual job logs show:

- Research Chat backend and adapter tests **37/37 passed**.
- Public-guidance loader tests **11/11 passed**.
- New backup/reset event-handler tests **8/8 passed**.
- No failing tests in those suites.

The [GitHub Pages build/deployment run 41564971203](https://github.com/gmoon-code/research-methods/actions/runs/41564971203) also completed **success** at the same commit. This confirms deployment-workflow success, **not** browser download parity, the absence of platform caching, a guarantee of saved files, or actual recovery across devices.

## Academic website content and voice review

The academic visitor page `research-methods-studio.html` remains at blob **911924f5f3b22a3106984cf1b96e716fe1732b9d**. The `#methods-privacy` section's cautious statement about local notebooks and the need for an independent backup accurately reflects the revised code. The separate `#methods-implementation` section describes published instructional guidance as distinct from notebook data and states limitations of technical documentation. No user-facing academic prose contradicts the safer reset workflow, and none claims the application can prove download completion.

The modal wording now follows the author's preferred careful and plain style. Each instruction moves from obtaining a file to checking where it was saved, then to a deliberately separate decision to clear a project. That progression is more meaningful than a single action that conflated downloading with discarding. There are no em dashes or forced decorative transitions in the revised modal. **No published academic HTML rewrite was warranted.**

## Remaining boundaries

The revised reset flow relies on **user acknowledgement**. It cannot inspect a normal download's true filesystem state across browsers and does not automatically open and validate the file after saving. A user could mistakenly confirm despite an unavailable file. This is why the wording says to *locate* the file, and why confirmation is an explicit decision. A reported partial failure from `localStorage.removeItem` can still leave some keys removed and others present because browser localStorage does not expose a multi-key transaction; the handler at least avoids presenting a successful reset in that condition. The separate **Pilot & Recovery file-restore** path deserves independent inspection for partial in-memory mutation when persistence fails.

**Exact next checkpoint C-RV29ad:** audit the separate **Pilot & Recovery → Restore backup** handler (`assets/pilot-ui.js`) for **atomicity when localStorage is unavailable**, cancelled/invalid backup handling, the backup integrity envelope, and whether failed restoration can leave current in-memory work changed. Verify the source with execution-based tests and make only justified corrections. Reconfirm the `research-methods-studio.html` description, preserving the distinction between browser simulation, actual external file receipt and deployed browser outcomes.

Independently unresolved whole-site dependencies remain original **final-August S2C twenty-study coding**, **AP Biology original student assessments, independent ratings, consent/assent/school permission evidence**, the **owner-selected public contact-email decision** and **six Editor V2 browser regression failures**. Whole-site academic content audit **In progress**.
