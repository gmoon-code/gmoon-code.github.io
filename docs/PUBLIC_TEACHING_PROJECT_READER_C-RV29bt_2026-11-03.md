# C-RV29bt | Public production browser audit for teaching cases and project pages

**Date** 3 November 2026. **Continued from** C-RV29bs. **Scope** The current public pages `teaching-ap-chemistry.html`, `teaching-ap-evolution.html`, `teaching-osmosis-practice.html`, `projects.html`, `story-method.html`.

## Actual HTTPS Chromium and source-delivery checks

Adapted the same read-only real-origin browser probe in `scripts/audit-public-research-reader.py` to visit these five additional pages at **390 px and 1280 px**, compare normalized source/served main text independently over HTTPS, check visible reader text and document bounds, stylesheet presence, figure image decoding, named in-page anchors and skip-link focus. Additional real public navigation clicked Teaching → AP Chemistry, Teaching → AP Evolution and Projects → Story Method.

Run [41610181297](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41610181297) independently reported **5/5 static `main` text parity checks**, **10/10 actual public Chromium page-width checks** and **3/3 real public hub navigation clicks** successful, with no probe-flagged errors. It retained ten full-page screenshots and JSON. Its report was downloaded and parsed to confirm image and disclosure details.

## Source, media and context-level results

| Route | 390 px | 1280 px | Specific examined material |
| --- | --- | --- | --- |
| AP Chemistry | Pass | Pass | Three-meeting sequence, two labelled instructional tables, reaction-quotient explanation, correctly qualified *proposed* tasks |
| AP Evolution | Pass | Pass | Haemoglobin S teaching sequence, hypothetical allele-frequency tables, Wikimedia sickle-cell photo with successful responsive image loading |
| Osmosis practice | Pass | Pass | *Illustrative* data and student worksheet; one in-main teacher-notes disclosure successfully opened at both widths |
| Projects | Pass | Pass | Two project screenshots loaded at natural width **1280 px** each and the story-method page linked correctly |
| Story Method | Pass | Pass | Observation-window figure loaded at natural width **978 px**; release-verification details disclosure opened at both widths |

The probe tests document overflow and chosen reading elements. Screenshots were extracted locally and top, middle and bottom crops of **all five 390-px pages** were visually inspected. Their selected regions display expected headings, layout and references. The AP Chemistry and Evolution screenshots visibly show *partial columns* in narrow table view, motivating the additional controlled keyboard investigation below. Full-page desktop screenshots were collected, but were not all manually inspected pixel by pixel.

## Scientific table scroll investigation

Source inspection of `teaching-ap-chemistry.html` and `teaching-ap-evolution.html` found **two** instructional tables on each page, all wrapped in `div.teaching-sequence-table-wrap` with `role="region"`, individual `aria-label` and `tabindex="0"`. Each wrapper is preceded by visible mobile text, “On a narrow screen, scroll the table sideways to see all columns.” The corresponding CSS in `styles-20261013.css` sets a **780 px minimum table width**, outer `overflow-x:auto` and a visible keyboard focus outline.

To avoid mistaking intentional scrolling for hidden or permanently lost scientific explanations, added an independent mobile Chromium check of each wrapper's real computed geometry and keyboard response in the read-only test script. Fresh [run 41610630883](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41610630883) **passed all 5 source text, 10 browser cases, and 3 navigation links again**. The attached JSON confirms all **four** science-table wrappers had

- `scrollWidth=780`, `clientWidth=340`, computed `overflow-x:auto`
- `tabIndex=0`, nonempty accessible descriptive labels and a visible scrolling hint
- keyboard `ArrowRight` advanced `scrollLeft` from **0 to 40 px** in all four cases

This establishes that the partially displayed columns are accessible through the documented horizontal scrolling interaction in Linux Chromium at 390 px. It does not certify access under every motor, screen-reader or physical-device condition.

The latest run's evidence is retained as [artifact 13219246092](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41610630883/artifacts/13219246092).

## Source-integrity and scholarly boundaries

Compared exact GitHub test-run revision `97ba1502abc5b3eff24ab4777c319171f618dba0` against the latest default branch. All **five academic HTML files and the updated probe script**, six source blobs in total, were **byte-identical**. No academic content, table values, source attribution, prose, source code affecting the public pages or author-authored research was changed.

The project preview on Story Method references a separate student application and preserves browser progress. This stage **did not interact with the embedded student preview or alter saved progress**. The osmosis worksheet's print-dialog behaviour, real physical printer output and comprehensive screen-reader usage also remain untested. These are independent from the successful reader checks. Nor does this automate original data/consent authentication or prove that all external references are accessible.

## Exact next stage

**C-RV29bu | Public core profile and curriculum-hub reader verification.** Check `index.html`, `teaching.html`, `interests.html`, `contact.html` and `cv.html` through the same independent live HTTPS Chromium/browser text method at 390 and 1280 px. Inspect images and page-specific links without modifying content unless an issue is proved, and retain remaining routes, source-tier uncertainties, original permission documents, final August scoping rows and human accessibility evaluation as still incomplete.
