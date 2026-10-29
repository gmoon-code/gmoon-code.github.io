# Utility routes visitor-facing audit | 29 October 2026

Stage U1 covers `404.html`, real nested missing paths and the legacy `about.html` redirect. The previous source and browser work is preserved. This audit is limited to public visitor-facing behaviours, not the editor.

## U1.1 | Reconcile already-completed work

- The preceding master editorial ledger had already corrected root-relative paths in `404.html` to handle GitHub Pages requests from deep missing paths, added shared appearance control, and verified a simulated nested 404 screenshot. The ledger documented that real public GitHub Pages nested response, keyboard/dark-state and About redirect/fallback were still partly unverified. This stage did not restart Home/Teaching or repeat unrelated content editing.
- `about.html` was previously source-verified as a deliberate, lightweight, noindexed meta-refresh to Contact. Its canonical points to `https://gmoon-code.github.io/contact.html`, with a visible, keyboard-accessible fallback hyperlink and H1. The page does not duplicate a biography. No About source change was needed.
- `404.html` has a single H1, informative short error message, a primary Return home link, the site's standard seven navigation destinations, and a footer mail link/ORCID/back-to-top. The root-relative site assets and navigation are deliberate because `gmoon-code.github.io` is a user-site root. An error page need not have a current-navigation marker or a canonical location. Its `robots` meta is `noindex, follow`.

## U1.2 | Actual live production checks

- Independent Playwright calls from a GitHub Actions Linux Chromium runner reached `https://gmoon-code.github.io/missing/deep/nothing` and confirmed the actual response **HTTP 404**, with `/missing/deep/nothing` retained as the browser path. This was **not** just the local simulated fallback.
- A separate production request to `https://gmoon-code.github.io/about.html` returned **HTTP 200** and then automatically navigated to `https://gmoon-code.github.io/contact.html` by the HTML meta-refresh, as expected. HTTP 200 for the source About HTML is normal and does **not** mean it was a server-issued 301/302. We tested that the final path is Contact.
- The non-browser `web` retrieval interface was unable to load these pages, so live verification was done instead by the GitHub Actions Chromium runner. The live probe establishes the HTTP status/redirect at the observed time; it does not certify that every future CDN deployment or every nested route behaves identically.

## U1.3 | Verified browser, fallback and print issues and decisions

- Added `scripts/audit-utility-routes-visitor.py` and `.github/workflows/audit-utility-routes-visitor.yml` with a test HTTP server replicating GitHub Pages' custom 404 fallback at a missing nested path while retaining the original URL and **404 response code**. The browser loads the site assets from the root, not from an imagined nested `/missing/deep/` stylesheet directory.
- Initial six-width test confirmed all root-relative nav paths and CSS load, no missing internal anchors, no duplicated IDs, and no text/page horizontal overrun. It exposed inconsistent **404 message-to-footer gaps**: **130px** at 320, 375 and 600px; **158px** at 768px; **173px** at 1024px; and **188px** at 1440px. The original page had its shared `.page` bottom padding plus varying footer margin.
- Fixed only the published `404.html` route by adding `not-found-page` to its main landmark and a tightly scoped late style block setting `#main.not-found-page{padding-bottom:34px}` and `#main.not-found-page+.site-footer{margin-top:36px}`; the print version resets the main bottom padding. This yields **exactly 100px** from the final error message section to the footer at all six tested widths. Updated its appearance stylesheet version to `20261028-visible-focus`. Commit `ea588c5d7e45b6a2e8e2ff092e0001dd615d027b`. The actual error message, home link, site nav and footer wording remain unchanged.
- Actual keyboard Tab lands first on Skip to content; Enter moves to the main landmark. The dark appearance control works at 375px, with a visible keyboard focus outline, readable foreground/background, and a working Back to top link. Mobile and dark screenshots were inspected.
- Real A4 print was produced and independently rendered. The 404 page prints on **one sheet**, with Page not found, explanation and Return home visible, no page clipping or disconnected extra sheet.
- The About meta-refresh was verified to navigate automatically to the actual Contact page. To check its rarely seen fallback behaviour, a separate JavaScript-disabled browser test intercepted **only the About HTML** and suppressed the meta-refresh tag in the test response. The unchanged visible fallback heading, noindex/follow, canonical URL, proper relative Contact link, keyboard focus and activation were all verified. This is a deliberate simulation of refresh being unavailable, not a claim that the browser ordinarily waits on the About page.

## U1.4 | Exact-source evidence and limits

- Final successful GitHub Actions run **`40825886279`** at source/test commit **`90e961ed0e88c5b26350913ae7b0808e1b471eca`** with downloadable artifact **`12876920996`**. Final test count **10 required local checks, zero failures** (six widths, dark/keyboard, automatic About redirect, fallback About link, and one-sheet print), plus two independently successful, informational **live production probes**. The test itself is maintained in the repository.
- Final snapshots include full-page 404 screenshots at 320/375/600/768/1024/1440px, dark 375px, the About fallback screenshot and Contact redirect destination, one printed A4 PDF and its PNG render, exact source files and machine-readable JSON.
- Downloaded the final artifact into the QA environment, read the geometry report and visually inspected a montage of the screenshots and rendered A4 sheet. The final measured footer gap is **100px at all six widths**, actual HTTP 404 response status is recorded for local and live tests, and there is no visual text clipping or unwanted overflow.
- Early runs `40825371838` and `40825517841` were blocked by **test-harness-only** syntax/reporter keyword bugs, rather than a confirmed page regression; these were corrected. The next run `40825637274` located the legitimate footer spacing inconsistency, subsequently repaired and verified. Do not count these early runs as successful.
- Not certified: speech screen-reader announcements, cross-browser Safari/Firefox, every deep path and root-relative asset under custom reverse proxies, future GitHub Pages availability, and the editor save/publish round-trip.

## Status and precise continuation

**Stage U1 complete.** Both visitor-facing utility routes have source consistency and a passing browser check, and the previous real production status uncertainty has been resolved. The `about.html` source itself remains unchanged.

**Next route: CV, `cv.html`**, based on the outstanding master ledger. Previous CV coursework/degree-timeline reconciliation and two-page A4 print correction were completed; do not restart them. The independent final phone/tablet responsive and interactive link/download audit remains outstanding. Recheck the current exact source against the current CV ledger and then independently test browser layouts and print only where the existing evidence does not cover them. Keep the previous P2/P3, Teaching T1–T5, Interests I1, Pungmul I2 and Contact C1 audit records intact.
