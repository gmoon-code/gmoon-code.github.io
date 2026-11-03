# C-RV29ah | Story Method embedded Unit 1 progress and pre-opening disclosure

**Date:** 3 November 2026. **Resumed from:** C-RV29ag. **Scope:** All substantive wording of `story-method.html#preview`, original site-wide `site-previews.js`, and the actual `gmoon-code/memory-palace-u1-8` student frontend progress/loading modules. **Result:** Corrected a hidden-until-open progress-sharing warning and documented an additional **startup write of the active Unit 1 journey**, with source-level regression coverage and existing visitor-page tests. The student Story Method app and historical progress records were **not** changed. Whole-site academic content audit **In progress**.

## Why this is a distinct stage

C-RV29ag found that the academic Research Methods Studio live preview shares its browser project with the full application, but showed a privacy warning only **after** the embedded iframe opened. The same original [`site-previews.js`](https://github.com/gmoon-code/gmoon-code.github.io/blob/main/site-previews.js) also creates the Story Method embedded view. The previous Story Method page's visitor text must be assessed against the **actual Story Method application**, whose learning progress is different from the research notebook described on the other page. This is a cross-page disclosure audit, not another scholarly finding about biology learning or a claim about student learning outcomes.

## Independently inspected original app source

The initial academic website `story-method.html` blob **222b4d47fff418f9231dca7e3151bdf2011db7b5** contained the following warning inside **`div.project-preview-active`**, which was hidden until after the visitor selected Show preview:

> Progress made in the preview may also appear in the full site because both use the same browser storage. For longer sessions, open the full-size application.

The previously visible section asked the learner to **“Begin with the Unit 1 home screen and follow a journey when you're ready.”** Neither text informed them *before opening* that the preview could load an existing learner's saved progress or change the last-opened unit.

The [original academic preview script](https://github.com/gmoon-code/gmoon-code.github.io/blob/main/site-previews.js), blob **0a4c659eca2d9eca6d80fb6f906988e0d9ea13cf**, sets the Story Method iframe `src` to **`/memory-palace-u1-8/?unit=unit-1`** at the **same `https://gmoon-code.github.io` origin**, using `allow-scripts`, `allow-same-origin`, `allow-forms` and `allow-popups` permissions. No iframe exists until the visitor chooses Show preview; Close preview removes its element without removing any saved state.

The linked [Story Method `frontend/js/state.js`](https://github.com/gmoon-code/memory-palace-u1-8/blob/main/frontend/js/state.js), source blob **6fee799da34eb3044baf49c77d64df493b7702d4**, uses a **single origin-scoped `localStorage` key `memory-palace-v2:progress`**. It loads, normalizes and saves the active unit, active journey, story scenes seen, completed journeys, scheduled reviews and hint-assisted recall/review records. Its `saveState` writes to this same key, with an in-memory fallback if browser storage is unavailable.

The linked [Story Method `frontend/js/app.js`](https://github.com/gmoon-code/memory-palace-u1-8/blob/main/frontend/js/app.js), source blob **6b789e77e85a3334961bf610adb02b63773383df**, calls `boot()` on page load. Its `boot()` reads the `unit=unit-1` URL parameter, resolves the requested released unit and invokes `loadUnit(unitId)`. **The `loadUnit` method updates `state.activeUnit` to the requested Unit 1, chooses an active journey and calls `saveState(state)` even before the learner enters a scene or answers a question.** Thus merely opening the preview can switch the last-opened unit/journey of previously saved progress, though the existing seen/completed and review records are preserved by the normalization routine. Continuing a story or responding to Quick Recall/Review can produce further saved changes. This is more specific than the former passive wording that progress “may also appear.”

The ordinary full application at `https://gmoon-code.github.io/memory-palace-u1-8/` has the same scheme, hostname and port as the academic embed. Browser `localStorage` is origin-scoped, not path-scoped, as the [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) explains. The iframe's `allow-same-origin` token retains that origin; the combined `allow-scripts` / `allow-same-origin` sandbox permissions do **not** establish an isolated read-only demo boundary. The source is verified, but no actual learner's saved progress or deployed browser profile was accessed or changed during this audit.

## Actual bounded website editorial correction

[Academic site HTML commit af99342](https://github.com/gmoon-code/gmoon-code.github.io/commit/af9934217663b16e848f331013a6a2ae561d3cd8) changed **two paragraphs** in `story-method.html#preview`. It preserved the opening introduction and all surrounding AP Biology content and only refined the preview warnings:

- **Before** the Show preview button, visitors now read that the embedded live Unit 1 application uses the same saved progress as the full-size Story Method in this browser, that opening it can change the last-opened unit/journey **even before any question**, and that activities inside it can update the saved progress. This gives them the choice before loading their stored journey.
- The caption **after** opening now specifies that the views share locally stored progress when storage is available, that closing the preview **does not undo changes**, and that longer sessions are better suited to the full-size application.

These are factual distinctions with different scopes. The first is a **decision-point disclosure**; the second is a **post-open reminder**. They preserve the site's gentle, practical instructional voice and naturally connect the consequence of opening the application to the consequence of using it. The writing avoids promotional claims, unsupported learning outcomes, em dashes, stock academic transitions and unnecessary theoretical language. No site layout/styling file or student application source was modified.

## Verification and test-status boundary

[Source/VM tests created at b58d6ca](https://github.com/gmoon-code/gmoon-code.github.io/commit/b58d6caf129c22ec9ad587898950bdc332134677) add `tests/story-preview-shared-progress.test.mjs`. These two checks verify:

1. The precise shared-progress and **opening-triggered Unit 1** warning is visible **before** the opening control, while the active caption describes no undo on close.
2. The actual `site-previews.js` executes under a controlled Node VM, opens the correct **same-origin Unit 1** iframe only after the click, retains the script/same-origin flags, responds to mobile preview selection, closes the iframe and restores focus.

[Workflow commit 64c6acc](https://github.com/gmoon-code/gmoon-code.github.io/commit/64c6acc168d8d322793b23eae98c52d1ff9881e0) added these tests to the existing **Story Method detail-page visitor audit** and triggers them on test-file changes. [Initial Story Method visitor workflow 41569729141](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41569729141) completed **success** for the HTML edit; [Projects overview and preview workflow 41569729197](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41569729197) also completed successfully. The [final Story Method detail visitor audit, workflow 41569818619](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41569818619), initially ran the Node step ahead of the Playwright visitor test and subsequently **completed successfully** for source commit **64c6acc168d8d322793b23eae98c52d1ff9881e0**. The original job logs show **2/2 new tests passed**, the existing Story Method visitor browser-audit step completed successfully, and the result publishing step succeeded.

The website's local browser audit exercises its preview controls in the academic site repository's HTTP server. It does **not necessarily serve the separate Story Method repository's actual app** at the corresponding subpath. The source analysis establishes the shared origin and state-writing mechanism but does **not claim a live deployed-browser capture of a learner's saved progress**. Source tests, visitor UI tests and real-browser cross-repository persisted progress are different verification levels.

## Exact next checkpoint

**C-RV29ai | Whole-site substantive content coverage reconciliation after preview audits.** Return to the original page/section inventory and compare actual current repository pages with existing audit-status records, including root pages outside the editable Studio manifest and supplementary or expandable sections. Identify the **first demonstrably unreviewed substantive passage** or still-unverified source claim, rather than repeating completed 53-reference, Teaching and Projects checks. Record the exact file, section, source requirement and next bounded verification action. If primary empirical records are unavailable, preserve blocked status instead of supplying invented data. Continue to follow the author's Canadian-English and distinctive careful, naturally connected academic voice.

The original **final-August S2C 20-study source-coding matrix**, original **AP Biology source assessments/rater/consent/assent/school authorization**, the **public contact-email owner decision**, and **six Editor V2 browser regression failures** remain independently unresolved. Whole-site academic website content audit **In progress**.
