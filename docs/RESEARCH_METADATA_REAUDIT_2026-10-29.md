# Public scholarly references and research status | Stage S3 | 29 October 2026

## Scope and preserved earlier work

This is Stage S3 following completed 19-page public site source graph S1, outward availability S2 and prior per-page academic/editorial audits. No already completed browser, print, teaching, research, projects, CV or utility-route stage was restarted. The focus is the preprint’s **official scholarly registration**, internal consistency of current research-status claims and an independent, dated check of the full bibliography’s title, author and year. The website editor remains outside scope.

## Sources and reproducible method

- Added `scripts/audit-research-metadata.py` and `.github/workflows/audit-research-metadata.yml`. The script reads current checked-out public page HTML for the Research hub, both research detail pages, the biological classification essay, three AP teaching case pages, Teaching hub and CV. It collects their scholarly DOI links and the surrounding citation text and compares identifiers to an independent OpenAlex DOI metadata index; references are distinguished from short in-text/narrative links. Full source and metadata comparisons are preserved in workflow artifacts.
- Following a first **incorrectly incomplete registry check**, updated the script to look up OSF preprint DOI `10.35542/osf.io/kznvj_v1` in **Crossref first**, then DataCite only as a fallback. OSF preprint DOIs are registered through Crossref; a DataCite 404 for a Crossref DOI does not indicate an invalid identifier. Independent DOI resolution was already shown reachable in S2.
- Replaced numerous individually rate-limited OpenAlex requests with the documented OR-filter DOI batch endpoint. This changed the evidence from a first incomplete 23 matches / 43 unverified to a complete current comparison. No visitor-facing file was changed as a response to an API rate limit.
- The reference comparison checks the printed/title text against indexed title tokens, publication year and first-author surname. It treats short narrative links without a full reference as a distinct category. Edition/print-year differences are flagged for manual verification, not silently changed.
- Two 2012/2014 and 2021/2023 differences were checked against independently indexed **journal-issue records**, not treated as bibliographic errors:
  - **Gonsalves** DOI `10.1007/s11422-012-9447-6`. The journal’s final issue citation is *Cultural Studies of Science Education* **9**(2), **503–521 (2014)**, though the index’s initial online publication is 2012. Corroboration includes `https://link.springer.com/article/10.1007/s11165-018-9786-8`, whose references provide the exact 2014 volume/year/pages and DOI, and other independent journal citations.
  - **Rajendram** DOI `10.1080/14790718.2021.1898619`. The publisher itself gives *International Journal of Multilingualism* **20**(2), **595–622 (2023)**, with first online publication 21 March 2021, `https://www.tandfonline.com/doi/full/10.1080/14790718.2021.1898619`. The website’s 2023 issue-year citation is correct.
- These two verified **issue-year** exceptions are explicitly documented in the audit script, so subsequent rechecks will detect an incorrect later change rather than repeatedly mark the already verified final-year citations as errors.

## Current public record of the scoping-review preprint

Crossref returned **HTTP 200** for DOI `10.35542/osf.io/kznvj_v1`. Its registered metadata reports:
- Type `posted-content`, subtype `preprint`; publisher **Center for Open Science**.
- Title **Evidence Routes and Validity Risk in Claims About Multilingual Learners’ Science Understanding in Secondary Science: A Scoping Review**.
- Sole creator **Ye Eun Moon**.
- **Posted 11 August 2026**; publication year **2026**.
- Registered canonical DOI `https://doi.org/10.35542/osf.io/kznvj_v1`.

The current `cv.html` author, year, exact substantive title and `[Preprint]` designation agree with this record. `research-scoping.html` describes the original 20-study ERIC-bounded analysis, uses the same DOI and identifies the link as a 2026 preprint. The initial failed DataCite lookup and the initial OSF-title false alarm were **test-method errors** rather than defects in the published preprint URL. The current Crossref record does **not** by itself verify the preprint PDF’s text, OSF file-view permissions or the original empirical extraction ledger, which were independently scoped in earlier page audits.

## Final verified findings

- **Final workflow run [40856246959](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40856246959)** completed **successfully (exit code 0)** at source/test commit `e11cb6ef820b8c9eb4e797d146352a4c72c9c648`. GitHub Actions artifact **12889482702** (`academic-metadata-evidence`) contains full comparison, script output and metadata; concise exact-head summary is `docs/RESEARCH_METADATA_LATEST_RESULTS.json`.
- **59 distinct independently indexed scholarly DOIs**, **67 DOI occurrences**, **65 full bibliographic entries consistent** with indexed work title, first-author surname and correctly identified final publication year, **2 intentionally separate in-text/narrative occurrences**, and **zero unresolved full-reference review items**. This describes the checked DOI-linked references, **not** all books, non-DOI webpages, or a full independent read of each publication. Online-first years were not substituted for correct final issue citations.
- The CV’s classroom action research entry calls its work **unpublished** and describes a manuscript prepared for *Educational Action Research*. The action-research page itself retains research-design, ethics and limitations language and does not claim an accepted paper. No publication or acceptance status was invented.
- The current online CV states **MEd in Science Education, coursework completed August 2026, expected November 2026**. As of 29 October 2026, the expected award date has not passed. This wording does not claim a degree was already formally conferred. Verification of the formal conferral requires the institution’s official record, not public web metadata.
- The Massachusetts Digital Literacy/Computer Science licence grade-band and specific date are user-specific credential details that cannot be independently certified from a generic state licensing webpage. Its current CV wording was preserved pending official licensure/credential evidence, rather than silently changed.
- No confirmed academic-source or cross-page status contradiction merited altering visitor-facing HTML, research prose, citations, data counts, ethical qualifications or CV degree status.

## Limitations and next continuation

The automated title-word and first-author comparisons are screening checks against an indexed data source; they are not an exhaustive item-by-item verification of all author initials, coauthor order, print issue, page ranges, quoted scholarly interpretations, licensing restrictions or full original manuscripts. Crossref metadata validates posted preprint metadata, not publication in a journal. The scholarly DOI links' live publisher accessibility was already assessed separately in S2.

**Stage S3 complete for preprint registry, DOI-linked bibliographic title/year/first-author consistency and the documented CV research-status review.** Next site-wide continuation is **S4**, a bounded current automated accessibility and 200%/400% text zoom/reflow regression, using existing site-wide infrastructure rather than repeating completed page layout audits. Manual screen-reader spoken-output, Safari/Firefox and physical touch remain distinct follow-up checks. Preserve the completed page-level stages and S1–S3 without restart.
