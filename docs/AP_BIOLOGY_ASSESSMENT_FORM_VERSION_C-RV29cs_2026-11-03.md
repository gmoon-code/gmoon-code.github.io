# C-RV29cs | Unit 2 and Unit 3 assessment-form provenance, public-source qualifier and verified correction

**Date:** 3 November 2026. **Continued from:** [C-RV29cr](LATE_OCTOBER_ACTION_MANUSCRIPT_SITE_CROSSWALK_C-RV29cr_2026-11-03.md). **Scope:** Actual two author-held edited test PDFs, the late-October action-research manuscript's Appendix A, current `teaching-ap-biology.html`, related action-research prose, the AP Biology page visitor test and real GitHub Pages deployment parity. **Outcome:** Identified a material instrument-version discrepancy and **corrected only the public page's unsupported original-form/point-value precision**. The exact administered question version remains unverified.

## New private source materials

A targeted original-document search returned two private teaching assessment PDFs, both dated **2 September 2026 as Library records**. Those are file availability dates, **not verified administration dates**:

- `Unit 2 Test VA - Edited.pdf`, seven pages. Its Unit 2 free response comprises several subparts of a larger amphibian-skin passage. The relevant **subpart (b)** requires identifying the affected sodium-transport mode and explaining the proposed connection to dehydration, worth **two classroom points** in this edited version. The wider test text states an electrolyte/dehydration premise; the public Action Research page already treats that premise as an assessment assumption whose biological support requires qualification.
- `TEST Unit 3 Cellular Energetics - Edited.pdf`, four pages. Its **question 24** is a Bentazon/PSII/plastoquinone mechanism item, **five classroom points** in the available edited PDF. The item supplies more extended scientific background, including the role of plastoquinone and the downstream cytochrome complex/proton pumping, before asking for a detailed explanation of how inhibition can lead to plant death.

Both are **editorially named “Edited”**, with no separate teacher administration log, original assessment distribution timestamp or retained student response-sheet facsimile. They are *plausible source instruments* for the same mechanisms, and their document contents can be compared directly. They are **not established as the exact forms completed by the 28 research participants**.

The 29 October author writing sample's **Appendix A** describes shorter Unit 2 and Unit 3 target questions, each marked **two points**. The Unit 3 paragraph is the short sentence reproduced on the public AP Biology teaching case. The same manuscript's Methods describes each selected question as worth **two classroom points**. The edited Unit 3 PDF's **five points** and more detailed question wording differ from that report. For Unit 2, the edited PDF's relevant two-point **subpart** is contextually compatible with the selected mechanism, but its full lead-in and question demand are not identical to Appendix A.

### What this comparison establishes, and what it does not

**Established:** The available private edited test PDFs and the author manuscript's reproduced prompt texts **are materially different versions or representations** of the same mechanism questions. The Unit 3 question's displayed point value differs, **five in the edited teaching PDF versus two in the research manuscript**. The edited Unit 3 question gives additional explanatory scaffolding whose presence would matter when interpreting how explicit the original versus reconstruction prompts were.

**Not established:** Which instrument version was actually administered, whether a two-point subset was extracted or locally rescored from a longer classroom item, whether the edited PDF was subsequently changed, or whether all 28 students saw the same variant. The earlier [C-RV29ca](ACTION_RESEARCH_OCTOBER_WORKBOOK_VERSION_DELTA_C-RV29ca_2026-11-03.md) workbook source-text revisions remain a separate original-response provenance issue. Neither selected PDFs nor the author's manuscript are **signed administrative permission records or original student response facsimiles**.

The observed source difference is a **serious methodological version-control question** worth preserving for author verification. It does **not** independently invalidate the 28/84 cohort records, 7/18/25 classifications, 10-pair findings or 5/2/2/1 descriptive result. It does, however, prevent an independent auditor from confirming the exact administered prompt wording, original classroom mark value and relative prompt scaffolding.

## Specific public wording issue corrected

The original `teaching-ap-biology.html` source Git blob was `a28fe352109ad12508f0ad481e6aba32455d5739`. In the visitor-facing first teaching case, it called the blockquote **“Original assessment question”**, labelled it an **“Original two-point free-response prompt”**, claimed it was reproduced from the student-facing question, and later said all 28 answered the **two-point question**.

Those statements were consistent with the late manuscript, but **the available edited test file contradicts the unqualified implication that the exact original administered form and points had been authenticated**. Rather than declare the edited five-point version authoritative, the source was corrected narrowly in commit [44f4370](https://github.com/gmoon-code/gmoon-code.github.io/commit/44f437044391d1e06dd43fe28b79ad29edd8f405):

1. Heading now states **“Assessment question recorded in the manuscript”**.
2. Metadata describes **“Wording reproduced in the research manuscript”** and no longer asserts a two-point administered prompt.
3. Supporting note states **“This wording follows the assessment question reproduced in my research manuscript.”**
4. The 28-student step says they answered **“the selected Unit 3 question”**, omitting the unverified mark value.

The main Bentazon blockquote itself is **unchanged** because it accurately represents the **manuscript's** reproduced version. The paragraph-level scientific mechanism, source attribution, 28-student cohort, original/reconstruction distinctions, timing, 10-pair case classes, limitations, image credits, citations and proposed questions were deliberately preserved. The page remains recognizably in the author's measured, academically precise voice, without new formulaic transitions or invented qualifications.

The short prompt is still presented with the correct origin in the manuscript rather than silently substituted with a different edited test. The public `research-action.html`, Research hub, Home and CV did not make the same exact point-value claim and required **no edits**.

## Source and production verification actually performed

Changed only `teaching-ap-biology.html`, plus the precise associated test fixture `scripts/audit-teaching-ap-biology.py` (commit [9271533](https://github.com/gmoon-code/gmoon-code.github.io/commit/92715335d68fc9533a121d70ae215bfbc3bba613)) so its expected A4 document heading matches the warranted source wording. The amended page's current Git blob is **`8ee23b30ab5bfbdc7e6b70604472179b1841abd2`**.

Independent [AP Biology visitor audit run 41644840666](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41644840666) **passed all eight asserted checks**. The workflow checked five responsive widths (**320, 375, 768, 1024 and 1440 px**), keyboard behaviour, dark appearance and the A4 print heading, retaining screenshot/PDF/source artifacts.

An earlier [published academic main-text parity run 41644754716](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41644754716) **initially failed** because the deployed `teaching-ap-biology.html` still served the previous prose while its source commit already contained the correction. The audit showed **15 other sitemap pages passing** and only AP Biology unverified under a repeated source/served text mismatch. This was a **real temporary delivery divergence**, not a passing result or evidence that the new edit had been served at that point.

After [GitHub Pages run 41644964602](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41644964602) reported successful build and deployment, the failed parity run was **re-executed**. Its second attempt/job **125948820005 passed in one comparison attempt**, with all **16 sitemap-listed academic pages including AP Biology** returning **HTTP 200 and exact normalized source-to-served `main` text equality**. The second attempt's machine-readable result is archived as workflow artifact **13234112223**. The local AP Biology test and the public-source parity verification are distinct checks.

The cited source/test SHAs were fetched at the time of revision. Other concurrent repository commits concerned independent audit documentation; no inference is made from their number about the deployed editorial page's content.

## Primary-record and ethics boundaries

The site does not claim the edited five-point form is the original. Its research methods descriptions remain **manuscript-consistent**, but the exact administered Unit 3 question, grading conversion and student-facing instruction difference remain **blocked pending historical document version evidence**. This is now a **specific newly identified instrument-version blocker**, added to the earlier original student response, dated transcription/revision, executed school/guardian permission and final August scoping S2B/S2C source gaps.

The original 29 October manuscript Table 2 also claims selected excerpts retain original student grammar, while the archived analytic response strings underwent documented later text-version changes. That **literal wording / transformation chain** still cannot be independently authenticated. None of the newly located edited tests resolves that separate issue.

No private test PDFs, student answers, manuscript pages or personal identifiable student materials were uploaded to public GitHub.

## Exact next checkpoint

**C-RV29ct | Administered-assessment provenance and change-specific audit integrity.** First reconcile the newest current Git source and tested deployment after the AP Biology content change. If a timestamped administered Unit 3 instrument, original grading scheme, signed/dated classroom documents or original response facsimiles become available, compare the actual text and point value against the edited PDF and manuscript without assuming either existing source is authoritative. Otherwise preserve this source-version issue as **Reviewed with issues / instrument source blocked**, maintain the legitimate public manuscript-provenance qualification and avoid inferring the study's statistical results are wrong.

All 53 Research bibliography original-access grades remain **46 F / 6 A / 1 M / 0 P**. The site as a whole remains **In progress**, not fully factually verified.
