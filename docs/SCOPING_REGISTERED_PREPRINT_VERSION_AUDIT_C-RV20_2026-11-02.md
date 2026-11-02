# Stage C-RV20 | Authoritative scoping preprint abstract, coding-version reconciliation and published corrections

**Date:** 2 November 2026. Continued directly from [C-RV19](RESEARCH_PRIMARY_EVIDENCE_AUDIT_C-RV19_2026-11-02.md). This is a bounded scholarly-content stage. Published site delivery and original student/ethics records belong to separate verification tracks.

## Source chronology and evidence hierarchy

The preceding C-RV19 stage identified an authentic author-maintained July 2026 20-study extraction/screening workbook whose figures were being reproduced on `research-scoping.html`. July data gave 8 written, 7 interactional, and 5 visual studies, with 14 comparable focal-language conditions, 5 placement descriptions, 0 comparable prior-schooling entries and 1 newcomer report. The counts were internally recomputed from study-level source rows and the workbook contains a complete 216-record screening register. It is **evidence of the July coding state**, not automatically the final posted version.

This stage discovered four author-held **12 August 2026** manuscript versions in the author's personal Library. Their abstracts and finding tables consistently report 10 primarily written/constructed-response studies, 6 primarily classroom-talk/interaction studies, and 4 primarily representational studies. The later manuscripts also state 18 focal language conditions, 7 programme/instructional placements, 3 prior-schooling reports, 1 newcomer-status report, and no comparably reported biliteracy trajectory or earlier disciplinary-language exposure. Their original 216-screened/20-included selection totals remain constant.

The original metadata script `scripts/audit-research-metadata.py` saved only the first **250 characters** of the registered Crossref abstract. Consequently earlier metadata audits proved the August DOI/title/posted identity but had no abstract evidence to decide between coding versions.

In commit [c903793](https://github.com/gmoon-code/gmoon-code.github.io/commit/c90379391a1602326806d2398aec1882b29ba0dc), the script's existing field cap was increased conservatively to 5,000 characters. A fresh **successful native** [academic scholarly metadata workflow run 41367071570](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41367071570) retrieved and saved the complete **1,607-character** Crossref abstract in `docs/RESEARCH_METADATA_LATEST_RESULTS.json`. That registry abstract is associated with the **11 August 2026** posted preprint `10.35542/osf.io/kznvj_v1`. It **explicitly reports 10 written, 6 interactional and 4 visual studies**, and its opening/overall wording matches the August author manuscripts. [A later successful native run 41367250211](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41367250211) reproduced the registry result after the page edit.

**Evidence conclusion:** The old 8/7/5 website figures describe the earlier workbook and conflict with the publicly registered August preprint **abstract**. The 10/6/4 distribution now has authoritative DOI-associated registry support, beyond author working files. The actual OSF PDF download was again inaccessible to the available public web tool, and therefore complete **PDF-byte parity** has not been established. Crossref's abstract cannot prove the accuracy of each study's primary code.

The learner-profile counts 18/7/3/1 are consistently stated in August author manuscript methods/findings/tables but **not enumerated in the Crossref abstract**. They are *final-manuscript-correlated*, not independently re-counted from an August chart. The earlier July workbook cannot validate the updated subgroup counts.

## Specific coding transitions and method caution

Compared the July study-ID classifications against the 12 August manuscript's Table 1. The total corpus remains the same 20 studies. Only **two study IDs** changed dominant evidence form: S03 (Fine, 2022) changed from interactional to written assessment; S04 (Widing et al., 2022) changed from models/visual to written assessment. This explains the change from 8/7/5 to 10/6/4 without inventing an inclusion/exclusion change.

Primary publisher metadata reveals an important check for the next stage. Fine (2022), [original publisher abstract](https://www.tandfonline.com/doi/full/10.1080/15348458.2022.2058858), states that the author qualitatively examined illustrative **teacher–researcher conversations** during the Reflect and Modify phase of four co-design cycles. Widing et al. (2022), [original journal abstract](https://www.icaseonline.net/journal/index.php/sei/article/view/406), examined students' **polymeric concept descriptions** alongside audio and photographs of modelling. The Widing reclassification may be defensible when the warrant is framed around concept descriptions; the Fine reclassification requires closer scrutiny of whether the review's target is student science understanding, teacher interpretation or teacher–researcher conversation. No full article-level recharting was claimed during this stage. Publication-date consistency does not remove this substantive coding uncertainty.

The August manuscript explicitly describes one primary reviewer and says the workflow did not include independent dual screening, duplicate charting, intercoder agreement or adjudicated consensus. The earlier author-held audit summary describes a **limited** four-included/four-excluded decision-record check for transparency and count consistency, *not* an intercoder reliability estimate. The website now describes a limited separate decision-record audit, without implying independent dual screening. Whether this limited audit's described procedure was carried out as documented still depends on original independent audit records.

## Changes actually implemented to public research prose

[Commit 8d234d5](https://github.com/gmoon-code/gmoon-code.github.io/commit/8d234d567c2ce7630c596490017cb3c7eb2f9a8e) changed exactly one public academic page, `research-scoping.html`:

1. Added the limited version-context clause explaining that the three evidence-form totals follow the **August 2026 preprint** classifications. The categories remain researcher assignments rather than objective attributes of each included article.
2. Corrected primary evidence-form cards from **8/7/5** to **10/6/4**, preserving the 20-study total and all scientific explanations.
3. Corrected focal-language reporting from **14/20** to **18/20** and programme/instructional placement from **5/20** to **7/20**.
4. Added a substantive **3/20 prior-schooling** row and corrected the previously inaccurate sentence saying no prior-schooling reports were available comparably. Biliteracy trajectory and earlier disciplinary-language exposure remain at zero comparable entries under the August manuscript's definition.
5. Refined the methods and limitations statements to distinguish a limited earlier audit of selected decision records from independent dual screening/duplicate charting or intercoder agreement.

Preserved the source-supported Pierson case explanation, 216/137/79/1/78/58/20 selection flow, DOI, bibliography, author voice, navigation, canonical, figure and text not affected by the coding-version correction. No other root page contained these obsolete detailed coding totals.

## Post-change verification

Re-fetched the GitHub repository page blob **`cf0eaaa192876264d47f57ea9b30ffec36e84ebb`**, and the saved native Crossref response. Ran **14/14 targeted source assertions**, all passed:

- DOI-associated registered abstract explicitly contains ten/six/four
- page cards exactly **10, 6, 4**, summing to 20
- learner-reporting table exactly **20, 18, 7, 3, 1**
- obsolete 14/20, 5/20 and false no-prior-schooling assertion absent
- prior-schooling row present
- prose acknowledges lack of independent dual screening and formal intercoder estimate
- no broken fragment anchors or duplicated element IDs
- no em dashes in reader-visible source text
- pre-existing canonical unchanged.

The updated native [metadata workflow run 41367250211](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41367250211) completed **successfully**, and its stored report confirms the Crossref evidence after the edit. Source checks are **not** a live browser evaluation. The revised passages were reviewed together with neighbouring explanations; corrections favour exact scientific provenance and the author's measured, connected prose rather than ornamental rewriting.

## Evidentiary status and exact next checkpoint

- **Registry verified:** identity and date of August preprint, registered abstract's 10/6/4 coding totals.
- **Author-manuscript corroborated:** 18/7/3/1 learner-context totals and detailed August study-ID table.
- **Earlier original workbook independently recomputed:** July 216-row selection and July coding profile only. It does *not* validate August recoding.
- **Still unverified:** actual OSF posted PDF byte content; subsequent full article-by-article recharting of Fine/Widing and any other ambiguously positioned sources; later August updated supplementary study-level matrix; original independent audit correspondence; private action-research response/rater/consent originals; public delivered pages.

**Stage C-RV21 | Inspect the two changed dominant-route assignments and final learner-context operational rules in their original research publications and any later available coded chart.** Begin with Fine (2022) and Widing et al. (2022), documenting why either would warrant the August classification. Reconcile the methodology statement with the scope of student-performance claims and leave any unsupported study-level inference explicitly qualified. Then continue the action-research original records and 53-reference access-tier closure as independent bounded stages.

**Whole-site audit status: In progress.** Scoping page counts are now aligned with the authoritative registered abstract and closely contemporary author manuscripts; neither this page nor the broader site is marked Fully verified.
