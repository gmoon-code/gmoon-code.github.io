# C-RV29by | Two non-DOI scholarly destinations independently rechecked

**Date:** 3 November 2026. **Continued from:** C-RV29bx. **Source pages:** `research-scoping.html` and `pungmul.html`. **External evidence:** actual first-party publisher article and Korea Citation Index publication record, with the original CI access failures retained as distinct evidence.

## Why this review was necessary

`docs/EXTERNAL_RESOURCES_LATEST_RESULTS.json` from external-resource workflow **41591205466** has **71 reachable / 44 unverified** base-HTTP outcomes. Exactly **two** unverified URLs are category `external` rather than category `scholarly-identifier`:

1. `https://onlinelibrary.wiley.com/doi/full/10.1002/sce.21622` in `research-scoping.html`, which returned **HTTP 403** to both automated HEAD and GET.
2. `https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001857639` in `pungmul.html`, which returned **405 to HEAD** and a **GET read timeout**.

HTTP 403, method-not-allowed and a timeout in that particular checker are not independent proof that the destination is removed or incorrect.

## Wiley publisher original and Figure 3

An independent publisher-page retrieval on 3 November 2026 opened the exact linked Wiley URL, `https://onlinelibrary.wiley.com/doi/full/10.1002/sce.21622`. The displayed article is *Scientific modeling and translanguaging: A multilingual and multimodal approach to support science learning and engagement* by **Ashlyn E. Pierson, Douglas B. Clark and Corey E. Brady**, *Science Education*, **105(4), 776–813**, published online 5 May 2021, DOI `10.1002/sce.21622`.

The current public Scoping Review page describes **Luis, Carlos and Sean’s biosphere plan** and links to the article as the original Figure 3. The publisher's own article displays **Figure 3** with caption identifying Luis, Carlos and Sean’s biosphere plan. The surrounding original text supports the website's specific paraphrase: Carlos used drawings, string, stickers and numbering, Luis wrote a mixed Spanish-English ecological relationship and subsequently shortened its English rendering, and Sean challenged use of Spanish. These are **source-grounded descriptions** of the study's case, not invented participant records.

**Decision:** Retain the existing link and wording. The specific Figure 3 and article identity are publisher-confirmed. The historical automated HTTP-403 outcome remains a genuine limitation of that runner, not an invalid-source conclusion.

## KCI first-party record and Pungmul bibliography

The independently retrieved original KCI record at the *exact site-linked URL*, article ID **ART001857639**, identifies **박흥주 / Heung-Ju Park**, publication year **2014**, journal **실천민속학 연구**, volume **23**, pages **115–163**, and the Korean title

`1980년대 전반기 서울지역의 풍물운동계열 작품에 나타난 굿성 연구－1980~1987년 6월항쟁 사이의 작품을 중심으로－`.

This matches the author-year, title, journal, issue and page range in `pungmul.html`. The KCI abstract concerns Pungmul Movement performances before the 1987 democratic struggle, their treatment of `굿성`, and the relationship between embodied tradition, movement practice and performance form. The website's bracketed English explanatory translation is reasonable, limited contextual assistance rather than a fabricated published English title.

**Decision:** Retain the original KCI URL and site bibliography. The earlier CI check's HTTP-405 response to HEAD and GET timeout do not justify replacing a now independently verified primary index link.

## Updated evidence classification and limitations

Both linked **identities and citation contexts are verified against first-party source pages** in this targeted scholarly-content audit. Both were also readable through the web retrieval pathway available in this stage. This is a **new verification method and time**, not retroactive proof that the old GitHub Actions check actually fetched either site successfully or evidence that every visitor/browser can access them consistently.

The original machine report's **44 unverified** remains intact as a historical automated HTTP-check status. Its other **42 scholarly identifiers** were checked through separate registry/secondary-index procedures, which do not independently confer full-text article verification. The Research bibliography's separately authored **42 F / 10 A / 1 M / 0 P** source-reading levels remain unchanged. No source status was silently upgraded across registers.

No academic page HTML, bibliography, user-authored writing or original research data was changed.

## Exact next stage

**C-RV29bz | Source-priority triage of remaining evidence-limited scholarly claims.** Reconcile which of the 15 secondary-index-only DOI outcomes from the latest register still have credible publisher or institutional landing evidence and choose a genuinely unreviewed or weakly grounded reference passage. Do not repeat previous completed 53-entry audits unnecessarily. If the original full texts or private consent/student records are inaccessible, preserve the precise limitation and record a bounded source-level decision, rather than claiming complete evidence verification.
