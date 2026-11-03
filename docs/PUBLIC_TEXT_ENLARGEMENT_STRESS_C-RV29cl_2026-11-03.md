# C-RV29cl | Read-only public 200% CSS text-enlargement stress test

**Date:** 3 November 2026. **Continued from:** [C-RV29ck](ALL_26_HTML_CONTENT_NO_DELTA_C-RV29ck_2026-11-03.md). **Outcome:** All **34/34** tested live public academic-page/width cases passed bounded automated checks with **zero flagged document-width overflow, outside-viewport reader text, or potentially clipped overflow-hidden text**. Limited screenshots reveal some **awkward midword title wrapping** at synthetic 200% text enlargement, but not missing text in sampled regions. **No public HTML, CSS or academic claims were edited.**

## Deployment and source provenance

Independently compared current recursive GitHub source-tree blobs against the successful complete-route Chromium test baseline `c4e9044a618d284b39a8ae18291c0a66d833dac4`, broadening the previous [C-RV29ck](ALL_26_HTML_CONTENT_NO_DELTA_C-RV29ck_2026-11-03.md) HTML-only comparison to **production HTML, CSS, JavaScript, media and other deployed assets**. No production changes, additions or removals were found. Changes since that base were audit documentation and new read-only test scripts/workflows, not page content.

Built a separate test script `scripts/audit-public-text-enlargement.py` (Git blob `854e0eedab672f155b11d8be34c148e04737a671`) and workflow `.github/workflows/audit-public-text-enlargement.yml` to load the **real HTTPS GitHub Pages website** in Playwright Chromium on GitHub Actions Linux. The workflow does not modify the deployed website or any private research material.

[GitHub Actions run 41632877001](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41632877001), source commit `3b351a964b5fd9f413f9ac5d4b8adfd4731a5d3b`, job `125906606367`, **completed successfully**, recording **34 cases, 34 passes, 0 failures**. It uploaded full report JSON and eight selected mobile full-page screenshots as [artifact 13229181207](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41632877001/artifacts/13229181207).

## Method and exact limitations

This test **does not assert native Chrome page zoom**. The existing [three-engine report](PUBLIC_BROWSER_ENGINES_LATEST_RESULTS.json) explicitly recorded that keyboard shortcuts in headless Chromium/Firefox/WebKit did not produce observable browser-zoom changes. Instead, the current probe compares baseline layout with an intentionally **simulated 200% text enlargement** on the same public page.

For each visible text-bearing DOM element, the script calculates its original computed CSS font size, then writes twice that size as an inline CSS declaration in the audit browser only. It does not scale the image sizes or alter the public source. The probe checks

- `document.documentElement.scrollWidth` before and after scaling against the viewport width
- bounded reader text positions for headings, paragraphs, list items, citations, table structures and links
- potentially clipped text within overflow-hidden containers
- one main landmark and one primary title
- intentionally horizontally scrollable instructional tables as exceptions to blanket outside-viewport text checks

Screenshots preserve the actual synthetic rendering state and can reveal issues the numeric checks cannot detect. This is an **accessibility-related stress test**, not a demonstrated user-controlled native zoom test, WCAG 1.4.4 certification, 400% reflow certification, a comprehensive screen-reader audit or proof that all text enlargement modes work.

## Coverage and findings

The **17 academically substantive reader routes** were checked independently at **390 CSS px and 1280 CSS px** under doubled text font sizes. They include Research, Action Research, Scoping Review, the Biological Classification essay, AP Biology, AP Chemistry, AP Evolution, Osmosis practice, Projects, Story Method, Home, Teaching, Interests, Contact, CV, Pungmul, and Research Methods Studio.

- **390 px:** 17/17 passed. Document width stayed **390 CSS px** for every page, with zero flagged reader-text boxes outside the viewport and zero flagged overflow-hidden text clipping.
- **1280 px:** 17/17 passed the same automated constraints.
- **Sampled visual evidence:** Examined top, middle and bottom crops from **eight actual 390-px screenshots** covering Research, Action Research, Scoping Review, AP Chemistry, AP Evolution, Interests, Pungmul and CV. All eight visibly show the intended reading content with paragraphs, figures where applicable and site recovery/footer links. None of the sampled regions shows an obviously lost page section or grotesque text overlap. However, particularly long title words such as the Action Research and AP Chemistry headings break **within words** at the synthetic text size. This is a **typographic refinement opportunity**, not an automatically diagnosed functional failure, and a synthetic stress alone does not warrant changing the stable live styles.
- **Page length:** Some full-page screenshots become extremely tall after scaling (e.g., Research nearly 90,000 px high). Their existence demonstrates successful capture and scrolling in this run, not ease of navigation for every reader.

The JSON `report.json` retains the actual baseline/scaled widths, number of scaled text elements, clipping candidates and error arrays for every combination. Each page had **0** reported errors.

## Interpretation and editorial decision

The new evidence extends earlier public-origin **normal-font** viewport checks with a different CSS text-magnification condition. It reduces concern about gross horizontal clipping when CSS text grows, but leaves **real browser zoom, text-only zoom settings, physical devices, assistive technology, text-height collision, keyboard focus under enlargement, expanded disclosure content and actual scholarly content provenance** incompletely tested.

**No academic prose, references, page layout or production style was modified.** The source code changes are restricted to the separate read-only test script and its CI workflow. The final-August scoping 20-row charting originals, original student responses, historical permissions, author-specific transformations and independent coding logs remain separate source-level blockers.

## Exact next checkpoint

**C-RV29cm | Keyboard and expanded-content interaction under text magnification.** Independently test skip-link focus, site navigation, the Scoping Review's source-list disclosure, the Osmosis/Story Method disclosures and four horizontally scrollable scientific tables while text is enlarged on actual public HTTPS pages. Recalculate document bounds **after opening** disclosures, rather than assuming a collapsed panel's contents were readable. Maintain the distinction between CSS simulation and true browser zoom, and inspect failures before altering production layout.
