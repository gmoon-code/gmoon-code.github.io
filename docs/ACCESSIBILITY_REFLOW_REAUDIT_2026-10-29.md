# Public site accessibility and CSS reflow | Stage S4 | 29 October 2026

## Continuation and preserved checks

S4 continues the already verified nineteen-route public HTML link graph (S1), external resource and DOI availability checks (S2), and research metadata checks (S3). The complete individual page audits for Research R1–R4, Teaching T1–T5, Projects P2/P3, Interests I1, Pungmul I2, Contact C1, CV1, and utility U1 are preserved. S4 addresses a distinct outstanding condition: **reflow at narrow CSS viewports and automated accessibility tests for the current shared public design**. It does not restart earlier print or scientific-source reviews.

The 19 public HTML routes include a legacy `about.html` meta-refresh to Contact. Its browser redirect, keyboard fallback and no-script simulated link were separately verified in U1; the current S4 scan therefore includes **18 directly readable pages** (including the intentional `404.html` page) rather than misreporting a duplicate Contact scan as an About-page accessibility check. Editor and development-tool pages are outside this visitor-facing stage.

## Repeatable browser and accessibility testing

- Added `scripts/audit-site-reflow.py` and `.github/workflows/audit-site-reflow.yml`. Uses actual local published HTML/CSS/JS in headless Chromium, a pinned `axe-core@4.14.0` script, and captures readable page screenshots, full per-case data and a compact report.
- Tests **320px, 640px and 1280px CSS viewport widths** on each of 18 pages (**54 cases**). The 320/640 widths are useful **CSS-viewport approximations of 400%/200% zoom on an original 1280px desktop window**, respectively. They establish responsive reflow constraints, **not literal Ctrl+plus page zoom** or verification in a physical zoomed browser. Do not conflate the two in public claims.
- Checks current page loading, a main landmark and one H1, seven-link navigation and skip link, scroll width, reader text extending horizontally beyond the viewport, text clipping, sequential first keyboard Tab to skip, and activation moving focus to main. Intentionally horizontally scrollable tables are exempted only from per-text-element horizontal geometry, not from whole-page overflow.
- Runs **36 axe scans** at 320 and 1280px across all 18 direct pages, covering automated WCAG 2.0/2.1/2.2 A/AA and best-practice rules. Runs an additional **five dark-mode axe scans** at 320px on Home, Research, CV, AP Biology and 404, testing that the appearance selector activates dark mode. This is **41 automated axe runs total**, not 41 pages. Automated axe passes do **not** prove overall WCAG compliance.

## Confirmed defect and production correction

The first actual S4 run **40856945375** evaluated all **54 width combinations with zero structural reflow or keyboard failures**. Its axe diagnostics found **one genuine dark-mode violation on `teaching-ap-biology.html`** with five affected text nodes:

- The short mechanism statement under **Bentazon inhibits electron transfer at photosystem II** had foreground **#423942** on dark **#1c1c1c**, contrast only **1.53:1**, below 4.5:1.
- Four evidence-sequence step numbers **01–04** used foreground **#805e7c** on **#0f0f0f**, each measured **3.47:1**, also below 4.5:1.

These were legacy fixed light-only ink colours in `styles-20261013.css`, inadequately overridden by the new dark appearance surface. Added two **page-scoped** rules in `appearance.css` at production commit **16c88f0**: dark `.teaching-bio-case .bio-mechanism-start span` and result explanatory paragraphs now use `var(--moon-ink)`; dark `.teaching-bio-case .teaching-step-code` uses `var(--moon-muted)`. Neither light theme nor other pages' styles, research prose, research counts, diagram labelling or page layout were changed. In `teaching-ap-biology.html`, updated only the CSS query cache key to `appearance.css?v=20261029-bio-dark-contrast` (commit **ab93df0**) so existing public visitor caches receive the correction.

## Verification sequence, including infrastructure-only issue

1. Initial run **40856945375** had **one failed case**, the five genuine AP Biology dark colour-contrast nodes noted above. All 54 reflow/keyboard assertions passed.
2. Correction runner **40857395846** at CSS commit **16c88f0** returned **zero failed cases and zero axe violations**, with 54 reflow checks, 36 standard axe scans and five dark-mode scans; entire workflow outcome success.
3. Another runner **40857402993**, at the subsequent page CSS-cache-key commit **ab93df0**, **also passed every browser test** but was marked failed by a *post-test publication conflict*: two concurrent workflows tried to rebase their machine-readable `docs/ACCESSIBILITY_REFLOW_LATEST_RESULTS.json` commits against one another. Its artifact/log proves the tests passed, but the overall workflow must not be labelled successful.
4. Updated the S4 workflow to publish the completed report using a **conflict-safe fetch/reset/retry procedure** and to preserve a report from a later run rather than overwriting it with an older one (commit **b466326**). No visitor-facing change accompanied this infrastructure repair.
5. **Final run [40857764278](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40857764278)** completed successfully with job outcome **success**, test exit code **0** and artifact **12889818158** (`s4-public-reflow-evidence`). Exact test/workflow head commit is **b46632637811851100966c8eae821a5fa12b473e**. Machine-readable result `docs/ACCESSIBILITY_REFLOW_LATEST_RESULTS.json` records **54 cases, 36 standard axe scans, five dark-mode scans, zero failed cases, empty axe violation-rule list and empty failure list**. Its artifact includes full per-viewport data, screenshot evidence and the raw log. The earlier responsive screenshots were also assembled into a contact sheet and inspected for narrow-page reading flow, CV, research, project cards, photography and site utility routes.

The final success is a bounded automated accessibility and viewport regression. The verified website issue is fixed, the test infrastructure is stable, and no unrelated production page was modified.

## Important limits and precise next work

- A narrow CSS viewport is not the same as testing **native desktop browser Ctrl+plus zoom**. Text-only zoom preferences, large user-set font sizes, browser magnification and high OS display scaling were not directly controlled in this stage.
- Automated axe checks find a subset of WCAG issues. They do not independently certify full spoken screen-reader order, landmarks/announcements, every visible state/disclosure, image interpretive sufficiency, touch gestures, high-contrast forced-colour mode or cross-browser support.
- This S4 run used headless Chromium, not independent Firefox/WebKit/Safari. JavaScript-generated application/editor content, whose purpose differs from the visitor-facing academic portfolio, remains a separate already tracked body of work.
- The above exclusions are **open follow-up verification**, not known website defects.

**Stage S4 completed.** Next defensible public visitor-facing stage **S5** is a bounded browser-engine/actual zoom and keyboard-focus/forced-colour regression, reusing the existing public page list, preserving completed S1–S4 and individual page audits. Prioritize confirmed real-site problems over tester-only incompatibilities and document each engine/state tested without universal accessibility claims.
