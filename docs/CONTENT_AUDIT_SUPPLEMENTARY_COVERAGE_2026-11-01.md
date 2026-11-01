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

**Stage C-RV6 | Remaining public identity, publication and empirical provenance discrepancies.** Crossref has independently registered the scoping review preprint DOI, author/title and 11 August 2026 posted date, while original 20-study and 28-student datasets, rater/permission records and journal review correspondence remain outside accessible primary sources. Review the remaining unresolved public email difference between the current website and the latest résumé, without changing the preferred address without the author's permission. Inspect the site's cross-page author credentials and research descriptions for factual conflicts backed by documents. Keep the Editor V2 browser failures and public served-byte parity as separate open tracks.

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
