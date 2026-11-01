# Stage C-RV5 | Primary-record, DOI registry and research-status reconciliation

Date **2 November 2026**. Continued from [C-RV4g](RESEARCH_OVERVIEW_SOURCE_AUDIT_C-RV4g_2026-11-01.md).

## Source and method coverage

Inspected the current GitHub versions of `research-scoping.html` (blob `3f3378957c7d43017535a59a2a8e847f0adaf571`), `research-action.html` (`9ea3be0587046aef644787b8522cabe6f942c468`), `cv.html` (`d97a7f361ca1d9757ff7619ecc39d981799608ad`), `research.html` (`9437512368d44a590b3d986f82bb8e6d6eea61ad`) and `index.html` (`bbc4cac2ddc7ce3b719b59d31529228f3cb6ba46`). Checked the previous C-RV1–4g ledgers, the full site audit, public search, native GitHub source inventory, available conversation/Project file search, and the saved scholarly-metadata CI result.

## Crucial new primary registry evidence

Direct attempts to open `https://doi.org/10.35542/osf.io/kznvj_v1`, the OSF preprint route and DataCite API through the current external browser were inaccessible. Searches for this precise DOI/title did not reliably retrieve the publication. **This access restriction did not establish that the DOI was invalid.**

The existing repository workflow `.github/workflows/audit-research-metadata.yml` runs `scripts/audit-research-metadata.py`, querying **Crossref first** and storing the actual registry response. [GitHub Actions run 41319251599](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41319251599) completed **successfully** on 1 November 2026, using source commit `8605f53ce129be927c4d482cd063eef2402e5af0`. Its [saved JSON metadata](RESEARCH_METADATA_LATEST_RESULTS.json) records:

- Crossref HTTP status **200**, registry **Crossref**.
- DOI **`10.35542/osf.io/kznvj_v1`**, subtype **preprint**, work type **posted-content**, publisher **Center for Open Science**.
- Title **Evidence Routes and Validity Risk in Claims About Multilingual Learners’ Science Understanding in Secondary Science: A Scoping Review**.
- Author **Ye Eun Moon**, created and posted **11 August 2026**, publication year **2026**.
- Workflow report `preprint_review=false`, no manual-review entries, 59 distinct DOI references and 67 citation occurrences at that tested commit.

These independent registry data **confirm preprint DOI identity, author, title, date and work type** across the CV and scoping-review page. They **do not** establish that OSF content can currently be downloaded by every visitor, that its text matches the website's account, that the underlying study coding is correct, that a separate preregistration is unembargoed, or that the work has been peer-reviewed. Earlier C-RV1's interim inability to retrieve registry metadata has been superseded by this discovered saved result and an explicit addendum was committed to the C-RV1 ledger.

## Project status and numeric reconciliations

- `research-scoping.html` calls the manuscript an initial 2026 ERIC-bounded review and preprint, and `cv.html` reproduces the DOI and title. This is consistent with the Crossref metadata. The additional databases investigated or planned for an expanded future review have **not** been misrepresented as contributing to the 216-record initial corpus.
- The reported ERIC selection arithmetic is consistent: **216 − 137 = 79** sought, **79 − 1 = 78** assessed, **78 − 58 = 20** included. The forms of evidence **8 + 7 + 5 = 20**. These are **source-page arithmetic checks**, not independent re-screening of ERIC records or original coding.
- `cv.html` calls the action research an **under-review manuscript**. `research-action.html` calls it **unpublished**. These descriptions are compatible. Confidential journal status is **author reported**, not independently verified from the publisher or an editorial decision. Neither page implies acceptance or journal publication.
- Both sources use the same action research manuscript title. The 28 students, unit-specific 7/28, 18/28 and 25/28 classifications and ten paired explanations match across the CV, Research page and individual report where included. The different biological mechanisms and changed prompts continue to prevent treating these counts as general learning gains.
- School director authorization, independently managed consent, student assent, applicable guardian permission, 24 recoded responses and reader agreement **remain claims requiring original institutional and empirical records for independent verification**. Search of accessible Project/conversation files found no usable original source corpus, permission letter, de-identified response log or editorial-review correspondence. Absence of these private records from accessible files should not be interpreted as evidence that they do not exist.

## Verification and editorial decision

Executed **16/16 targeted checks** against current source and the saved registry response: Crossref identity/status/author/date/title, DOI on both pages, cross-page scoping title and 20-study framing, selection arithmetic, three evidence-form counts, action research title, class size, complete-mechanism counts, ten-pair reconstruction status, ethics caveat and compatibility of under-review/unpublished labels.

**No public page wording was changed**, because no factual inconsistency or demonstrable prose weakness was established by the accessible evidence. The two scholarly research pages retain their earlier carefully qualified language. The [main audit coverage index](CONTENT_AUDIT_SUPPLEMENTARY_COVERAGE_2026-11-01.md) now records Crossref corroboration and the remaining limits, and [C-RV1](SCOPING_PRIMARY_SOURCE_AUDIT_C-RV1_2026-11-01.md) has an explicit DOI addendum.

## Remaining evidence and next continuation

Unverified records include (1) the full 20-study original scoping chart, ERIC export, search filters and second-reader log; (2) original 28-student responses, rating logs, consent/assent/permission materials and four practitioner notes; (3) live OSF manuscript file retrieval and the exact present journal review status; and (4) live public served-byte parity and the separately documented Editor V2 browser regression failures.

**Stage C-RV6 | Public identity and institutional provenance reconciliation.** Investigate the unresolved **two-address contact discrepancy** reported in the original audit between the current Contact/footer address and the author's latest résumé, but **do not change the public contact address without the author's preference**. Check cross-page credentials, degree dates, job titles and institutional descriptions against the latest available author-supplied documents and official institutional information. Prefer stable, source-backed corrections; record personal-authority-dependent questions as unresolved. Review all adjacent prose and update the comprehensive ledger before returning to remaining empirical record and runtime parity issues.

**Status:** DOI metadata factually Crossref-corroborated; cross-page project statuses source-consistent; original research/ethics records and journal status not independently corroborated. Whole-site academic audit remains **In progress**.
