# Stage C-RV1 | Scoping review primary-source reconciliation

Date 1 November 2026. Continued from [supplementary content C-ED7](SUPPLEMENTARY_CONTENT_AUDIT_C-ED7_2026-11-01.md). Current page source `research-scoping.html`, initial blob `2ce463698d24a930a289137ce49323f56e428263`.

## Coverage and external evidence

Read the entire page, including metadata, opening and title, section links, evidence-route cards, detailed Pierson case and three interpretations, reporting-condition table, ERIC selection flow, charting/search methods, limitations, references, image and footnotes where applicable. Compared its published-case description against the actual full journal article:

- Pierson, A. E., Clark, D. B., & Brady, C. E. (2021), *Scientific modeling and translanguaging: A multilingual and multimodal approach to support science learning and engagement*, *Science Education*, 105(4), 776–813, [publisher article](https://onlinelibrary.wiley.com/doi/10.1002/sce.21622). Journal article first published 5 May 2021. The source directly establishes a 9-week sixth-grade ecology unit in an English-dominant STEM classroom, as the fourth cycle of an iterative design-based study; Carlos and Luis's bilingual resources; Sean's difficulty reading Spanish and objection to using it; written representations, drawings, stickers, string and biosphere models; Luis's fuller mixed-language ecological explanation and compressed English translation; and the fact the teacher and researcher did not notice the peer language policing as it occurred.
- Kane, M. T. (2013), *Validating the Interpretations and Uses of Test Scores*, *Journal of Educational Measurement*, 50(1), 1–73, [publisher article](https://onlinelibrary.wiley.com/doi/10.1111/jedm.12000). Journal metadata and the argument-based validation framing were corroborated from publisher and ERIC records.

The Pierson case's claim that a shorter English sentence may omit distinctions apparent in the earlier bilingual response is supported by the actual two quoted study examples; it does **not** establish the participant's entire understanding. The author's editorial interpretation of peer uptake retains this distinction appropriately.

## Verified, calculated, and not independently verified

**Source corroborated:** Pierson journal metadata, ecology unit, context, Luis/Carlos/Sean descriptions, teachers' unnoticed language-policing exchange, the main bilingual–English representation contrast; Kane bibliographic details and the importance of validating interpretations with explicitly supported inferences.

**Arithmetic / internal consistency only:** 8 written + 7 talk + 5 modelling = 20 studies; 216 screened - 137 excluded = 79 full texts sought; 79 - 1 unavailable = 78 assessed; 78 - 58 excluded = 20 included. The overlap-warning for the separate learner reporting conditions was retained. These calculations do not authenticate original ERIC exports or the 20 article-level coding decisions.

**Still not independently verified:** Original ERIC export and search date and filter settings, 2010 eligibility decision, reported absence of duplicates, precise 14/20 focal language conditions, 5/20 programme placements, 1/20 newcomer status, per-paper evidence coding and inferential routes, second-reader audit, manuscript changes and version metadata. The OSF v1 DOI `https://doi.org/10.35542/osf.io/kznvj_v1` was attempted directly in the web tool and via the OSF preprint route and DataCite API; retrieval was inaccessible in this environment. The known link was preserved and neither availability nor inaccessibility to real visitors was inferred. The previous audit's original primary-data limitations were not overwritten.

A Project Files search for original manuscript/charting and 20-study documents returned no relevant study records in the available project attachments. A retrieval gap is not evidence that the corpus never existed.

## Justified source change

The published Pierson study is an explicitly iterative, design-based study, whereas the website originally said only that the authors `studied a nine-week ecology unit`. Revised that single sentence to `In the fourth cycle of a design-based study, Pierson and colleagues examined a nine-week ecology unit in an English-dominant sixth-grade STEM classroom.` This makes the method and unit of analysis more precise without expanding the paragraph, implying new findings or disrupting the subsequent sentence about one student group.

Actual production commit [7169d6b](https://github.com/gmoon-code/gmoon-code.github.io/commit/7169d6b3d44d85fa8914dd9834bd18de70dcfb7c). Re-fetched blob `3f3378957c7d43017535a59a2a8e847f0adaf571`.

## Post-change checks

Confirmed the new and absent former sentence, evidence card numbers 8/7/5, reporting table 20/14/5/1, ERIC detailed selection arithmetic, no broken fragment anchors, no duplicate HTML IDs, no em dashes in the reviewed visible text and agreement of the 20-study scope with Home. The initial check mistakenly searched unrendered HTML for continuous `8 of 20 studies` and `216 ERIC records returned`, whose words are separated by tags; it yielded two **test expectation errors**. Re-ran on stripped reader text and all four corrected assertions passed. No source change was needed for those tests. This was a source consistency check, not a rendered browser or fresh live-site fetch.

## Status and exact continuation

**C-RV1 source-corroborated for the published Pierson and Kane material and editorially/source verified for the one correction; private 20-study corpus and OSF metadata factually unverified.** The page is **not Fully verified**.

**Stage C-RV2 | Classroom action research primary-record reconciliation.** Read current `research-action.html` completely. Reconcile every count, ratio, table, paired pattern and chronology with any accessible manuscript and data records; inspect ethics and publication-status claims as specially sensitive. Use primary evidence where available, retain the distinction between task-specific classifications and measured learning, correct only directly supported errors and note unavailable individual response records. Update this ledger system and save the next exact checkpoint. Then proceed to classification essay claim-to-source verification.


## C-RV5 Crossref metadata addendum | 2 November 2026

A later inspection discovered an existing **successfully completed native GitHub Actions scholarly-metadata audit** ([run 41319251599](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41319251599), head commit `8605f53`). Its persisted [response record](RESEARCH_METADATA_LATEST_RESULTS.json) contains an explicit **HTTP 200 response from Crossref**, resolving `10.35542/osf.io/kznvj_v1` as a **2026 posted-content preprint** by **Ye Eun Moon**, titled *Evidence Routes and Validity Risk in Claims About Multilingual Learners’ Science Understanding in Secondary Science: A Scoping Review*, posted **11 August 2026**. The DOI, title, author and year agree with the current scoping-review page and CV. The metadata script separately checked 59 distinct DOI records and found no entries requiring manual correction in that execution.

**Updated evidence status:** The DOI's registration and bibliographic identity are **Crossref registry corroborated via a real CI run**, superseding the earlier provisional `unretrievable DOI metadata` remark in this file. Direct OSF reader-page access, actual downloadable manuscript content, the original 20-study coding file, source-level search logs and second-reader agreement remain **not independently verified** by this metadata response. The preregistration embargo cited elsewhere belongs to a different registration and should not be conflated with public preprint availability. There is no warrant to change the page's existing `2026 preprint` wording.
