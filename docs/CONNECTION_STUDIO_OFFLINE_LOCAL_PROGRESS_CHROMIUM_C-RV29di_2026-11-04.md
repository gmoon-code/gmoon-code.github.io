# C-RV29di | Connection Studio offline and device-local progress claims tested in Chromium

**Date:** 4 November 2026. **Continued from:** [C-RV29dh](CONTENT_LEDGER_NEXT_STAGE_INTEGRITY_C-RV29dh_2026-11-04.md). **Scope:** Previously untested implementation-dependent promises in the independently served `connection-studio/` writing application, its original source, service worker, all intended cached assets, actual browser-local progress, offline exercise/draft retrieval and unexpected network submissions. **Decision:** The source claims are borne out by a new real Chromium browser test. No instructional prose or app implementation changes were necessary.

## Current published claims and original app source

The `connection-studio/index.html` source, blob **`485dbe8c8a5994139fee5b0884889ad4e3479942`**, contains the reader-visible descriptions:

- **“Offline-friendly · Private local progress”** in the sidebar footer.
- **“Private, on this device”** near the activity count.
- A metadata description of **“An offline interactive writing trainer”**.

The website does not claim that the initial visit requires no network, that browser localStorage is permanent, or that progress is synchronized to an authenticated account.

The current service worker `connection-studio/sw.js`, blob **`0c7fcffda1119b7cbf81824ab55d01402ac2394b`**, precaches **seven actual app assets**, including `./`, `index.html`, `style.css`, `data.js`, `app.js`, the manifest and icon. Its fetch handler is restricted to same-origin GET requests and falls back to `caches.match(request)` on network failure.

The main original `connection-studio/app.js`, blob **`a30857e922cddc49a24c793a8d0c62a5c9a99086`**, uses browser `localStorage` under the explicit key **`connection-studio-v1`** for practice attempts, drafts, bookmarks and completed tasks. Saving a draft gives a “Saved locally” message only when the storage operation succeeds, with a separate warning if browser storage is unavailable. The complete source check found no direct exercise-submission `fetch`, XHR or sendBeacon call; the runtime browser network observer provides a separate bounded check.

The earlier source-content audits [C-CS1](CONNECTION_STUDIO_CONTENT_AUDIT_C-CS1_2026-11-01.md) and [C-CS2](CONNECTION_STUDIO_CONTENT_AUDIT_C-CS2_2026-11-01.md) reviewed the 12 rhetorical relationships, 26 techniques, exercise banks and the synthetic-evidence caution, but correctly left actual offline progress and live browser behaviour unverified.

## Test-only implementation and reproducible result

Added a new `tests/connection-studio-offline.spec.cjs` Playwright/Chromium test, [commit `ef280d4`](https://github.com/gmoon-code/gmoon-code.github.io/commit/ef280d4b65302860a40736d3e41de5425d8b3439), plus an independent same-origin GitHub Actions workflow, [commit `afedec5`](https://github.com/gmoon-code/gmoon-code.github.io/commit/afedec5d92fe09a594ed114bd017a8ddf87b8b80).

The test drives an actual browser against a local served repository checkout. It checks:

1. A real controlling service worker is active and **all seven explicit cache assets** are found in the browser Cache API.
2. A reader chooses an answer in the relationship exercise, and the interface records one attempt in `localStorage` under its application key.
3. With the browser context explicitly set **offline**, a full page reload succeeds and the completed attempt remains visible.
4. The Technique Library is usable offline, and the reader can enter a real writing draft.
5. The draft reports local save success, remains stored in the app's `localStorage`, and appears intact after **another complete offline page reload**.
6. Across these exercise interactions, no browser request outside the same-origin GET app resource scope or HTTP method other than GET was observed.

[Real GitHub Actions browser workflow run **41737034207**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41737034207) at tested SHA `afedec5d92fe09a594ed114bd017a8ddf87b8b80` completed **success**, job **126268763554**. The actual Playwright log confirms **1 passed (1.3 seconds)**. This is browser-executed and stronger than simply inspecting `sw.js` or claiming offline support from the existence of a manifest.

## Editorial interpretation and boundaries

**No correction justified.** The phrase **offline-friendly** accurately describes a visit after the service worker has installed, in the tested Chromium context. “Private, on this device” is supported by local-storage persistence with no exercise-answer POST or external request in this activity test. Readers may still contact the site's ordinary public host to obtain initial resources or future updates. Browser-data clearing, quota failures, browser privacy mode, multiple-device synchronization, malware/extensions and every other browser engine were not tested or guaranteed.

This source/use verification does **not** imply the writing exercise bank has demonstrated causal educational effectiveness, that user data is cryptographically encrypted, or that the site uses a secure account with backup recovery. No private student research, live signed permissions or scoping coding records were involved.

**Public HTML, app.js, data.js, service worker, images, CSS and authored writing examples:** Unchanged. Only new **test/CI source files** were committed. Research source grades remain **46 F / 6 A / 1 M / 0 P**, whole scholarly/academic website content audit **In progress**.

## Exact next checkpoint

**C-RV29dj | Connection Studio backup export/import truthfulness.** Revisit only the separately unverified user-facing ability to download a local backup, import it after a local record change, require an explicit replacement confirmation, and accurately message failed versus successful storage. Check the current `app.js` UI and source. Use a real browser test when feasible; avoid asserting persistent cloud backup or cross-device synchronization. Then return to substantive research evidence gaps or new source changes.
