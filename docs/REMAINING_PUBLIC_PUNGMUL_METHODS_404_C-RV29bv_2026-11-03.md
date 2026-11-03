# C-RV29bv | Final three ordinary public-reader routes and real custom 404 behaviour

**Date** 3 November 2026. **Continued from** C-RV29bu. **Read-only production scope** `pungmul.html`, `research-methods-studio.html`, `404.html` and an intentionally nonexistent nested GitHub Pages URL.

## Independent production Chromium run

Adapted the same real HTTPS Playwright Chromium probe to fetch the actual public HTML and compare each page's normalized static `main` text with checked GitHub source. Opened all three at **390 px and 1280 px**, checked visible reading elements, expected one `main` and `h1`, seven navigation links, stylesheets, source image decoding, in-page links, page horizontal overflow and skip-link focus. Clicked real Interest → Pungmul and Projects → Research Methods Studio links. Opened the in-main Methods Studio technical documentation disclosure on both screens.

The recorded [run 41611872141](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611872141) at source commit `a11b90e6cce81dc00c48a346439844e6ac09ab65` **completed successfully** with

- **3 of 3** public academic source-to-served main text matches
- **6 of 6** public Chromium page-and-width cases passed
- **2 of 2** clicked public hub links navigating to intended routes
- **One** Research Methods Studio expandable guidance/release panel opened at each width
- No errors under the probe's explicitly defined conditions

Evidence report JSON and six full-page screenshot PNGs were saved in [artifact 13218668554](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611872141/artifacts/13218668554). Downloaded and inspected their JSON and representative top/middle/bottom screenshot crops at mobile width.

## Pungmul photo delivery and layout

The public `pungmul.html` page serves **five distinct local images** with recorded source widths **1280, 1400, 1100, 1400 and 1400 pixels**. All five loaded and decoded in real Chromium at both viewport widths. The sampled mobile screenshot displayed the rounded image cards, photographic content, captions and intact explanatory sections. No obvious serious stretching, overlapping prose or missing-image state was seen in those sampled sections. This is direct production visual spot evidence of the intended Pungmul page, though not a human audit of every pixel.

## Methods Studio delivery

The independent `research-methods-studio.html` content page serves the local `research-methods-data-lab.webp` image, which decoded at **1280 natural pixels**. In-page sections, documented example, references and privacy/implementation prose were included in the static-delivery and reading checks. The technical disclosure “Guidance releases, validation, and recovery” was tested in both viewports and opened correctly.

The page's embedded live application preview and its separate `research-methods` application were **not operated**, because that could change separate application state and requires its own scoped verification. Successful delivery of the descriptive page does not establish the complete functioning, scientific correctness or data handling of the external application.

## Real nested 404 route

The public test deliberately navigated to
`https://gmoon-code.github.io/missing/c-rv29bv-unmatched-reader-route`.

The actual HTTP response was **404**. Chromium displayed `main h1` as **“Page not found”**, found the `Return home` link with `href="/"`, clicked it, and arrived at **`https://gmoon-code.github.io/`**. This confirms the deployed custom not-found document and recovery link for that tested nested path. A direct request to `404.html` was also checked separately for source-to-served text and responsive rendering.

## Source-version verification

Exact GitHub file fetches at the tested head and the latest default branch matched for all three route blobs and probe script blob, **4/4 exact Git SHA matches**.

- `pungmul.html` `8caa993edac9304e6d1c9829b3084680b4ede135`
- `research-methods-studio.html` `d77c8d4eb1222cb57f3cf88b41eebde09d4e6c03`
- `404.html` `361512d3e77f05f36d2701d1201561b039469df8`
- `scripts/audit-public-research-reader.py` `cd36d1a0c2a5919f4fdfafcbc59fcd8f7c77e5fe`

No public page text, image asset, page CSS or research-data claims were edited during this stage.

## Four-stage reader coverage reconciliation

The prior S5 ordinary public-reader route inventory contains **18** listed pages. These four stages, independently run against the live GitHub Pages origin, cover all 18 at both 390 px and 1280 px.

| Stage | Exact live HTTPS Chromium run | Distinct routes | Page-width cases | Source comparisons |
| --- | --- | --- | --- | --- |
| C-RV29bs | 41609393314 | 5 | 10 passed | 5 matched |
| C-RV29bt | 41610630883 | 5 | 10 passed | 5 matched |
| C-RV29bu | 41611139010 | 5 | 10 passed | 5 matched |
| C-RV29bv | 41611872141 | 3 | 6 passed | 3 matched |
| **Total** | **Four independent runs** | **18** | **36 passed** | **18 matched** |

All four runs have passed under their defined checked source revisions, and all tested academic route blobs were separately found to match their then-current default branch versions. They were **not a simultaneous single-commit production browser matrix**.

The narrower reader tests do not prove visually exact parity or good accessibility in every mode or device. They also do not verify the eight other ordinary/legacy/supplementary website routes outside this S5 list, nor research ethics, authentic student-work source history, final August scoping matrices or complete publisher full-text readings.

## Exact next checkpoint

**C-RV29bw | Reconcile live supplementary site routes and evidence limitations.** Begin with the legacy `about.html` route and supplemental editor/studio/research-tool routes in the established 26-HTML inventory. Establish which have still-usable public browser checks and which have not been covered by the 18-route academic reader probe. Check rendered delivery and any genuinely substantive page copy before promoting a route's status, while preserving permissions, original student records, final August scoping data, 53-source tier register and physical accessibility checks as separate unresolved work.
