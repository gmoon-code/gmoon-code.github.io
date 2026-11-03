# C-RV29bx | All 26 present HTML routes and production-check scope reconciled

**Date:** 3 November 2026. **Continued from:** C-RV29bw. **Task:** independently test for omissions or duplicate coverage in the stage-specific live public browser inventories, while preserving distinctions among academic, error, legacy and authoring routes.

## Reproducible inventory reconciliation

Fetched the current recursive Git tree and filtered to actual `.html` blobs. It contains **26 HTML files**. Retrieved the exact tested `PAGES` tuples from the browser scripts at C-RV29bs, bt, bu and bv tested commit references and the exact route mapping from the C-RV29bw supplementary script. The union contains **26 unique paths**, **zero duplicate path assignments**, **zero current-HTML omissions** and **zero paths no longer in the repository**.

| Stage | Test routes | Public verification |
| --- | --- | --- |
| [C-RV29bs](PUBLIC_SCHOLARLY_READER_CHROMIUM_C-RV29bs_2026-11-03.md) | `research.html`, `research-action.html`, `research-scoping.html`, `writing-biological-classification.html`, `teaching-ap-biology.html` | **5/5 public main-text parity; 10/10 two-width Chromium; 4/4 hub navigation** at [run 41609393314](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41609393314) |
| [C-RV29bt](PUBLIC_TEACHING_PROJECT_READER_C-RV29bt_2026-11-03.md) | `teaching-ap-chemistry.html`, `teaching-ap-evolution.html`, `teaching-osmosis-practice.html`, `projects.html`, `story-method.html` | **5/5 main-text parity; 10/10 two-width Chromium; 3/3 links**, separate four-table keyboard checks at [run 41610630883](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41610630883) |
| [C-RV29bu](PUBLIC_CORE_READER_AND_INTEREST_IMAGES_C-RV29bu_2026-11-03.md) | `index.html`, `teaching.html`, `interests.html`, `contact.html`, `cv.html` | **5/5 main-text parity; 10/10 two-width Chromium; 4/4 links** at [run 41611139010](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611139010) |
| [C-RV29bv](PUBLIC_PUNGMUL_METHODS_404_READER_C-RV29bv_2026-11-03.md) | `pungmul.html`, `research-methods-studio.html`, `404.html` | **3/3 main-text parity; 6/6 two-width Chromium; 2/2 links**, **real HTTP 404 and recovery** at [run 41611872141](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611872141) |
| [C-RV29bw](PUBLIC_SUPPLEMENTARY_LANDING_C-RV29bw_2026-11-03.md) | `about.html`, `editors.html`, `editor.html`, `editor-v2.html`, `studio/index.html`, `connection-studio/index.html`, `editor-v2-previews/source-index.html`, `fluid-layout-lab.html` | **8/8 exact delivered HTML bytes; 16/16 two-width landing states** at [run 41612787456](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41612787456) |

A count of **17 academic reader pages plus custom 404 plus eight supplementary routes** reconciles to **26**. Across these separate independent runs, the raw sum is **18 normalized main-text comparisons + eight exact-delivered-byte comparisons**, **36 ordinary reader page-width cases + 16 supplementary landing cases**. The tests used separate source revisions whose relevant HTML blobs were checked for subsequent source equivalence in their individual stage reports; this is **not** one simultaneous 26-route browser run.

## Sitemap and intentional visibility

Current `sitemap.xml` identifies **16** indexable academic destinations, all contained in the 17 academic-reader list. The sole ordinary academic reader outside the sitemap is `teaching-osmosis-practice.html`, which contains `<meta name="robots" content="noindex, follow">` and is explicitly an **illustrative printable activity**, not an indexed research claim. It should **not** automatically be added to the sitemap in the name of coverage. The About route likewise intentionally redirects to Contact, while source-preview and authoring routes have different discoverability purposes.

The older source-editorial register already covered **19 ordinary/legacy pages and seven supplementary routes** at levels appropriate to their content. New public delivery evidence improves browser confidence but cannot retroactively authenticate original assessment or consent records. The status-tier distinction must be preserved.

## What is and is not verified

**Established:** each of the 26 current HTML files has been fetched as deployed over HTTPS and checked at two viewport widths through a page-type-appropriate Chromium workflow; the 17 reader pages have served-text parity, the legacy/authoring pages have exact HTML-byte parity, and the custom 404 has a separately confirmed real error response. Several representative screenshots were manually spot-checked, without reported gross layout defects in sampled regions.

**Still outside scope:** complete paragraph-by-paragraph image review at every width, physical browser zoom/assistive technology and screen-reader speech, accessibility compliance certification, production authenticated editor publishing, external student-app state and functionality, signed school/student consent source records, authentic original student facsimiles, final 20-row August scoping S2B/S2C matrix, restricted reference full texts, and owner-only contact decisions.

No academic or application source content was changed to achieve these results. There is no basis to mark the entire site **Fully verified**. The right high-level classification remains **In progress**, with **public route delivery covered at a bounded test depth**.

## Exact next stage

**C-RV29by | Remaining external scholarly-link evidence status, not a route coverage rerun.** Inspect the latest external-resource evidence register's two non-identifier unverified destinations and distinguish blocked verification from genuinely invalid links. Compare current public HTML references, try independent authoritative retrieval, and make only justified corrections. Keep the 42 scholarly-identifier entries and abstract/full-text tiers separate. If all destinations prove correct or inaccessible for environmental reasons, document the limit and move to a different primary-evidence gap.
