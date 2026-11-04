# C-RV29ev | Owner-authenticated publishing readiness and trust boundaries

**Date** 5 November 2026  
**Continued from** [C-RV29eu](EDITOR_V2_GITHUB_WEB_HANDOFF_C-RV29eu_2026-11-04.md)  
**Scope** Code review, an optional undeployed publisher compatibility correction, current GitHub App guidance, and synthetic non-publishing tests.

## Reconciled production evidence

The previously outstanding deployed Firefox smoke rerun passed all 3 tests in [run 41845353072, attempt 3](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41845353072) following the 22/22 exact HTTPS delivery check. The post-delivery Chromium rerun also passed 3/3. WebKit's recorded deployed smoke passed 3/3 before final file-byte confirmation, so it is not counted as a post-byte runtime check. The token-free GitHub.com handoff passed 103/103 source-faithful checks in each of Chromium, Firefox, and WebKit, with separate 22/22 production-delivery parity. None of these tests used a real owner credential, a physical mobile device, or a production owner-origin publishing server.

## Current publishing choices

| Route | User experience | Credential boundary | Assurance |
| --- | --- | --- | --- |
| Original direct-token Editor V2 publishing | Verified preview, owner confirms, direct REST update to `main` | User enters a scoped personal access token into the public website, where trusted same-origin page scripts can reach the publishing form | Extensively simulated, but credential-isolation and real owner-authenticated publication unverified |
| GitHub.com handoff in Editor V2 | Prepare the exact verified HTML, copy/download, review and commit on GitHub.com | GitHub authentication stays with GitHub; Editor V2 receives no token | 309 browser checks, exact public delivery, and further deployed smoke; final owner commit not independently tested |
| Optional GitHub App proposal Worker | Intended future GitHub sign-in and reviewable draft PR | Encrypted 15-minute **bearer** session returns to the browser on the academic site's origin | **Not configured, not linked to Editor V2, not deployed or proven credential-isolated** |

The token-free GitHub.com handoff is the preferred working choice until the owner-specific publishing service has an independently secured runtime. The older direct-token path is still operationally available but carries the documented trust-boundary warning. No current route has been established as fully issue-free or physically device-verified.

## C-RV29ev changes to the optional, dormant Worker

On [PR #13](https://github.com/gmoon-code/gmoon-code.github.io/pull/13), the legacy proposal service was brought into alignment with the **current 17 selectable Editor V2 HTML routes** by replacing legacy `about.html` with `contact.html`. The HTML acceptance limit moved from 250,000 to **900,000 UTF-8 bytes**, and the complete request limit from 2,500,000 to **4,000,000 bytes**. The original media size, MIME/signature/checksum checks, branch isolation, baseline digest comparison and draft-PR-only behaviour remain unchanged.

Every current repository page was inspected by the new source-file tests. In particular, the current `index.html` is approximately 413,000 characters and would have been rejected by the old 250,000-byte limit. All 17 files fit the revised ceiling and pass the dormant Worker's policy for a harmless, source-preserving editorial probe. The publisher tests passed **16/16** in [GitHub Actions run 41928192050](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41928192050), including the two new real-page preflights. The test workflow now also runs on relevant `main` changes after merging.

**These corrections remove known gatekeeping incompatibilities, not all integration gaps.** A real Editor V2 revision may include inline image data, generated design CSS, grouping or layout transformations that the old proposal validator does not permit. Some routes also have structured companion applications whose actual content must continue using their canonical publishing layer. None of these cases was certified by the harmless editorial-probe tests. The Worker is still unconfigured, and no new production publisher endpoint has been created.

## Security assessment and decision

The prior Worker's 15-minute session is an encrypted bearer token that contains a GitHub user-to-server token. Encryption hides the GitHub token's plaintext, but **the bearer session itself is a usable capability**. Same-origin hostile scripts can potentially read it and submit proposals while it is valid. CORS and `Origin` checks do not remove that threat. Existing live original-layout and preview frames allow trusted same-origin scripts, and previously tested sandbox changes caused editing regressions. Merely replacing the direct token with the old Worker bearer session would therefore **not** establish strong credential isolation.

GitHub's current app guidance recommends minimum permissions, server-side protection of confidential credentials, expiring tokens, and stable numeric user identity checks. User-to-server access tokens serve user-initiated actions; installation credentials have a different delegated authority and must be scoped appropriately. See [GitHub App best practices](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app), [GitHub user token guidance](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens), and [installation-token guidance](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app).

**Architecture decision.** Do not connect the dormant Worker to Editor V2 or register/deploy its GitHub App as though this were a completed solution. If the owner later chooses genuine one-click publication, build or adapt a distinct **owner-only authoring and publishing origin** with a narrowly scoped GitHub App. Keep credential exchange, tokens, session validation, and final GitHub mutations outside the public academic website's origin and scripting environment.

Minimum acceptance requirements for that future architecture follow.

1. Open the owner dashboard as a top-level site on a separately controlled origin, not a same-origin iframe inside the public academic website. Do not execute arbitrary visitor-page scripts in the publisher's privileged document.
2. Complete OAuth authorization and state binding on the trusted publisher boundary, preferably with PKCE or a strictly validated confidential-client flow. Verify the owner's stable GitHub user ID, repository access, and app installation permissions. No GitHub token or transferable bearer session should be exposed to public-site JavaScript.
3. Use a short-lived server-side authenticated session, `Secure` and `HttpOnly` cookies where applicable, appropriate `SameSite` settings, anti-CSRF checks, strict `Origin` verification, a restrictive Content Security Policy, and server-side request limits. Note that a separate origin alone is insufficient if it executes untrusted page code.
4. Limit the GitHub App to this repository and the minimum necessary contents/pull-request permissions. Keep client secrets, signing keys and token encryption exclusively in trusted server secrets. Use expiring user-authorized credentials, not a permanent personal access token.
5. On every requested publication, re-fetch the current source revision and compare a server-verified baseline; reject stale edits, unauthorized paths, unvalidated inline scripts/styles, and missing binary image assets. Stage a preview, show the exact destination and diff, then require an explicit final owner action.
6. Prefer a draft PR with manual review and CI gates initially. A true one-click direct-to-`main` option would require separately verified final consent, branch protection compatibility, race handling, complete audit logging, rollback and a repeatable proof that the bytes published equal the reviewed preview.
7. Exercise all 17 real source pages and every supported Editor V2 edit type, including photographs, cropping, appearance, grouping, inserted content and consecutive releases. Include malicious-input and session-theft tests, timeout and permission-loss cases, cross-browser checks, and real mobile/tablet trials.

The preferred low-risk current publication workflow remains GitHub.com's authenticated file editor after a verified source-matched handoff. Its additional manual review is intentional. No owner credentials, unpublished academic content or private research files were collected in this stage.

## Assurance boundaries and next checkpoint

The Worker's source compatibility and mock tests do not establish a secure service in production. There was no owner-authorized authentication, GitHub App registration, Cloudflare deployment, real PR created by the dormant Worker, live publication, physical-device session or penetration test.

**Next C-RV29ew** should separately examine mobile/touch browser interaction with Editor V2 and the public GitHub handoff, or evaluate a consented owner-only publisher deployment after the owner expressly chooses a separate hosting and authentication arrangement. Keep the original-layout content and public site visually unchanged unless a separately verified defect demands correction.
