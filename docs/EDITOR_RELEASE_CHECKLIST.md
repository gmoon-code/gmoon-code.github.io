# GitHub Pages editor rollout checklist

This is the pre-release checklist for the three separate website editors. The directory at `/editors.html` and the individual `/editor.html` entry points are included only on their respective **unmerged draft branches** until an explicit release decision.

## Intended browser addresses

| Website | Browser address | Draft PR | Saving and publication |
| --- | --- | --- | --- |
| Ye Eun Moon | `https://gmoon-code.github.io/editor.html` | [academic website PR #1](https://github.com/gmoon-code/gmoon-code.github.io/pull/1) | Local browser drafts; HTML export; private publisher configuration remains disabled unless separately authorised |
| Research Methods Studio | `https://gmoon-code.github.io/research-methods/editor.html` | [Research Methods PR #10](https://github.com/gmoon-code/research-methods/pull/10) | Real teacher sign-in; only validated stage guidance can reach the separate authenticated publication service; the other review areas export proposals |
| AP Biology Story Method | `https://gmoon-code.github.io/memory-palace-u1-8/editor.html` | [Story Method PR #7](https://github.com/gmoon-code/memory-palace-u1-8/pull/7) | Local browser drafts; reviewed narrative JSON export; no direct student-facing publication |
| Editor directory | `https://gmoon-code.github.io/editors.html` | Academic website PR #1 | Navigation only; no authentication or write authority |

The directory is a public static page. The academic and narrative editor interfaces themselves are also public static files, although their work is local to the browser. A `noindex` directive does not create a security boundary. The Research Methods Studio editor must continue to enforce real administrator verification and separate server-side permissions.

## Cross-site integration preflight

The [Cross-site GitHub Pages editor preflight](https://github.com/gmoon-code/gmoon-code.github.io/actions/workflows/editor-pages-preflight.yml) checks out the latest draft branches of all three repositories into **one temporary test server**. It builds the same filtered Memory Palace Pages artifact as the production deployment workflow and serves Research Methods Studio at its planned `/research-methods/` path.

Chromium follows all three links from `/editors.html`. It verifies that the academic editor opens and cannot publish without a configured private publisher, Research Methods Studio stops a signed-out visitor at the existing password page, an isolated simulated teacher session reaches Content Studio, and the Story Method narrative editor loads its released journey JSON. External network requests are blocked during this test, and desktop/mobile directory screenshots are retained as GitHub Actions artifacts.

This workflow uses `contents: read` and contains **no GitHub Pages deployment action**. It never tests a live administrator credential or authorises a production release. When either of the other repositories changes after this workflow has passed, rerun the workflow manually against the current draft branches. Always inspect the three printed checkout commit identifiers to confirm which revisions were tested.

## Before release approval

1. Confirm all three pull requests remain unmerged during this review.
2. Review the exact diff of each pull request and run its current browser and regression suites. An earlier passing run does not cover later commits.
3. Review the academic editor's exported HTML against the original site and verify that publisher actions fail closed while `editor-publisher-config.js` has no private service configured.
4. Validate the Story Method build artifact. The student course remains frozen at eight released units, 58 guided journeys and 448 scenes, and the editor is included only as the static `/editor.html` shortcut and the three files in `/authoring/`. No privileged Admin API or server file is copied into the Pages build.
5. Confirm Research Methods Studio's `editor.html` leads through `teacher.html` and requires the existing signed teacher session before displaying Content Studio. Review the v3 publication boundary and allowlisted CORS origin. Never store teacher codes or backend secrets in GitHub Pages.
6. Obtain explicit approval for each release. GitHub Pages deployments must be performed using the repository's existing release path and protections. Do not change the production Pages source to a draft branch or use test credentials in a production browser.

## Controlled launch verification

The three repositories have independent GitHub Pages publication behaviour. Approve and validate their releases individually. Once all intended routes have successfully deployed, visit the directory and click each editor link on both desktop and mobile. A link to a route whose repository has not deployed yet may temporarily return 404.

- Verify each address using a fresh private browsing session. The academic and narrative editors should load their public interfaces without signing in and cannot publish without an authorised separate workflow.
- Verify Research Methods Studio signed-out entry and real signed-in entry with an authorised administrator. The editor bookmark must reach Content Studio after verification, and a user without a valid session must remain excluded.
- Test direct editing, saving, discard prompts, local drafts, exported files and the original student-data/curriculum safeguards.
- Confirm links open in a separate tab from an in-progress editor and that mobile pages have no horizontal overflow.
- Check current production Pages URLs only after the actual deployment reports success. Keep automated preview screenshots and manual acceptance evidence separate.

## Safe rollback

If a deployment exposes a broken editor, restore the last approved Pages deployment using the repository's documented release/rollback process. Do not delete browser drafts or overwrite student curriculum/source data as a shortcut.

The directory, editor shortcuts and their cross-site links are **not** a single authenticated application and do not share sessions or locally saved drafts. Any proposal to add cloud synchronisation, GitHub write access or one-click publishing requires a separate authorisation and security review.
