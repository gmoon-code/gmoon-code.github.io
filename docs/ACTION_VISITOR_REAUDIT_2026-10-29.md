# Classroom action research detail | Stage R4 visitor re-audit | 29 October 2026

**Status: completed for the specified visitor-facing scope.** Public route `research-action.html`. Earlier Research stages R1, R2 and R3 are preserved, along with earlier substantive action-research source and table-hint checks. Focus was the current rendered page, both evidence tables, responsive flow, keyboard and dark-mode accessibility and printed A4 output. This is not an independent recreation of private student-level analyses.

## Retained scholarly and source checks

- The existing research narrative reports **28 secondary AP Biology students** and mechanistic completeness classifications **7/28 Unit 2, 18/28 Unit 3 and 25/28 Unit 4**. The questions address distinct mechanisms, and the page explicitly rejects interpreting these figures as change on one common ability measure.
- Among the **21** below-complete Unit 2 explanations, the reflection-specificity table records **12** specified reasoning difficulties (**10** later complete, **2** below-complete) and **9** other reflections (**3** later complete, **6** below-complete). Both row and column arithmetic reconcile. The reflection groups were not randomly assigned.
- The **10** original/reconstructed Unit 3 pairs split into **5** extended pathways, **2** earlier contradictions not repeated, **2** earlier relationships omitted and **1** undeveloped pathway. Seven of the later reconstructions meet item-specific completeness criteria, a different construct from the four mutually exhaustive change patterns.
- The page distinguishes feedback-assisted corrections from **subsequent independent reconstructions** after a more explicit prompt, explicitly ruling out causal claims about why written explanations differed. Questions developed after analysis are labelled *not administered or evaluated*. The two de-identified case descriptions are paraphrases rather than claimed quotations.
- Ethics, permission and second-reader agreement are described in the original page. Underlying primary records and consent documents were not separately shared for revalidation at this stage. No research counts, wording, classifications, manuscript status or ethics claims were rewritten.

## Real browser baseline and confirmed defects

- Built a bounded repeatable Chromium/PyMuPDF audit in `scripts/audit-action-visitor.py` and `.github/workflows/audit-action-visitor.yml`, with screenshots, complete current source snapshot, PDF, each printed-page raster and JSON evidence preserved as an artifact.
- Initial actual run **40841452897** found **zero screen errors** across widths **320, 375, 480, 560, 620, 700, 701, 768, 900, 1024, 1140 and 1440 pixels**. No document-wide horizontal overflow, clipped text, broken fragment IDs or unlabelled links. Both tables have captions, column scopes, row labels, preceding narrow-screen guidance and keyboard-focusable overflow regions. ArrowRight scrolling was functional at 320px.
- Genuine responsive defect: the concluding-section/footer gap changed from **100px** at widths ≤700 to **124, 128, 136, 143, 150 and 158px** at the six larger widths.
- Genuine print defects: first **seven-page** A4 output had only **14 extracted words on page seven**, consisting solely of return-navigation links. Page one split a Unit 3 preparation sequence entry from its explanation; a table caption appeared alone at the foot of page two while its column headers appeared on page three. Light-screen fluorescent headings remained too assertive when printed.
- The first report additionally flagged a row label as absent due to a **test-only regex escape mistake**. Actual PDF showed the full `Intermediate pathway still / undeveloped` text, wrapped across lines. Test was corrected to normalize PDF extraction whitespace.

## Scoped visitor-facing corrections

- `research-action.html` now loads the audited visible-focus stylesheet `appearance.css?v=20261028-visible-focus` rather than the former cache key (`d722367`).
- `styles-20261013.css` now sets scoped `#main.research-action-page` footer spacing to **64px bottom padding plus 36px footer margin**, an exact **100px visual gap** at every tested width (`174eb2a`). The print override clears this padding.
- Scoped A4 print rules `6b6c9c9` reduce research section whitespace, render major headings as dark text with restrained underline, keep each assessment-cycle entry intact, and keep both full evidence tables and their captions together. Paper-only omission of the two return-navigation links is intentional, since they were otherwise isolated on a new final sheet; full interactive navigation remains on screen.
- PDF diagnostic and regression test refinements `2e368da`, `5766ab5` and `23ef88c` use whitespace-normalized PDF extraction, verify actual last-page substance, footer geometry, first keyboard Tab/Enter/skip, in-page jumps/back-to-top and sampled dark text contrast. Workflow `ef267eb` writes an exact result snapshot to `docs/ACTION_VISITOR_LATEST_RESULTS.json`, so successful runs can be checked without inferring success from committed scripts.

## Final verified evidence

- **Final GitHub Actions run [40842693557](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40842693557) succeeded (exit code 0)** with job outcome `success`, artifact **12883681300** (`action-research-visitor-evidence`).
- **All twelve widths** again passed screen assertions with **exactly 100px footer spacing** each. Both table scroll regions remain keyboard operable and readable without forcing page-wide horizontal scrolling.
- The actual first keyboard Tab focused the visible **Skip to content** link, Enter moved focus to the `main` landmark, the **Paired responses** jump changed location to `#paired-evidence`, and Back to top returned `#page-top` with vertical position zero.
- **Twelve dark-mode text samples** for the main headline and introduction, article prose, assessment-cycle stage, case title/body, both table headers and cells, follow-up heading, table note and count label returned contrast ratios **9.66:1–16.23:1**. These samples exceed the 4.5:1 standard paragraph threshold; they are not an exhaustive screen-reader or WCAG conformance certificate.
- The final physical **six-page A4 PDF** has extracted word counts **298, 258, 311, 319, 307 and 353**. All six pages were rendered to page rasters; the printed sheet montage was inspected. The table captions sit on the same sheet as their complete headings and rows; the assessment-cycle entry is not split, every expected research heading and table label is present, and zero extracted word rectangles escape physical page bounds. No last-sheet navigation orphan remains.
- Light and dark smartphone full-page screenshot contact sheets and desktop excerpts were visually inspected for normal reading flow, heading wrapping, table containment, stacked cards and legible content. Unchanged visual styles elsewhere were deliberately left alone.
- Recheck source/result evidence at `docs/ACTION_VISITOR_LATEST_RESULTS.json`. The A4 and screenshot artifact is retained according to the workflow's fourteen-day policy.

## Remaining limitations and next work

**R4 is completed for the bounded, repeatable research-action visitor audit.** Screen-reader spoken output with a specific assistive technology, Firefox/Safari, physical touch devices, external-link future uptime and independent author-source student-ledger validation are not certified. No test should be described as proving those matters.

Continue the comprehensive site inventory from the exact next unfinished visitor-facing route after R1–R4, without retesting finished Research, Teaching, Projects, CV, Interests and Contact stages solely for repetition. Confirm route inventory and the master audit ledger before choosing R5.
