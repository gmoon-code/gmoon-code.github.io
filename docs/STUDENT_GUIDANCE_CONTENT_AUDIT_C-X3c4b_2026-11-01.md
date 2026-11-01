# Stage C-X3c4b | Student guidance field entries 26–50

1 November 2026. Continued from [C-X3c4a, student-guide fields 1–25](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c4a_2026-11-01.md) during the comprehensive academic website written-content audit.

## Actual reviewed scope

Read every `meaning`, `write`, `example`, `questions` and `avoid` for fields 26–50 in `gmoon-code/research-methods/assets/student-guidance.js`. Checked wording against its mapped `rescue-model-v2.5.json` five levels, the individually audited `response-examples-v2.11.json`, stage guidance and the established non-formulaic, precise Canadian English authorial style. The study examples remain hypothetical and must not masquerade as completed literature retrieval or empirical evidence.

| Entry | Field | Editorial result |
|---|---|---|
| 26 | `rq3` | Corrected; source-checked |
| 27 | `questionType` | Corrected; source-checked |
| 28 | `finalRQ` | Reviewed; retained |
| 29 | `rqJustification` | Corrected; source-checked |
| 30 | `searchBlock1` | Reviewed; retained |
| 31 | `searchBlock2` | Corrected; source-checked |
| 32 | `searchBlock3` | Corrected; source-checked |
| 33 | `searchStrings` | Corrected; source-checked |
| 34 | `databases` | Corrected; source-checked |
| 35 | `includeCriteria` | Corrected; source-checked |
| 36 | `excludeCriteria` | Corrected; source-checked |
| 37 | `searchLog` | Corrected; source-checked |
| 38 | `theme1` | Reviewed; retained |
| 39 | `theme2` | Reviewed; retained |
| 40 | `theme3` | Reviewed; retained |
| 41 | `tensions` | Reviewed; retained |
| 42 | `repeatedLimits` | Reviewed; retained |
| 43 | `gapType` | Reviewed; retained |
| 44 | `gapStatement` | Reviewed; retained |
| 45 | `litToRQ` | Reviewed; retained |
| 46 | `litIntroPlan` | Corrected; source-checked |
| 47 | `litThemePlan` | Corrected; source-checked |
| 48 | `litTensionPlan` | Corrected; source-checked |
| 49 | `litEndPlan` | Corrected; source-checked |
| 50 | `litDraft` | Corrected; source-checked |

## Substantive issues identified and corrected

**Research-question development.** `rq3` previously illustrated another student-description question closely resembling the revised `rq2` example. It now presents a third route that reviews how published secondary-science studies measure delayed recall. `questionType` now models the actual selectable `Correlational / observational` value rather than a generic non-menu label. `rqJustification` previously called an identifiable-data linkage 'anonymous', even though matching survey reports to existing quiz scores requires an identifier or protected linkage process. Its example now explains voluntary participation, consent, approval, coded matching and the continuing non-anonymous status of the linked records.

**Search strategy and reproducibility.** `searchBlock2` previously illustrated a science-domain block even though the revised example sequence and Rescue source use *delayed recall or retention* as the second block. It now distinguishes outcomes from the tests that measure them. `searchBlock3` aligns the optional age/secondary-school context block with earlier search examples. `searchStrings` now demonstrates a proposed and explicitly database-labelled search that actually combines the relevant activity and outcome blocks, while requiring a separate log of the query after execution. `databases` now distinguishes planned coverage and unconfirmed access from actual searches performed. `searchLog` now labels its bracketed template as an unexecuted record and specifies actual database, platform, query, fields, filters, dates and count requirements. These choices align with Cochrane Handbook Chapter 4 https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-04 and Columbia University library search-strategy guidance https://library.cumc.columbia.edu/kb/developing-and-validating-comprehensive-literature.

**Eligibility decisions.** `includeCriteria` had explicitly admitted university learners even though the illustrative question and response models concern secondary-school science students. Its revisions now require an identifiable retrieval-based activity and a later learning outcome within the intended population regardless of result direction. `excludeCriteria` mirrors those rules, documenting exclusions for unsuitable contexts, absent required activity/outcomes and ineligible source types rather than convenient or inconvenient results.

**Scholarly argument and writing style.** `litIntroPlan`, `litThemePlan`, `litTensionPlan`, `litEndPlan` and `litDraft` previously presupposed recurring findings or fixed three-theme structures that had not been established through actual source review. The revised guidance allows the evidence to determine paragraph development, the number of sections and the level of comparison. Its literature-draft model is explicitly fictional and calls for checked source substitutions before making claims. Adjacent instructions progress from opening scope, through sources and tensions, to a defensible question without fabricating findings.

**Editorial restraint.** Ten fields were individually reviewed and retained because they already clearly distinguished provisional themes, checked-source evidence, bounded research gaps and appropriate synthesis. No change was made solely to increase the count of revisions.

## Implemented commits

- Question, search, database, screening and log instructions: https://github.com/gmoon-code/research-methods/commit/7b9814c8061911c14724a52dbb377ba9c923909b
- Literature synthesis and writing guidance: https://github.com/gmoon-code/research-methods/commit/16d72f01a0bcfd1511726fdd1d1909aba58c1642
- Targeted student-guide regression assertions: https://github.com/gmoon-code/research-methods/commit/1c690fbf057f2fd7091c6d7d21cd08e76a3a5f1a

## Verification and remaining test obligations

Read back the current `student-guidance.js` and compared it against the committed C-X3c4a version. Exactly **15 fields in entries 26–50** were changed. Entries 1–25 and 51–113 remain untouched, as do the full 90-term glossary, 18 stage guides, four laboratory guidance objects and mapped choices. All 25 reviewed entries have the required meaningful help fields and remain free of em dashes. Cross-checked keys against the preserved Rescue and response-example models. Ten targeted content checks matched the current parsed source. The additional Node regression assertions were committed but **not executed**; the repository remains inaccessible from the isolated local Node container. Browser behaviour, save state and deployed-publication parity remain unverified.

## Exact continuation

**Stage C-X3c4c | Student guidance entries 51–75**, starting `designType` and ending `procedure`, in object order. Check all help properties and surrounding materials for design–question correspondence, causal language, experimental/observational units, treatment vs measurement, nested records, privacy, ethical approval, procedural reproduction, missingness, research status and writing voice. Correct where supported; preserve earlier finished fields; compare before/after; add appropriate assertions and the next audit ledger.

Afterwards individually review entries 76–100 and 101–113, all 18 stage guides, lab-specific guide prose, novice/friction and supplementary help, and site-wide research writing. Executed Node tests, real-browser interaction and publication parity are prerequisites for claiming fully verified visitor-facing behaviour.
