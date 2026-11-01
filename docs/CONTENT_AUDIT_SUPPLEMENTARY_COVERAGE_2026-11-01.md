# Academic website content audit | Supplementary coverage index

Updated 1 November 2026. Companion to `docs/CONTENT_ONLY_COMPREHENSIVE_AUDIT_2026-10-29.md`, which contains the renewed sentence-level audit register for the main 19 public/legacy root pages. This is a coverage and evidence index, not a replacement for either primary ledger.

## Continued work and status

| Surface | Stage ledgers | Editorial status | Verification boundary |
| --- | --- | --- | --- |
| 19 top-level root public/legacy HTML pages | `CONTENT_ONLY_COMPREHENSIVE_AUDIT_2026-10-29.md` and page-specific audits | Editorially reviewed per existing register; original source and external factual claims not all confirmed | See page-specific unfinished primary record, DOI, publication, and live/browser checks |
| Research Methods Studio student workflows | `gmoon-code/research-methods/docs/STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12c…p` | Content source corrections verified in scope | Node regression for research chat backend, adapter, snapshot passed at [run 41316145233](https://github.com/gmoon-code/research-methods/actions/runs/41316145233); end-to-end browser/public byte parity still unverified |
| `connection-studio/index.html`, `connection-studio/data.js`, `connection-studio/app.js` | [C-CS1](CONNECTION_STUDIO_CONTENT_AUDIT_C-CS1_2026-11-01.md), [C-CS2](CONNECTION_STUDIO_CONTENT_AUDIT_C-CS2_2026-11-01.md) | Main instructional bank and 30 writing tasks editorially reviewed; source provenance and lexical labels corrected | Native Node regression passed at [run 41316647230](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41316647230); browser and effectiveness validation outstanding |
| `studio/index.html` and `studio/pages.json` | [C-ED1](WEBSITE_STUDIO_CONTENT_AUDIT_C-ED1_2026-11-01.md) | Token/permission and author instruction review completed in scope; other detailed controls pending | Nine targeted source and parser checks passed; authenticated operation unverified |
| `editors.html`, `editor.html`, `editor-v2.html`, publisher configuration/setup | [C-ED2](EDITOR_CONTENT_AUDIT_C-ED2_2026-11-01.md), [C-ED3](EDITOR_CONTENT_AUDIT_C-ED3_2026-11-01.md), [C-ED4](EDITOR_CONTENT_AUDIT_C-ED4_2026-11-01.md) | Content status **In progress**. Publishing boundaries, local image/draft status, grouping and source preview wording checked and corrected | Targeted source checks passed; existing editor browser workflows still require final outcome review; no authenticated publish |
| `editor-v2-previews/`, `fluid-layout-lab.html`, `publisher/` helper documentation, `studio/` remaining help and administrative sources | This index | **Not yet fully reviewed in renewed content-only pass** | Historical UI/engineering QA cannot be substituted for a complete current content audit |
| Downloads, supporting linked materials, citations, media descriptions, expandable content from supplementary tools | This index; page-specific earlier ledgers where present | **Partly reviewed or Not reviewed**, depending on source | Inventory and individually document support for claims before any Fully verified declaration |

## Repository inventory caution

The root repository tree includes 19 root public/legacy HTML pages, standalone `connection-studio/index.html`, `studio/index.html`, several editors, a preview subroute, internal source-manifest data and supporting publication materials. The 16 entries in `studio/pages.json` are a narrower editing manifest and are not a full enumeration of public routes. For instance, `contact.html`, `pungmul.html` and `writing-biological-classification.html` do not appear there; this discrepancy is documented for later investigation and not treated as permission to alter the navigation or editing app.

## Verification levels and latest status

The Research Methods Studio Node regression CI and Connection Studio Node content-integrity CI have completed successfully; earlier manual isolated-function checks remain relevant but are not equivalent to real browser tests. GitHub Pages build successes establish that deployment workflows completed, not that all live resources were fetched and compared byte-for-byte. The assistant's current web and container network could not open the public site paths, so live served-content parity remains blocked. At last inspection, several new main-website editor/browser workflows and Pages deployment jobs were in progress or superseded by later commits; do not infer failure from their cancellation or claim success before completion.

## Exact next continuation

**Stage C-RV18 | Specific remaining original-source, app-content and published-site verification.** C-RV17 confirmed each of the 16 sitemap-listed academic URLs matches its source canonical, permits normal indexing and links to Contact. The separate Connection Studio tool is not listed in the sitemap or linked from Home/Projects; whether to promote its public indexing requires author intent. Next resolve genuinely outstanding original empirical and ethics records, externally inaccessible full scholarship, or precisely unaudited written components. The independent Editor V2 browser failures and live served-byte parity remain separate tracks. Preserve completed source-verified prose and do not infer missing private documents are absent.

The overall academic website audit is **In progress**. No whole-site Fully verified claim has been made.


## Subsequent source progress, 1 November 2026

- [C-ED5](EDITOR_CONTENT_AUDIT_C-ED5_2026-11-01.md) logged six distinct failed Editor V2 browser test cases across three failed workflows; UI implementation still requires functional remediation and retest. These are real test failures and cannot be described as passing browser QA.
- [C-ED6](SUPPLEMENTARY_CONTENT_AUDIT_C-ED6_2026-11-01.md) verified that the Fluid Layout Lab is unpublished and marked noindex, and added noindex metadata to an archived, older Home-page preview without rewriting the historical fixture.
- [C-ED7](SUPPLEMENTARY_CONTENT_AUDIT_C-ED7_2026-11-01.md) inventoried local and externally linked scholarly documents. The main repository has no local PDF/Office/spreadsheet files; two external-repository synthetic CSV paths exist. Original DOI-linked publications, College Board PDFs and primary study records remain to be checked on their own evidence.


## Research source-verification continuation, 1 November 2026

| Stage | Actual result | Further verification needed |
| --- | --- | --- |
| [C-RV1](SCOPING_PRIMARY_SOURCE_AUDIT_C-RV1_2026-11-01.md) | Pierson design-based source distinction corrected and committed; ERIC 216-to-20 arithmetic verified | Original ERIC export, 20-study coding, second-reader evidence, OSF preprint current status |
| [C-RV2](ACTION_RESEARCH_PRIMARY_RECORD_AUDIT_C-RV2_2026-11-01.md) | 15/15 internal arithmetic and cross-page assertions passed; no unjustified edit | Original 28 response sets, rater records, permissions, consent/assent documents |
| [C-RV3](CLASSIFICATION_ESSAY_PRIMARY_SOURCE_AUDIT_C-RV3_2026-11-01.md) | Five cited works reconciled, 15/15 structural/source assertions passed | Complete source texts of some books/reviews and live visitor parity |
| [C-RV4a](RESEARCH_OVERVIEW_SOURCE_AUDIT_C-RV4a_2026-11-01.md)–[C-RV4g](RESEARCH_OVERVIEW_SOURCE_AUDIT_C-RV4g_2026-11-01.md) | Research overview's 53/53 reference IDs link to body citations; one warranted Suárez elementary-age qualification committed; direct sources/reports checked in bounded batches | 53-reference [tiered evidence matrix](RESEARCH_OVERVIEW_SOURCE_AUDIT_C-RV4g_2026-11-01.md) distinguishes 12 article texts consulted, 34 abstract/record checks and 7 book/chapter catalogue checks; this is **not** independent full-text verification of all 53 publications |

The current Research HTML source after C-RV4c remains at blob `9437512368d44a590b3d986f82bb8e6d6eea61ad`; later checks made no unnecessary prose changes. Native Node checks passed for their specified separate app scopes. `Fully verified` is not justified for the academic website.


## C-RV5 manuscript and Crossref status addendum | 2 November 2026

The academic metadata workflow [run 41319251599](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41319251599) completed successfully, preserving a Crossref HTTP 200 [registry record](RESEARCH_METADATA_LATEST_RESULTS.json) for `10.35542/osf.io/kznvj_v1`, authored by Ye Eun Moon, posted on **11 August 2026**, with a title matching the 2026 scoping review on the current site. The `preprint` claim is now **registry verified**; the actual downloadable OSF manuscript and detailed 20-study extraction remain independently **unverified**. This supersedes earlier notes saying DOI metadata was inaccessible; direct web access remained blocked, but the existing native CI captured authoritative registry information.

The CV calls the classroom action research manuscript `under review`, while the detail page calls it `unpublished`. These are compatible statuses, **not** proof of the confidential journal-review process. No acceptance or publication is asserted. All **16** cross-page numeric/title/status/source checks passed across the two research pages, CV, Research overview, Home and stored Crossref metadata. No change to public wording was justified. See [C-RV5 ledger](RESEARCH_STATUS_PRIMARY_RECORD_AUDIT_C-RV5_2026-11-02.md) for evidence levels and remaining source records.


## C-RV6 professional and credential addendum | 2 November 2026

Original [C-RV6 audit ledger](CV_IDENTITY_CREDENTIAL_AUDIT_C-RV6_2026-11-02.md) verifies from [Massachusetts DESE](https://www.doe.mass.edu/stem/dlcs/licensure.html) that a Digital Literacy/Computer Science middle/high school teacher licence is officially **Grades 5–12**, not 9–12. The former grade band in `cv.html` was corrected in [commit bd6c5de](https://github.com/gmoon-code/gmoon-code.github.io/commit/bd6c5dee81f4ab033b779f1f08ea2c9a80f7c913), leaving the author's claimed Jan 2024 date intact and unverified. Twelve source consistency assertions passed. Official programme structure and personal credential issuance are separate evidence claims. The website's public email remains internally consistent, but differs from the newest supplied résumé; the author-preference question remains open.


## C-RV7–8 institution and certificate provenance | 2 November 2026

- [C-RV7](PROFESSIONAL_PROVENANCE_AUDIT_C-RV7_2026-11-02.md) corroborated the existence and official programme nomenclature of the UBC Biology major, Biochemistry minor, ACE Science Education masters and **Ivy Collegiate School / Helix** publication, with **15/15** cross-page checks passed. Individual awards, employment and mentoring records remain author-reported.
- [C-RV8](PROFESSIONAL_DEVELOPMENT_AUDIT_C-RV8_2026-11-02.md) confirmed Harvard Bok Center Higher Education Teaching Certificate, UZH Teaching Science at University, Rice Fundamentals of Computing specialization and TEFL UK 120-hour Professional TEFL programme against original provider pages. **12/12** source checks passed. The author’s certificate completions were not independently established.
- The official Massachusetts DLCS Grades **5–12** CV correction and Crossref-registered scoping preprint DOI remain preserved. The earlier contact-email discrepancy, private classroom/ethics files and live-site browser verification are still open.


## C-RV9 scholarly metadata integrity | 2 November 2026

The repository's metadata-check script successfully ran at the corrected CV revision, but [run 41358594547](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41358594547) initially failed while trying to publish its summary because another commit had advanced `main`. The genuine scholarly check succeeded and uploaded its artifact. The report-push workflow now retries five safe fetch/rebase/fast-forward pushes without force-push ([commit f74a8f7](https://github.com/gmoon-code/gmoon-code.github.io/commit/f74a8f7fb34eaf6afe2140b3ce7a5913adb567d7)); the [fresh full run 41359051595](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41359051595) **passed**, including stored report publication. The [latest Crossref report](RESEARCH_METADATA_LATEST_RESULTS.json) again identifies the scoping preprint registered on 11 August 2026 and 59 distinct DOIs / 67 occurrence checks; this is metadata consistency, not independent verification of every cited study. See the [C-RV9 ledger](SCHOLARLY_METADATA_AUDIT_C-RV9_2026-11-02.md).


## C-RV10–12 Teaching source and original PDF verification | 2 November 2026

- [C-RV10](TEACHING_CURRICULUM_SOURCE_AUDIT_C-RV10_2026-11-02.md) verified official AP Biology Unit 3 and Unit 7 and AP Chemistry Unit 7 mapping; independently recomputed the three chemistry reaction-quotient exercises and Hardy–Weinberg/one-generation HbS selection values, with **18/18** targeted checks passed. Hypothetical teaching values remain labelled as such.
- [C-RV11](TEACHING_SCHOLARLY_SOURCE_AUDIT_C-RV11_2026-11-02.md) checked primary published sources for herbicide electron transport, undergraduate/early-elementary mechanistic reasoning, chemistry's macroscopic/particulate/symbolic framework, HbS geographic inference and both original Wikimedia image/license records, with **21/21** assertions passed. No text change warranted.
- [C-RV12](TEACHING_SUITE_COVERAGE_AUDIT_C-RV12_2026-11-02.md) directly opened and inspected **College Board 2025 Biology** and **2024 Chemistry** Course and Exam Description PDFs including screenshots of their Unit 7 guides, and reconciled all Teaching case files with the Research action inquiry and classification essay. **24/24** corrected source checks passed; no unjustified change was made. Complete PDF page-by-page and live-site browser verification remain outside the scope completed.


## C-RV13–14 full HTML inventory and Website Studio source alignment | 2 November 2026

- [C-RV13](WHOLE_SITE_COVERAGE_RECONCILIATION_C-RV13_2026-11-02.md) reconciled the **26** current HTML files, comprising **19** root public/legacy pages with renewed editorial coverage and **seven** supporting authoring, experimental and preview routes reviewed in scoped C-CS/C-ED stages. The standalone `teaching-osmosis-practice.html` is already in the original 19, and should not be counted again.
- [C-RV14](WEBSITE_STUDIO_CONTACT_AUDIT_C-RV14_2026-11-02.md) corrected the stale authoring manifest and navigation label `About` to public **Contact**, replaced the redirecting About file as the default new-page template with non-redirecting Projects and assigned new pages their own canonical URL. The old public About redirect was retained. **15/15** source checks and [the native Node regression run 41360372353](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360372353) passed. Authenticated publishing and live browser parity remain separate unknowns.


## C-RV15 inherited-duplicate source guidance | 2 November 2026

[C-RV15](WEBSITE_STUDIO_DUPLICATION_CONTENT_AUDIT_C-RV15_2026-11-02.md) identified the remaining need to warn authors when explicitly duplicating pages with references, images and search-indexing settings. The Studio help now explains inherited content and asks for citation/image-credit/link review before publication. An extended [native Studio Node content workflow 41360606660](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360606660) **passed**, including the new regression assertion and previous Contact/new-page checks. Actual browser-authenticated publication and whether search engines honour directives remain unverified.


## C-RV16 route metadata completion | 2 November 2026

The [C-RV16 metadata ledger](PUBLIC_SOURCE_METADATA_AUDIT_C-RV16_2026-11-02.md) enumerates all **26 current HTML paths** and their roles, titles, canonical and robots metadata. It confirms **16 self-canonical ordinary academic pages**, two non-self canonical redirect/archived pages, **nine** intentionally noindexed routes and **one** separately indexable Connection Studio tool without a canonical. The Fluid Layout Lab embeds its title and robots tag without a conventional explicit `<head>` element; the earlier head-only scanner was corrected by directly inspecting source. No metadata rewrite was justified from those facts alone. Actual search engine indexing and live byte delivery remain unverified.


## C-RV17 sitemap and canonical verification | 2 November 2026

The [C-RV17 source ledger](SITEMAP_AND_LINK_AUDIT_C-RV17_2026-11-02.md) records an exact current `sitemap.xml` inventory of **16 academic routes**. Each was fetched and checked against its canonical, robots and published Contact navigation, with **16/16 matching**, no retired About links or accidental noindex. `robots.txt` points to the same sitemap. Connection Studio remains a separate indexable tool absent from Home, Projects and sitemap; its discoverability is an author-dependent decision. No unwarranted sitemap change was made.
