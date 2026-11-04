# C-RV29em | Editor V2 editing, live-publication and deployed-site functional verification

**Date:** 4 November 2026  
**Continued from:** [C-RV29el](EDITOR_V2_HOME_CONTACT_SCRIPTED_PARITY_C-RV29el_2026-11-04.md) and [C-RV29ek](EDITOR_V2_TOKEN_ISOLATION_C-RV29ek_2026-11-04.md)  
**Priority:** Make the real 17-page editor straightforward and dependable for editing, saving, previewing, undoing and publishing, without claiming credential-isolation or an authenticated owner publication that was not attempted.

## Confirmed and expanded browser evidence

The original current-site suite covered preview of every editable page and a smaller publication sample. This stage expanded tests in `tests/editor-v2-current-website.spec.cjs` to include:

- All **17 current editable HTML pages** loaded from actual GitHub checkout bytes, with source-faithful mocked GitHub Contents responses.
- Visible appearance edits and **exact preview-to-PUT HTML equality for all 17 pages**. The browser intercepts any GitHub writes; the accepted PUT is an isolated mock, not a real publication.
- Paragraph-content editing, local saving, verified preview and reload recovery on **all 17 pages**.
- Two sequential mocked live publications in the same editor tab, retaining the first appearance edit while saving a later text edit; an intervening attempt to publish an unchanged retained draft must not send another PUT.
- A separate same-heading edit followed by a second publication, ensuring a new appearance change can override the earlier one without reverting the original.
- Existing responsive Home and Contact photo comparisons, Pungmul crop persistence, simulated conflicts and publication safeguards.
- GitHub rejection simulations for **401**, **403**, **409**, **422**, and stale-source checks. Failed requests preserve the local draft and do not create a false publication success.
- The deployed-page image-library request deliberately finishing after verified GitHub loading. Its stale assets must not replace verified GitHub image choices.
- Clear mode-specific labels for actual live publication versus the staging-only Free Design Canvas.

[Cross-engine run 41800049730](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41800049730) passed **75/75 in Chromium, 75/75 in Firefox and 75/75 in WebKit**, or **225 engine-level check instances**. This is one 75-case suite executed in three engines, not 225 unrelated feature kinds. The additional same-heading case was contributed after the initial 74/74 run and remained source-faithful.

The supporting existing suites also passed at the updated production editor revision:

- [51/51 source and drag interaction checks](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799559370)
- [55/55 advanced interaction checks](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799559543)
- [19/19 source-parity and insertion checks](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799559221)
- [57/57 academic-editor checks](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799559397)

These are distinct workflows; totals must not be represented as one single authenticated, end-to-end production session.

## Demonstrated defects corrected

**Repeated CSS application after successful publication.** On a second mocked publication of a retained draft, previously committed style rules were being appended again. `refreshLiveLayoutRules` now recognizes when its complete pending rule block already occupies the end of the committed style sheet. The direct publisher also refuses an identical HTML file before making a new Contents API PUT. The repeated-publication tests verify that a genuinely new text edit and a subsequent changed appearance still publish successfully after the first simulated commit. The published draft remains saved for recovery while deployment is pending.

**Source image-library race.** The independently fetched deployed page could respond after the exact GitHub source and overwrite the verified image library with outdated assets. `loadPageImageLibrary` now leaves source-verified images untouched in Live Website mode. The test reproduces the delay with intentionally different deployed-page HTML and confirms the source image options remain correct. The old occasional asset-library source-parity regression is superseded by successful current runs.

**Misleading error on HTTP 422.** Validation failure is no longer described categorically as a concurrent source conflict. The error now states that GitHub rejected the update and explains the possible request-validation or changed-file causes, without claiming a publication succeeded.

**Ambiguous top-level publishing label.** `setWorkspaceMode` now labels the actual source editing workflow `Verified live preview` and `Publish live website`. The independent canvas uses `Canvas preview` and `Publish staging preview`, accurately conveying that it cannot replace the public page.

**Potential stale editor JavaScript in return visits.** The public editor HTML asset query keys for its JavaScript and CSS were advanced to `20261104-editor-v2-publish-audit-v53`, allowing browsers to fetch the updated files instead of continuing to use the previous fixed-version URL.

## Actual public GitHub Pages delivery

A read-only [deployment-byte workflow](https://github.com/gmoon-code/gmoon-code.github.io/blob/main/.github/workflows/editor-v2-public-delivery.yml) now checks the HTTPS contents of all **17 editable page files**, `editor-v2.html`, `editor-v2.js`, `editor-v2.css`, `moon-free-responsive.js`, and `responsive-personal-media.js`. It does not use a token or publish anything.

- [Run 41799017719](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799017719) passed **22/22 exact public byte comparisons** before the final editor asset-version bump.
- [Run 41799559368](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799559368) found a **temporary but genuine 21/22 mismatch** after that bump; the public `editor-v2.html` still differed even after repeated fetches. The evidence remains recorded and is not rewritten as a success.
- [Latest corrective verification, run 41800081550](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41800081550), passed **22/22 exact public byte comparisons on the first round**, including the updated editor HTML. The mismatch had resolved after deployment.

A separate [actual HTTPS-deployed editor browser workflow](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41799559341) passed **3/3 Home, Research and Contact smoke cases per Chromium, Firefox and WebKit, 9/9 total**. The editor and its first-party JS/CSS were loaded from the real public URL, while the GitHub Contents GET data were mocked from the exact repository HTML so no public API rate limits or mutation were needed. In each engine the tests edited a heading, saved a local draft, previewed it and recovered the draft after reload. All GitHub PUT/other writes were blocked.

The delivered-source byte tests and HTTPS browser smoke tests answer different questions. Together, they support current public delivery and representative use, but do not establish owner-authorized publication or physical-device behaviour.

## Explicit remaining limits

- **Not performed:** real owner-token GitHub Contents API publication, an authenticated staging-to-live owner acceptance test, subsequent real GitHub Pages deployment of a user-authored edit, or physical iPhone/Android/Safari accessibility testing.
- **Known trust boundary:** the editor uses a user-supplied fine-grained GitHub PAT on the same origin where first-party page scripts run. A compromised script could access an entered token. A separate-origin authenticated publisher remains a distinct future architecture; see [C-RV29ek](EDITOR_V2_TOKEN_ISOLATION_C-RV29ek_2026-11-04.md). The publishing form discloses this risk.
- The editor supports the specifically implemented source-preserving text, images, appearances, positions, deletions and additions on the **17 configured routes**. It is not a guarantee that arbitrary HTML restructuring, unbounded image assets or every browser-specific interaction can be published safely.
- The public website, Editor V2 code and photos were not edited for scholarly content in this stage. No private student data, original unpublished research records, real PAT or GitHub live PUT was used.

## Checkpoint

**C-RV29em complete at the documented browser and HTTP evidence tier.** Current source-matched publishing simulation and real public-editor smoke tests pass; the directly authenticated live publishing boundary remains explicitly unverified. Existing scholarly content-audit decisions and the user's original prose are preserved.

**Next checkpoint C-RV29en.** Focus on remaining complex edit operations and the clarity of their review/publish messages, especially source-image replacements, deletions, cross-device appearance edits and draft recovery following a page switch. Do not request or use owner credentials. If a genuine new regression appears, fix and test it before claiming coverage. A real owner-authenticated publication requires separate explicit authorization and secure credential entry by the owner.
