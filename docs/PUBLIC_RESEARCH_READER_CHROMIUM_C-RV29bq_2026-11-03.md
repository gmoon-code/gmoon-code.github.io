# C-RV29bq | Public-reader verification for Research and Classroom Action Research

**Date** 3 November 2026. **Scope** `research.html` and `research-action.html`, their checked repository HTML, actual public GitHub Pages HTTPS responses, and a fresh, read-only headless Chromium visit at 390 px and 1280 px.

## Why this stage was necessary

Earlier site checks separately established 16/16 sitemap-page static source-to-served main-text parity. Other Chromium, Firefox and WebKit checks used a local server. Neither result by itself demonstrated that the current public Research pages had successfully loaded styles, image assets, links and reading content in an actual browser navigating to the live HTTPS origin.

The user requests rigorous factual verification. The stage therefore tested the deployed browser experience directly without modifying any academic prose or asserting complete visual inspection.

## Implementation and execution

Created read-only probe `scripts/audit-public-research-reader.py` with workflow `.github/workflows/audit-public-research-reader.yml`.

The first workflow at [41604219452](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41604219452) stopped before contacting the public pages because the new script tried to import an existing hyphenated Python filename as an ordinary module. This was a test-harness import error. The script now loads the unchanged established parity parser with `runpy.run_path()`, committed in [`27ff42ec`](https://github.com/gmoon-code/gmoon-code.github.io/commit/27ff42ec3ccc86131ce6971acf1a4b1263fc3d12).

Fresh [workflow 41604362947](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41604362947), job `125810418080`, **completed successfully** on 3 November 2026. The real GitHub-hosted Chromium runner produced `failedCount: 0` and uploaded report JSON plus four full-page screenshots in [artifact 13215892866](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41604362947/artifacts/13215892866). The screenshots are retained evidence for possible visual inspection. They were **not manually evaluated** in this stage.

## Exact verified findings

| Evidence item | Result |
| --- | --- |
| Public `research.html` normalised static `main` text vs checked source | **Equal** |
| Public `research-action.html` normalised static `main` text vs checked source | **Equal** |
| Research at 390 px and 1280 px, live public HTTPS in Chromium | **Both passes** |
| Classroom Action Research at 390 px and 1280 px | **Both passes** |
| Real public Research link to Classroom Action Research | **Navigated correctly**, ending at `https://gmoon-code.github.io/research-action.html` |
| Visible browser tests | One `main` and one `h1`; seven shared navigation links; no page-level horizontal overflow, protruding heading/body text, unattached stylesheet, missing in-page anchor target or failed image in the two tested page layouts; skip link focused main content |
| Workflow summary | **4/4 browser page-width cases passed**, **2/2 source-to-public main-text comparisons passed**, **1/1 public Research-to-Action link navigation passed** |

The successfully tested current HTML Git blobs are `research.html` **`f083527f1cc0f8d60587133333b15ccc0d994237`** and `research-action.html` **`80277bba0aa0ad715be87865e5a30e609b419147`**. The Chromium probe blob is **`37f37529ca4341b4a97acd62c32c934c92f57854`**. No substantive academic HTML, CSS or JavaScript change was made.

## Limits that remain important

This is a bounded browser-readability and deployed-resource check of two routes and two viewport widths. It does not establish exact screenshot visual parity against a design reference or human visual assessment, physical mobile-device results, browser zoom, screen-reader speech, WCAG conformance, full 26-route browser coverage, correctness of cited scholarly conclusions or authentic research/consent records.

The previous S8 final public release summary at `docs/PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json` had **24/24 deployed byte matches** in its own historical run but an overall **`pass:false`** arising from stale external-resource audit evidence for `research-action.html`. This browser stage does not settle that unrelated external scholarly-link verification issue. An independent external-resource audit is needed after the revised Action Research text.

## Next checkpoint

**C-RV29br | Refresh source-dependent scholarly external-link evidence for the revised Classroom Action Research page.** Read and compare the page's present linked PubMed studies, their citation contexts and the previous external-resource evidence. Verify any claims against primary or credible bibliographic pages, while retaining the historical 42 unverified external-resource outcomes as evidence-limited rather than declaring all links invalid. Make only source-supported wording or reference corrections and record new verification status. In parallel, continue expanding real public-rendered-browser checks beyond these two pages, keeping the original student work, signed permissions, final August scoping rows and full visual accessibility review independently unresolved.
