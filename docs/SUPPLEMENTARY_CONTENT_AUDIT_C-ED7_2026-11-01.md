# Supplementary link/document content audit | C-ED7

Date 1 November 2026. Continued from [C-ED6](SUPPLEMENTARY_CONTENT_AUDIT_C-ED6_2026-11-01.md).

## Repo-wide local document inventory

Queried the complete current Git tree of `gmoon-code/gmoon-code.github.io`. There are **no locally hosted PDF, DOC, DOCX, PPTX, XLSX or CSV files** in that repository; the only matching plain-text utility was `robots.txt`. This establishes a local-file inventory only; the website links to externally hosted academic papers, course standards and synthetic CSV datasets in other repositories.

## External materials and sampled page linkage

Retrieved the current HTML source of 13 substantial portfolio/research/teaching pages and inspected their anchors for document-like destinations, DOI links, research records and official downloadable course descriptions.

| Page | Current source evidence / material linked |
| --- | --- |
| `research.html` | 57 external anchors, 50 DOI/source-like matches, including repeat citations. Bibliography was editorially audited earlier; this pass did not independently open every journal work or confirm full texts. |
| `research-scoping.html` | OSF preprint DOI `https://doi.org/10.35542/osf.io/kznvj_v1`, plus linked scholarship. The original study corpus and embargo conditions remain primary-record verification boundaries. |
| `writing-biological-classification.html` | Linked peer-reviewed articles and academic books via DOI. Existing page-level review retained; original full texts were not rechecked in this inventory. |
| `cv.html` | The scoping review preprint DOI; underlying qualifications and employment primary records still require separate verification. |
| `teaching.html`, `teaching-ap-biology.html`, `teaching-ap-chemistry.html` | College Board hosted Biology/Chemistry Course and Exam Description PDFs and scholarly DOI resources. These PDF files are external, not part of the local portfolio repository. |
| `teaching-ap-evolution.html` | Several DOI-linked sources and additional research links. |
| `research-methods-studio.html` | Two GitHub-linked synthetic radish dataset CSV files in the separate `gmoon-code/research-methods` repository. The exact file paths exist in that repository's current Git tree, with sizes 462 and 2188 bytes respectively. Their synthetic status is explicitly labelled on the teaching page. |
| `index.html`, `research-action.html`, `story-method.html`, `contact.html` | No directly linked `.pdf`/DOI/OSF documents in the anchor subset scanned, but ordinary references and project links remain. |

The numerical inventory describes the HTML anchors, not unique articles. No HTTP link-resolution or academic metadata cross-check was carried out in this stage. No downloaded document content was treated as independently corroborated. **No revisions were justified by the existence-only audit.**

## Browser and interface QA carried forward

As documented in [C-ED5](EDITOR_CONTENT_AUDIT_C-ED5_2026-11-01.md), the real Editor V2 browser tests on commit `13e8334` revealed specific failures, including image effects, group geometry, multi-selection and text reflow/save. The errors remain unresolved, with logs and tests retained for engineering QA. They are distinct from content-source validations and do not automatically invalidate the scholarly research pages.

## Exact next continuation

**Stage C-RV1 | Prioritised primary-record and citation reconciliation.** Return to earlier editorially reviewed but not yet factually complete scholarly pages. Start with the scoping review page and its original corpus/preprint DOI, then action research methods and numerical/ethical records, then the classification essay's original cited publications. Compare each exact current claim to the corresponding accessible original, label any unverified claims as such, and make only evidence-supported wording corrections. Continue the supplemental route inventory if a newly linked public resource is discovered. Do not substitute internal editorial consensus for external evidence or treat the 19-page editorial register as full factual verification.

**Status:** C-ED7 external material and local-file inventory complete within stated sample; underlying academic sources and linked file contents not fully audited. The overall website content audit remains **In progress**.
