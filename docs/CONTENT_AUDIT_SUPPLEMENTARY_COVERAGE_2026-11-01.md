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

**Stage C-RV1 | Prioritised primary-record and citation reconciliation.** Supplemental content stages C-ED5, C-ED6 and C-ED7 now record real-browser Editor V2 failures, a non-indexable historical preview fixture, the Fluid Layout Lab's unpublished status and inventories of external research documents. Resume source-to-claim verification on the scoping review page, followed by action research methods and numerical/ethics records, then original cited works in the classification essay. The 19 root public pages retain their earlier editorial reviews, but none of the still-open primary-source verifications is automatically complete.

The overall academic website audit is **In progress**. No whole-site Fully verified claim has been made.


## Subsequent source progress, 1 November 2026

- [C-ED5](EDITOR_CONTENT_AUDIT_C-ED5_2026-11-01.md) logged six distinct failed Editor V2 browser test cases across three failed workflows; UI implementation still requires functional remediation and retest. These are real test failures and cannot be described as passing browser QA.
- [C-ED6](SUPPLEMENTARY_CONTENT_AUDIT_C-ED6_2026-11-01.md) verified that the Fluid Layout Lab is unpublished and marked noindex, and added noindex metadata to an archived, older Home-page preview without rewriting the historical fixture.
- [C-ED7](SUPPLEMENTARY_CONTENT_AUDIT_C-ED7_2026-11-01.md) inventoried local and externally linked scholarly documents. The main repository has no local PDF/Office/spreadsheet files; two external-repository synthetic CSV paths exist. Original DOI-linked publications, College Board PDFs and primary study records remain to be checked on their own evidence.
