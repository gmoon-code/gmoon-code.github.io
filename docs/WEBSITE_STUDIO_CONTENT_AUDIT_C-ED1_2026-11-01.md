# Website Studio author-facing content audit | C-ED1

Date 1 November 2026. Continued after Connection Studio C-CS2 within the renewed comprehensive academic website content audit.

## Scope

Examined the source text in `studio/index.html`, token and publication implementation in `studio/studio.js`, additional permission checking in `studio/studio-access.js` and the `studio/pages.json` listing. This stage checks accuracy of instructions about authorization, publishing, token storage and available pages. It is content-only, not a visual, editor functionality or accessibility redesign.

## Findings and justified changes

The login introduction said `Only your GitHub account can publish edits to this website`. The actual implementation authenticates via an access token and checks write access to `gmoon-code/gmoon-code.github.io`. A suitably authorized token is the operative requirement; the wording risked overstating the role of personal identity. It now states `Publishing requires a GitHub token with write access to this website's repository.`

The optional remembering control promised retention `until I close it`. The implementation uses `sessionStorage`, typically scoped to a tab/session but potentially subject to session restoration. The revised wording says `Remember in this browser tab (trusted devices only)` without an absolute expiry claim.

The form also said the token was used `to verify ownership and save your changes`. The application checks repository access and invokes GitHub API operations; it does not independently determine identity or ownership. The revised explanation says the token is sent to GitHub's API to check repository access and publish changes, and is not added to website files.

All changes were confined to `studio/index.html` in commit [0c5f7f7](https://github.com/gmoon-code/gmoon-code.github.io/commit/0c5f7f73033624befa7bce89e8738905475da796).

## Verification

Re-fetched the committed HTML and source scripts. Nine targeted source and parsing checks passed. The checks covered all three revised claims, conditional browser-tab storage, removal of saved token, GitHub authorization header, separate publishing state and source syntax. These are source-level checks. No real GitHub token was used, and no authenticated publish was attempted.

## Scope inventory warning

The `studio/pages.json` page list has 16 entries, whereas the prior renewed main-site audit covered 19 public/legacy HTML routes. Routes such as `contact.html`, `pungmul.html` and `writing-biological-classification.html` do not currently appear in that editable-page manifest. This is **an inventory discrepancy to investigate**, not a verified bug or an authorization to change published site navigation or editor coverage without examining how routes are created and mapped. The Studio may deliberately expose a subset of pages. No manifest edit was made.

## Limits and exact continuation

Security and privacy claims remain based on accessible source and no live credential test. The complete Word/PowerPoint-like editing interface is outside this content-only stage. Published site parity and browser session behaviour remain unverified. Other `editor-v2.html`, `editor.html`, `editors.html`, `publisher/` and `studio/` help content has not yet received the renewed editorial pass.

**Next Stage C-ED2 | Editor landing pages, publication and claims of editability.** Read `editors.html`, `editor.html`, `editor-v2.html`, and related publisher instructions. Identify which statements refer to actual implemented functionality or account permissions. Cross-reference source modules before editing; preserve the author's clear, uninflated style and record all factual limitations. Then review page manifests and additional user-facing tool instructions.

**Status:** C-ED1 source editorial review and correction completed; 9/9 targeted checks passed. No authenticated or public browser verification.
