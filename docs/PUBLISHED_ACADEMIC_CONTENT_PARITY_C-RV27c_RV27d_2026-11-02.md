# Stages C-RV27c–C-RV27d | Independent published academic main-text parity

**Date:** 2 November 2026. Continued from [C-RV27b](SCOPING_SOURCE_AND_VISITOR_PARITY_AUDIT_C-RV27b_2026-11-02.md) and its previously blocked visitor-delivery verification. These stages are content-source parity checks, **not** a renewed factual certification of original studies or a UI/browser-presentation audit.

## C-RV27c | Actual public delivery for three priority academic pages

A read-only GitHub Actions verifier was created in `scripts/audit-public-content-parity.py` with `.github/workflows/audit-public-content-parity.yml`. Unlike existing local Chromium workflows, this script performs independent HTTPS GET requests to **real published GitHub Pages URLs** and compares the normalized static text nodes inside each `<main>` element with the current checked-out repository HTML. It excludes script, style and template element contents; it is not a dynamic JavaScript, CSS-visibility, rendering, HTTP-header, or complete HTML-byte comparison. Each HTTP response must be status 200 and HTML.

The first independent [remote-content CI run 41389375449](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41389375449) **passed on its first attempt**, as verified by its job steps and original CI log:

| Published page | Source text characters | Delivered text characters | SHA-256 result |
| --- | ---: | ---: | --- |
| `research-scoping.html` | 10,760 | 10,760 | Exact match, both `f2adb6fc29d10bcad18c2ee3836b3ea2b72e4d3eb88852c2a2f40c9af47d2173` |
| `research-action.html` | 13,458 | 13,458 | Exact match, both `c229ceed9b06751e9be950077c4575ba687857ac02312da0e58803fb56bd1d33` |
| `teaching.html` | 7,608 | 7,608 | Exact match, both `e2ac2323df8def0d4d43c856a550d34c4efac3797dd513182d6cd6317d966445` |

This resolves the previously blocked **static main-text delivery parity** for these three public routes. The directly inaccessible website in the assistant's web/container environments does not contradict the successful independent runner's HTTP evidence.

## C-RV27d | All 16 sitemap-listed academic routes

The verifier was extended to read the **actual current `sitemap.xml`**, validate its unique local academic URLs, map the site root to `index.html`, and independently compare each listed page over HTTPS. The workflow also triggers when the sitemap changes. The [full-site-sitemap parity run 41389526115](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41389526115) **passed all 16 real remote page checks on its first attempt**. The CI job log explicitly records PASS for all the following routes, each having a status-200 HTML response and equal normalized main-text lengths/hashes:

1. `contact.html`
2. `cv.html`
3. `index.html` (published as `/`)
4. `interests.html`
5. `projects.html`
6. `pungmul.html`
7. `research-action.html`
8. `research-methods-studio.html`
9. `research-scoping.html`
10. `research.html`
11. `story-method.html`
12. `teaching-ap-biology.html`
13. `teaching-ap-chemistry.html`
14. `teaching-ap-evolution.html`
15. `teaching.html`
16. `writing-biological-classification.html`

A second run [41389539388](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41389539388) also succeeded after the workflow trigger was updated. This check is important for `pungmul.html` and `writing-biological-classification.html`, which are academically public but outside the **15-entry** Studio page manifest. The public sitemap's 16 URLs, Studio manifest's 15 editable paths, and whole repository's additional noindex or authoring routes serve distinct purposes and must not be conflated.

After these checks, a small wording-only clarification to the parity script explicitly bounded it to **static text nodes**, avoiding an overbroad implication that it measures visible rendering. The underlying comparison was unchanged. The subsequent [wording-clarification CI run 41389607081](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41389607081) **completed successfully**. Existing source and public academic HTML were not rewritten.

## Editorial, factual and verification status

**Changed:** Only source-verification scripts and workflow; academic HTML text, author voice, table values, source references, journal status, titles, and teaching examples remain unchanged. Source-level editorial reviews C-RV20–25 and earlier stages remain preserved rather than needlessly repeated.

**Verified:** Independently served GitHub Pages normalized static `<main>` text **16/16 sitemap routes** at the tested repository revision, with a saved CI JSON evidence artifact and inspectable logs. The three priority academic routes had independently inspected matching length and SHA-256 pairs. Pages workflow success is not used as a substitute for those actual remote requests.

**Not verified by this method:** DOM changes from client-side scripts, CSS-hidden text or computed visibility, complete HTML bytes, supplemental external files, dynamically loaded research tools, content outside `<main>`, noindex legacy/authoring routes, scholarly truth or independent underlying study coding. Thus the website's academic **delivery parity** is confirmed in this narrow scope, but overall website **Fully verified** is not warranted.

**Open original-source records:** final August 2026 S2C 20-study coding roster, especially the precise 7/20 instructional-placement assignments; original AP Biology response sets, rater reconciliation, consent/assent and school permission documentation; inaccessible full texts for some sources; author-reported awards and employment particulars where original certificates/records are absent. Those remain separate evidence-tier blockers, not defects proven by the delivery tests.

## Exact next checkpoint

**Stage C-RV28a:** Check the latest wording-only remote parity run's final outcome and then resume genuinely **unverified scholarly-content evidence**, prioritizing a bounded original-source check or a documented primary-data blocker. If no authentic original file is available, leave it as **Blocked**, choose the next actionable reference or author-facing text source from the coverage ledger, and avoid repeating the already verified 16-page static delivery comparison. Continue the author-style audit where actual unsupported prose remains. The six recorded Editor V2 browser failures remain a distinct, unfinished functional-workflow track and are not resolved by static text parity.

**Overall comprehensive academic website content audit: In progress.**
