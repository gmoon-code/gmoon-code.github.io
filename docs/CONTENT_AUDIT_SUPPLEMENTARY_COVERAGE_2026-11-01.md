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


## C-RV18 project pages and original application-source reconciliation | 2 November 2026

[C-RV18](PROJECT_APPLICATION_SOURCE_AUDIT_C-RV18_2026-11-02.md) compared `projects.html`, `research-methods-studio.html`, `story-method.html`, related authoring manifests and the separate Connection Studio source against both original application repositories. Independently reconciled all **90 seed rows with 18 synthetic radish dish rows**, confirming every dish-level mean and germination proportion, and independently reproduced the three published treatment averages. The **18-stage** phase allocation, Story Method **58 journeys/448 scenes**, nine-location first journey, first-scene quotation and original numerical practice prompt also match author-maintained records. Privacy, local storage, optional server use, published instructional content and offline-cache descriptions agree with the inspected source boundaries. No ungrounded public prose edits were made.

The public Story Method and Research Methods Studio live deployments could not be accessed through the available web retrieval tool, so delivered-byte parity and browser interactions remain **Blocked**, not failed or passed. Connection Studio indexing intent, author-preferred contact email, original confidential study and consent/rater records, and six known Editor V2 browser failures remain open.

**Exact next stage C-RV19:** evidence-source and externally dependent claim closure for primary scoping/action records and public scholarly full texts, with explicit blocked tiers rather than assumed verification. Preserve the completed C-RV18 source findings.


## C-RV19 research evidence-source upgrade and Unit 2 construct-accuracy | 2 November 2026

[C-RV19](RESEARCH_PRIMARY_EVIDENCE_AUDIT_C-RV19_2026-11-02.md) inspected author-held Library scoping charting and screening workbooks not previously available to the source audit, along with a later author action-research manuscript. Recomputed the original **216-record** workflow from individual screening rows (**137** title/abstract exclusions, **58** full-text exclusions, **1** report unretrieved, **20** included). The original charting workbook's study rows support current website counts **8 written, 7 talk, 5 visual**, and learner-reporting **14 focal language conditions, 5 placements, 1 newcomer**. Six additional record-identification, screen-to-study and range checks passed. This upgrades counts from internal HTML arithmetic to **author-document-correlated study-level counts**, not fully independent article-by-article re-screening.

The latest accessible author-held working scoping manuscript diverges from this earlier-coded workbook on some corpus distributions. The authoritative **11 August 2026 DOI-posted manuscript text** remains inaccessible through available external retrieval, so *final version parity is unresolved* and **no current website totals were changed without proof**. Sensitive draft-specific alternative distributions and private file identifiers have not been published to the repository.

The late-October author manuscript confirms the exact historical Unit 2 **proposed sodium-transport-to-dehydration** assessment question. Original chytridiomycosis physiological research supports a qualification that electrolyte depletion and cardiac dysfunction were documented in severe disease, and one study found unchanged hydration measures. The public Action Research **methods/limitations** paragraph was corrected with citations in [commit d36e4b5](https://github.com/gmoon-code/gmoon-code.github.io/commit/d36e4b518d14eeb66900bb036b1f9a5dd23b2c02), without rewriting the question or reported student results. **13/13** post-change source assertions passed. Original student responses, independent-rater work and consent/permission records remain unverified; no new native browser/CI pass is claimed.

**Exact next stage C-RV20:** settle latest public scoping preprint/chart version against divergent draft distributions, then inspect any authorized original action-research responses and ethics records, and proceed to remaining full-text scholarly coverage. Preserve current source-verified prose, keep public email preference and Editor V2 browser regressions separate.


## C-RV20 registered scoping-preprint version reconciliation | 2 November 2026

[C-RV20](SCOPING_REGISTERED_PREPRINT_VERSION_AUDIT_C-RV20_2026-11-02.md) recovered four author-held **12 August** scoping manuscripts and expanded the native Crossref audit's previously truncated abstract capture in [commit c903793](https://github.com/gmoon-code/gmoon-code.github.io/commit/c90379391a1602326806d2398aec1882b29ba0dc). The [successful native run 41367071570](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41367071570) stored the **full Crossref abstract** for the **11 August 2026** preprint, explicitly confirming **10 written, 6 interactional, 4 representational** primary evidence routes, instead of the older July workbook's 8/7/5. A separate August manuscript table reports **18** comparable focal-language conditions, **7** programme placements, **3** prior-schooling descriptions, **1** newcomer-status description, and **0** comparable biliteracy/earlier-disciplinary-language entries; these profile counts are author-manuscript-corroborated but *not* part of the registered abstract or reconstructed from a newer spreadsheet.

The public `research-scoping.html` was corrected in [commit 8d234d5](https://github.com/gmoon-code/gmoon-code.github.io/commit/8d234d567c2ce7630c596490017cb3c7eb2f9a8e). Ten source-level changes updated the evidence cards, language/placement figures, added the 3/20 prior-schooling row, repaired the previously false claim of no comparable schooling history, and distinguished a limited earlier decision-record audit from independent dual screening or formal intercoder agreement. **14/14 post-change source assertions passed**. [Native scholarly-metadata run 41367250211](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41367250211) completed successfully with the authoritative registry abstract. The web tool still could not fetch the actual OSF preprint PDF, so full posted-file parity is not established.

The August Table 1 changes reclassify **two studies** from the earlier workbook. Original publisher abstracts establish a possible inferential ambiguity for Fine (2022), where the study directly analysed teacher-researcher interpretation conversations, and a potential distinction between written concept descriptions and modelling for Widing et al. (2022). These categories must still be checked at article and later chart level. The original July workbook remains a verified historical source, not final-August coding. All original action-research/ethics and public delivery limitations remain open.

**Exact next stage C-RV21:** re-examine the two changed study assignments and the August learner-context coding definitions against primary studies and any available final chart, then continue the independent confidential action-research and 53-reference verification tracks. Preserve the new registry-supported public corrections and do not mark the page Fully verified solely from the abstract.


## C-RV21a changed-route primary articles | 2 November 2026

[C-RV21a](SCOPING_ROUTE_RECLASSIFICATION_AUDIT_C-RV21a_2026-11-02.md) examined the two study-ID shifts responsible for the July 8/7/5 versus August 10/6/4 primary-evidence distributions. The original **Widing et al. (2022)** polymer-chemistry article's full-text methods show that **before/after written concept descriptions** were the central analysed outcome, while models and discussions provided the teaching context and explanatory traces. This supports the August *written/task-response* choice as a defensible **primary** code, without denying secondary representational work. Widing also explicitly reports 3–6 years of Swedish schooling among the second-language learners, independently supporting one prior-schooling example in the August author's **3/20** category. The PDF page-image screenshot attempt timed out, so no image or page-layout verification was claimed.

The original **Fine (2022)** journal abstract and independent 2023 scholarly review focus on **teacher–researcher conversations and teacher interpretive development**, rather than clearly demonstrating a primary student written-response outcome. The August preprint's written/task-response code and the study's direct-science-understanding eligibility warrant require inspection of the full article and its latest row-level coding rationale. No unsupported recoding, exclusion or aggregate count change was made. The current website remains correctly aligned with the registered August abstract, with this original-source interpretation explicitly unfinished.

**Exact next checkpoint C-RV21b:** investigate Fine's full-text eligibility and evidence-form warrant, then source-check other August learner-profile recodings and original action/ethics records as separately bounded stages. The wider website audit remains **In progress**.
