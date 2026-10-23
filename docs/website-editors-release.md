# Website editor release candidate and rollback guide

This document covers the *editor interfaces* in the three connected websites. It does not authorize publication of any academic research text, teaching guidance, or frozen AP Biology curriculum revision.

## Release candidates

| Website | Review PR | Editor behaviour |
| --- | --- | --- |
| Ye Eun Moon academic website | [PR 2](https://github.com/gmoon-code/gmoon-code.github.io/pull/2) | Direct on-page edits, validated layout proposals, browser-local drafts, reviewed HTML export |
| Research Methods Studio | [PR 11](https://github.com/gmoon-code/research-methods/pull/11) | Sign-in-protected Admin Workspace and visual guidance editing with the existing review/publishing pipeline |
| AP Biology Story Method | [PR 8](https://github.com/gmoon-code/memory-palace-u1-8/pull/8) | Narrative-only editor with drafts, reviewed JSON export/restore, find-and-replace, and mobile navigation |

The editor directory is located at `https://gmoon-code.github.io/editors.html` after merging the academic PR. It links to:

- `https://gmoon-code.github.io/editor.html`
- `https://gmoon-code.github.io/research-methods/editor.html`
- `https://gmoon-code.github.io/memory-palace-u1-8/editor.html`

These static editor pages and the directory may be publicly viewable. A `noindex` directive reduces search indexing but does **not** restrict access. The Research Methods Studio authoring workspace requires its own teacher sign-in. The other two editors cannot directly modify a deployed website.

## Required release gates

- [ ] Latest **exact PR head** has successful GitHub Actions checks. Academic `Secure editor publisher checks`, `Visual editor smoke test`, `Fluid layout lab browser tests`, and `Cross-site GitHub Pages editor preflight` all need to pass. Research Methods Studio needs `Admin visual guidance smoke test`. Story Method needs both `Narrative visual editor smoke test` and `Memory Palace QA`.
- [ ] Download and inspect current desktop and mobile screenshots from the GitHub Actions artifacts. Confirm visible toolbars, keyboard focus, no off-screen forms, clean light/dark previews, and legible links.
- [ ] Review that public student content, the academic website's source pages, and canonical journey JSON files are not changed by these PRs. Compare each PR file list to `main`.
- [ ] Review the passing **negative authentication test** for signed-out users and expired/unverified stored sessions on the exact Research Methods Studio PR head; this test blocks external network calls and never authenticates as an administrator.
- [ ] Verify the **existing live Research Methods Studio teacher/admin login** using an authorised account in a private browser session. Open the live `teacher.html` route, sign in, confirm the Admin Workspace opens, sign out and confirm the gate returns. This validates the unchanged production authentication route, **not the unmerged visual editing UI**. Never send a teacher access code through chat, issues, screenshots or test logs.
- [ ] Inspect the new visual editing UI through the authenticated-session-independent Chromium previews and source/browser tests on the draft branch. The draft cannot use live production sign-in directly because the Worker origin allowlist and GitHub Pages setup do not serve arbitrary PR branches. For a true pre-merge authenticated draft test, create an approved **isolated staging Worker and Pages origin**, with separate credentials and data. Do not temporarily enable production CORS on localhost.
- [ ] After an authorised merge of Research Methods Studio, immediately check its **new** visual guidance editor with a real authorised account, perform an in-memory draft-only edit and preview, then cancel without publishing. If sign-in, validation or editing fails, revert the visual editor release via the normal PR/deployment process. Do not submit a live publish or rollback solely to test the UI.
- [ ] Confirm the academic publisher is **disabled** until the separate private publisher API and GitHub OAuth client are configured. The public `editor-publisher-config.js` intentionally has blank `apiBase` and `clientId`; no secrets belong in the public repository.
- [ ] Confirm Story Method narrative changes remain browser-local, that a downloaded JSON proposal preserves protected science and checkpoint fields, and that its editor cannot write to GitHub.
- [ ] Preserve the exact tested commit SHAs and a clean copy of `main` before merge. Ensure any browser-local draft that should survive is exported to a separate file.

## Staged publication order

1. Merge the Story Method draft PR after its full curriculum QA and editor smoke tests succeed. `pages.yml` deploys **only after successful Memory Palace QA on `main`**, from the exact tested commit. Wait for the production verification job before proceeding. Do not change any frozen curriculum text as part of this editor release.
2. Merge the Research Methods Studio PR only after its browser smoke test, passing signed-out session tests, review of the unchanged production sign-in on the **current live site**, and release authorisation. Confirm its `editor.html` redirects to teacher sign-in. Immediately after GitHub Pages deploys the new UI, perform the new visual-guidance draft-only acceptance test using an authorised session; revert if it fails. Alternatively, complete that review before merging in an independently configured staging environment.
3. Merge the academic website PR last, after its own four checks and a fresh cross-site integration pass. Confirm `/editors.html` shows all three links and the associated redirects. Verify that its proposed-editing controls stay local while private publisher settings are blank.
4. Open the public editor routes in a clean browser on both desktop and phone. Test selection, cancel, export, reload, and app navigation. Do **not** publish example text or curriculum proposals.

The academic and Research Methods Studio sites use GitHub Pages, but their actual Pages source configuration must be verified in repository settings by an authorised maintainer before merging. A green draft PR does not itself prove the public GitHub Pages deployment has refreshed.

## Recovery and rollback

- Keep the pre-release `main` SHA for each repository in the release record. For a regression, create a **new revert PR** (or revert the specific merge commit), run the normal checks, and restore the previous mainline content through the normal Pages release flow. Avoid force-pushing shared `main`.
- For Story Method, a reverted mainline must pass its full Memory Palace QA before `pages.yml` deploys the reverted artifact. Monitor the production verification step.
- For Research Methods Studio, reverting the visual editor files does not automatically roll back a separately published guidance data revision. Use the existing authorised content rollback procedure if actual published guidance changed.
- Browser-local drafts may refer to old source hashes after a rollback. Export any needed draft before clearing storage. Do not blindly reimport a draft against changed source content.
- If authentication, content validation or private publishing boundaries fail, disable the affected release path and revert the editor deployment before resuming use.

## Intentional limitations of version one

The academic editor and Story Method editor **do not have one-click production publishing**. They produce reviewed local exports. The academic editor's private publisher connection remains deliberately disabled. Story Method editing is narrative-only and protects the frozen AP Biology science, memory objects, checkpoints and scene geometry. Research Methods Studio has more direct authorised publication controls only for supported guidance workflows; other wording proposals remain review-only.

A later phase may improve layout freedom and authoring controls without coupling them to unrestricted public-site writes.

## Physical phone-width editing order

The 390px academic editor release smoke test now checks the complete application rather than only the website's mobile page preview. At narrow widths, the editable page and its inspector appear before the long navigation sidebar. A compact **Choose a page** control above the preview mirrors the full sidebar page picker and uses the same source-validated loader. The test changes pages in both controls, checks the source remains unpublished, and saves an `academic-editor-mobile.png` screenshot in the editor smoke-test artifact. Wide-screen three-column layout remains unchanged.

## Confirmed release sequence

**Story Method Stage 1 released 23 October 2026** at mainline commit `0615a01f80cde6aa97dd02dfa5d1a9012bf434e7` from reviewed PR #8. [Mainline Memory Palace QA](https://github.com/gmoon-code/memory-palace-u1-8/actions/runs/39888377409) and the [guarded Pages build, deploy and verify-production jobs](https://github.com/gmoon-code/memory-palace-u1-8/actions/runs/39888516593) all passed. Production QA confirmed all 8 units, 58 journeys and 448 scenes. Story Method editor URL is `https://gmoon-code.github.io/memory-palace-u1-8/editor.html`. The cross-site preflight now pins this deployed main commit, rather than the pre-merge feature commit.

**Research Methods Studio Stage 2 released 23 October 2026.** The owner privately confirmed that both actual teacher sign-in and sign-out worked. The reviewed editor PR #11 was squash-merged as `3eb53f6488cb5767e42933b515650ae109f7927d`. [GitHub Pages build and deployment](https://github.com/gmoon-code/research-methods/actions/runs/39891967779) succeeded. The academic three-site integration test now checks the **deployed** Research Methods editor assets over read-only HTTPS before promoting Stage 3. No admin login or content publication occurs in that test. The academic website hub remains unmerged pending full exact-head checks.

## Live Research Methods Studio anonymous-access gate

The unchanged **published** Research Methods Studio sign-in route was tested via an actual headless Chromium browser against `https://gmoon-code.github.io/research-methods`, under the updated PR head `322fe1416634e27ea0ee62422c8f15b5399e1699`. The [Admin visual guidance smoke test](https://github.com/gmoon-code/research-methods/actions/runs/39891316431) passed its production-read-only step as well as the local simulated editor tests. The live test covered the editor bookmark, direct Admin URL, expired locally stored credentials, and an unverified local session. All external authentication-service requests were blocked; no real token was supplied or published content changed.

**Outstanding:** the owner must still verify a real authorised teacher login privately before approving Stage 2. This read-only test verifies negative access controls, **not** the ability to sign in with a valid code. The academic three-site preflight is pinned to the updated tested Research Methods commit, published Story Method `0615a01f`, and the academic branch head.

## Stage 2 deployed editor asset verification

The composite academic editor release test performs **read-only HTTPS GET** requests to the currently published Research Methods Studio `editor.html`, `admin-workspace.html`, and `assets/admin-visual-guidance.js`. It requires a 200 response and the expected editor-specific controls, including the new list-item duplication and safe-pointer-selection handling. This detects an out-of-date Pages deployment even when a source-branch test passes. These requests never carry credentials, and the browser's separate student/admin test session remains isolated from external authentication and publication services.
