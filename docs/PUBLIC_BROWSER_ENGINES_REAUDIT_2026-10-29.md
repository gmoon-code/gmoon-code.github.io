# Public visitor browser engines, forced colours and focus | Stage S5 | 29 October 2026

## Continuity and exact scope

Stage S5 continues after the completed individual public-page visitor audits and cross-page S1 internal links, S2 remote resource availability, S3 scholarly metadata and S4 Chromium axe/reflow checks. The legacy `about.html` redirect was already audited under utility U1 and is excluded from the S5 **18 directly readable route** scan rather than counted as an independent full Contact page. Editor routes and separately deployed academic apps remain outside this public-site visitor-surface regression.

The new `scripts/audit-public-browser-engines.py` and `.github/workflows/audit-public-browser-engines.yml` provide repeatable current-source checks using **Playwright 1.57.0**, running headless **Chromium, Firefox and WebKit** on the Linux GitHub Actions runner. These browser engines are distinct, but the Linux WebKit engine is **not** native Safari on macOS/iOS.

## What was independently tested

- **108 normal page/viewport combinations:** 18 pages × 2 CSS widths (**320px and 1280px**) × 3 browser engines. Tests confirmed page HTTP 200, one main landmark and H1, seven primary navigation links, zero page-level horizontal scrolling, no reading text extending outside the viewport and no clipped reading text in measured DOM, correct **nine-step keyboard Tab sequence** from Skip to content through the brand and seven site-navigation links, on-screen focus and a computed keyboard-focus outline, and real Enter activation of the skip link moving DOM focus to `#main`. A deliberate horizontal-scroll container is exempted only from the per-child reading bounds, not from document-wide horizontal overflow.
- **18 forced-colour samples:** six representative pages (**Home, Research, Action Research, AP Biology, Interests and CV**) × three browser engines at 320px. Playwright's `forced_colors="active"` was recognized in all 18 cases, with no reported overflow, text-boundary, landmark, keyboard-focus outline or skip-link failures. No unavailable forced-colour emulation was misreported as a test pass.
- Inspected a **12-image contact sheet** of forced-colour screenshots from all three engines for Home, Research, AP Biology and CV. The visible portions of headings, reader text, links and controls remained legible. The engines differed in system accent colours, including some cyan highlight accents in WebKit. Screenshot inspection covered viewport captures, **not** every scroll position or every possible system colour configuration.
- **Nine headless browser zoom probes:** on Home, Research and CV for each engine, three `Control+Equal` inputs were sent per page, comparing actual `innerWidth`, `devicePixelRatio` and `visualViewport.scale` before and after. **None of the nine showed an observable change.** Therefore these runs **do not verify native browser Ctrl+plus zoom**. The completed S4 narrow CSS viewport tests separately give an approximation of 200%/400% reflow on a 1280px original viewport; those are not direct browser-zoom certification.

## Initial diagnostic and test-only correction

- First workflow **[40860787861](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40860787861)** produced **108 regular cases, 18 forced-colour cases and nine zoom probes**. All pages passed geometry and clipping; all forced-colour cases passed. **Six normal cases** were flagged for a `404.html` keyboard-order mismatch, one for each combination of two widths and three engines.
- The actual `404.html` production header intentionally uses the **root-relative** brand and navigation destinations `/`, `/research.html`, `/projects.html`, etc. instead of the `index.html` and plain relative href strings used on ordinary pages. S1 and utility U1 already recognized the 404 route as valid. Every reported mismatch was the *test assuming the normal relative href string*, not a missing or misfocused link.
- Corrected **only the S5 test** to expect root-relative paths on the 404 route, while maintaining the precise nine-step focus checks on all other pages. Production `404.html` and every shared stylesheet, script, and public page remained unchanged. Correction commit **d8af333511d6b2e1b19a193c3bcfb5622969651c**.

## Final verified run

**[GitHub Actions run 40861057367](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40861057367)** at exact source/test commit `d8af333511d6b2e1b19a193c3bcfb5622969651c` completed **successfully**, with browser-check exit code **0** and a successful evidence-publication/upload job. Full artifact **12892120539**, named `s5-public-cross-engine-evidence`. Compact record `docs/PUBLIC_BROWSER_ENGINES_LATEST_RESULTS.json`.

- **All 3 browser engines installed and tested**
- **108/108 normal reflow/keyboard cases passed**
- **18/18 forced-colour cases passed**, 0 unsupported simulations
- **0 unresolved test failures**, 0 observed document overflow or detected clipped reader content in tested cases
- **9 zoom probes attempted, 0 observable native zoom changes**; native zoom remains **unverified**, not a pass.

No actual S5 visitor-facing defect was confirmed. No production page modifications were justified or introduced during this stage.

## Remaining work and limits

The pass is bounded to Chromium/Firefox/WebKit browser engines provided by Playwright on **Linux**, the specified CSS widths and selected forced-colour page states. It is not a substitute for physical Windows high-contrast themes, macOS Safari/iOS Safari, Firefox running with user-specific fonts, keyboard-only review with assistive technologies, native Ctrl+plus desktop browser zoom, arbitrary text-only zoom, OS display scaling, or spoken screen-reader checks. A computed focus outline and successful keyboard activation alone do not establish all WCAG criteria. The legacy About redirect and project application behaviour belong to their existing separate audit records.

**Stage S5 completed for three-engine responsive/keyboard and selected forced-colour testing.** The next bounded site-wide public-stage **S6** should examine **text-only magnification and WCAG 1.4.12 increased line/letter/word-spacing resilience** across the current page content, again distinguishing programmatic CSS transformations from real browser preference settings. Physical Safari/Windows contrast and actual browser-UI zoom remain transparent manual follow-ups rather than silently certified capabilities.
