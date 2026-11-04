# C-RV29eu | Editor V2 publishing credential boundary and GitHub sign-in handoff

**Date:** 4 November 2026  
**Continued from:** [C-RV29et](EDITOR_V2_CANVAS_DRAFT_RECOVERY_C-RV29et_2026-11-04.md).  
**Status:** Repository implementation **verified** in Chromium, Firefox and WebKit, and exact public HTTPS delivery **verified 22/22** after the successful GitHub Pages deployment. The first 19/22 attempt remains a documented historical deployment failure.

## Audited boundaries

Editor V2's pre-existing direct GitHub publication path asks the repository owner to enter a fine-grained personal access token in its own public-site form. That token is retained only transiently in JavaScript memory, but trusted same-origin page scripts can access the form when it is open. Previously attempted iframe sandboxing broke WebKit and drag interactions and was reverted; the [C-RV29ek record](EDITOR_V2_TOKEN_ISOLATION_C-RV29ek_2026-11-04.md) remains applicable. Passing tests with synthetic token values do not establish secure credential isolation or successful owner-authenticated publication.

A separate, unconfigured legacy GitHub App/Cloudflare Worker proposal service exists in `publisher/worker.mjs` and `publisher/SETUP.md`. The public `editor-publisher-config.js` has empty `apiBase` and `clientId`, and Editor V2 does not use this service. Its old allowlist contains `about.html` instead of the currently editable `contact.html`. It also caps page HTML at 250,000 bytes while the current Home page exceeds that size. Therefore, configuring the legacy service alone would not make it a compatible 17-page Editor V2 publisher. Its encrypted 15-minute browser bearer session avoids exposing the raw GitHub token but remains usable if same-origin malicious code captures the session; it must not be described as full isolation.

## Implemented token-free publishing alternative

[PR #12](https://github.com/gmoon-code/gmoon-code.github.io/pull/12) merged at [`f8a2a82`](https://github.com/gmoon-code/gmoon-code.github.io/commit/f8a2a82bddc5816bd52a6b701ca805e485eee690).

Editor V2's **Publish live website** dialog now offers a GitHub sign-in handoff before the existing direct-token form. The owner can prepare exact HTML from the same verified GitHub source and patch assembler used by **Verified live preview** and the direct live-publishing operation. The workflow:

- Requires a saved, unconflicted original-layout draft; rejects malformed storage, a source fallback, stale GitHub source and no-op changes.
- Checks that neither the page nor the draft changes while preparing HTML.
- Makes the full verified page available to **Copy verified page HTML** and **Download verified HTML**, and links directly to that page in the GitHub repository.
- Uses GitHub.com's normal authenticated file editing for the final owner review, replace-all paste and commit/proposal. No GitHub credential is entered in the Editor V2 handoff.
- Makes **no GitHub write request**, does not automatically publish and does not claim success until the owner makes a commit in GitHub. A later GitHub change remains possible after preparation; the owner must recheck the GitHub file and review the diff.
- If browser clipboard access is denied, leaves the prepared verified HTML available for download rather than losing the result.
- Does not alter or disable the historical direct-token route; its trust-boundary warning remains visible.

This provides a safer credential-free route for occasional publishing without configuring a separate backend. It requires an extra review and manual paste/commit. A fully isolated, seamless one-click owner-authenticated publisher would require a separately deployed, carefully reviewed publishing service.

## Browser verification

Four new source-faithful Playwright cases use actual current website page HTML and intercept all GitHub REST writes:

1. Prepare Contact HTML and compare both downloaded and clipboard-copied contents byte-for-byte with Verified Live Preview, with no token or GitHub PUT.
2. Reject a newer locally stored Research draft and preserve the other tab's saved bytes without GitHub PUT.
3. Reject a changed GitHub Contact source before preparing the handoff; no write request or misleading ready state.
4. Simulate browser clipboard permission denial and verify that the prepared file remains downloadable.

[Initial branch run 41844502838](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41844502838) passed **102/102 cases in Chromium, Firefox and WebKit** before the clipboard-denial test was added. The [final branch run 41844706677](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41844706677) passed **103/103 in each engine (309/309 total)**; the independent advanced Canvas, editor and accessibility checks also passed. The [post-merge run 41845353113](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41845353113) passed **103/103 in each engine** at the merged source revision.

The PR altered only `editor-v2.js`, `editor-v2.html`, `editor-v2.css` and the real-page browser test. No academic prose, site page HTML or original photo asset was edited.

## Production delivery and caution

The first [public HTTPS byte-verification run 41845353211](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41845353211) failed **19/22 exact resource comparisons** because `editor-v2.css`, `editor-v2.html` and `editor-v2.js` were still delivered at their previous revisions. The 17 academic pages and two other resources matched. Multiple Pages builds were cancelled when other automated workflows committed generated audit-result JSON. This is a real deployment evidence mismatch at the checked time, not a proof that the changed code is already served. The initial [deployed browser smoke 41845353072](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41845353072) passed in three engines, but preceded exact delivery confirmation, so it does not independently prove execution of the new interface.

After [successful Pages deployment 41846620503](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41846620503), **attempt 2 of [delivery run 41845353211](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41845353211) passed 22/22 exact HTTPS byte comparisons on its first round** with no failed resources. This establishes that the v67 editor HTML, CSS and JS have reached the checked public URLs. A separately rerun deployed-browser smoke after byte confirmation is additional runtime evidence, not a substitute for this byte comparison.

## Outstanding assurance

No real GitHub owner sign-in, actual final owner commit from this handoff, securely isolated one-click publication, physical mobile/tablet device testing or independent security penetration test was completed. These remain distinct from the browser regression result.

**Next checkpoint C-RV29ev:** evaluate credential-isolation architecture for a future owner-authorized one-click publisher, and pursue physical-device review or bounded public academic-content checks independently. A real owner-authenticated commit from the new GitHub.com handoff remains outside the verified tier; do not request private credentials in chat. Preserve the historical 19/22 Pages failure and subsequent 22/22 success.
