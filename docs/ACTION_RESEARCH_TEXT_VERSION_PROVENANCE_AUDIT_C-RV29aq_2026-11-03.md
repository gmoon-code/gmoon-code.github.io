# C-RV29aq | Assessment and reflection text-version provenance, with bounded public disclosure refinement

**Date:** 3 November 2026. **Resumed from:** [C-RV29ap](ACTION_RESEARCH_PAIRED_TEXT_PATTERN_AUDIT_C-RV29ap_2026-11-03.md). **Status:** Cross-checked **two September assessment CSV snapshot schemas**, September reflection CSV records, and the later original analytic workbook. Identified a consequential **source-text version boundary without changes in research classifications**. Corrected **one sentence** identifying the retained analytic source of the public paraphrases. **Original classroom student-verbatim provenance remains unverified**; no student wording or row-level private data was published. Comprehensive website content audit remains **In progress**.

## Actual documents compared and chronology

The user's authorized private Library contains these historical source files, consulted read-only through its file reader and the installed spreadsheet toolkit:

1. Two `Assessment_Response_Data.csv` snapshots associated with **16 September 2026**. One includes the extra `primary_complete_outcome` and common-link fields; the other exposes the simpler `complete_mechanistic` flag. They contain **84 matched student-unit rows**, 28 records for each of Units 2, 3 and 4. Their **response text, mechanistic classifications and scientific-accuracy classifications are identical to each other** for all 84 matched records. Their column-schema differences are not a new research result.
2. `Reflection_Text_Data.csv` associated with **16 September 2026**, containing **31** anonymized rows, 21 Cycle 1 reflection sets and 10 Cycle 2 reconstruction/reflection sets.
3. `Final_Research_Workbook(20260926-093002).xlsx` of **26 September 2026 UTC**, originally audited in [C-RV29ao](ACTION_RESEARCH_RETAINED_ANALYTIC_SOURCE_AUDIT_C-RV29ao_2026-11-03.md), and its worksheets `05_Student_Data`, `06_Assessment_Responses`, `07_Reflection_Text`, `14_Case_Integration`.
4. The dated private `Full_Integrity_Audit_2026-09-20.txt` summarizes a then-retained analytic package, explicitly acknowledging the absence of classroom-original response facsimiles and documentation of any pre-archive textual normalization. This checklist alone cannot authenticate later September edits or any supposedly verbatim classroom submission.

These are **versioned retained analytic data**, not a direct chain from original student scripts. The source names and dates describe files accessed, without claiming independently established authorship of every transcription or why revisions were performed.

## Reproduced comparison findings

**Assessment-response text:**

- **84/84** rows pair uniquely by pseudonymized student ID and unit across the earlier CSV and 26 September workbook.
- **0/84 exact text matches.** None of the 84 answer strings is identical between the two periods. None becomes identical after lowercasing and normalizing Unicode, punctuation and whitespace. This is **wider than a punctuation-only or formatting-only difference**; the wording changes materially across the retained files.
- **84/84 mechanistic-structure codes unchanged**, **84/84 scientific-accuracy codes unchanged**, and **84/84 complete-mechanistic outcome flags unchanged**.
- **84/84 stored word-count fields unchanged**. In a separate direct read of the 26 September workbook, splitting each new retained text on whitespace recomputed its stored word count **exactly for all 84 rows**, including the correct unit-specific medians **40, 74 and 62** words. Numerical agreement of the stored field is real. It does **not** establish which version's wording corresponds to an original classroom answer.
- A bounded normalized lexical-token overlap check averaged about **0.39** across paired versions, confirming that the differences include word choices and phrasings rather than typographical conversion alone. This is an *informal descriptive similarity measure*, not a scholarly plagiarism, authenticity or transcription-quality statistic.

**Linked reflection and reconstruction text:**

- The 16 September reflection CSV and 26 September workbook match **31/31** pseudonym-and-cycle record identifiers.
- **31/31 reasoning/reflection text fields** differ, as do their **31/31 transferable-feature explanation texts, 31/31 preparation-plan texts, 31/31 enactment-report texts and 31/31 combined reflection texts**. The principal source text fields have a systematic version difference.
- The **21 reasoning-specific reflection flags**, the **10 reconstruction-completeness flags**, and all additional transferable-feature, planning and reported-enactment flags have **identical coded values** after normalizing a CSV export difference between numeral forms `1.0/0.0` and `1/0`. A naive string comparison falsely suggests 21+10 coding changes; those are **formatting differences only** in the code flags. Do not report them as substantive recodings.

**What follows and what does not:** Stable coding supports manuscript **numerical reproducibility from the different retained versions**. It does **not establish stable relation-level evidence under independent recoding of the early response/reconstruction text**, nor provide an independently authenticated original transcript. It is unwarranted either to discard the study's recorded counts as fabricated or to declare historical source authenticity proven on the strength of stable code flags. The present issue is a **documented provenance gap across differently worded retained records**, requiring an original-submission or documented revision/transcription chain for resolution.

## Check of current public case interpretations

The publicly named S01 and S20 contrasts were inspected against **both source versions** at the level of explicit scientific terms, independently of their unequal wording.

- Both versions of S01's original Unit 3 answer express the decline in ATP associated with electron transport and the proton gradient, without expressing the NADPH/Calvin-cycle/carbon-fixation branch. The later reconstructed record contains additional downstream causal material. The site paraphrase matches the later retained analytic records, with no assertion that it quotes the original classroom artifact verbatim.
- Both early and later versions of S20's Unit 3 original mention proton pumping, gradient, ATP and NADPH. The later reconstruction records are shorter or less connected in different ways across versions. The qualitative **omission** contrast is still plausible at this level, while the exact student wording and the detail of what was omitted remain version-specific.
- The site expressly distinguishes manuscript-reported predominant patterns from what can be concluded about a student's underlying ability, identifies retrospective questions as **not administered**, and describes the two selected case explanations as **paraphrases**. Existing causal and task-equivalence limitations remain appropriate.

A full independent **earlier-September** re-adjudication of the ten predominant pair patterns was not undertaken here. C-RV29ap's 5/2/2/1 check applies to the later 26 September retained analytic workbook and the later manuscript. **Do not claim that the materially different earlier texts have been independently demonstrated to yield every identical qualitative pair assignment.**

## One small public-text provenance correction, implemented

The current `research-action.html` paragraph after the S01/S20 paraphrases previously said:

> These descriptions paraphrase de-identified student responses and are not verbatim excerpts.

That wording might imply that the original, independently authenticated student scripts were available for direct paraphrasing, a stronger assertion than the surviving versioned analytic records establish. I replaced **only that one sentence** with:

> These descriptions paraphrase the de-identified records retained for analysis and are not verbatim excerpts.

The new version identifies the **actual material** used for the examples, keeps their nonverbatim status, and maintains the author's natural restrained tone without inserting a heavy editorial disclaimer into the cases. It does not describe the edited analytic text as historical classroom-verbatim speech or make a claim about how the revisions occurred.

**Actual public GitHub commit:** [`33dba48`](https://github.com/gmoon-code/gmoon-code.github.io/commit/33dba48e0cf1830bca6742c994c2735619dd8bdc). Source `research-action.html` changed from blob **`96afc4845591d699a3f20e9dc229ccea1fc496ed`** to **`80277bba0aa0ad715be87865e5a30e609b419147`**.

## Post-commit verification and status

Re-fetched source blob `80277bba0aa0ad715be87865e5a30e609b419147` from GitHub and compared its full HTML content with the immediately preceding committed blob. The source differs by **that one disclosure sentence only**. **14/14 targeted source checks passed**, including the 5/2/2/1 table, C-RV29ap's corrected interpretation, 7/10 reconstruction count, task-specificity and causality disclaimers, retrospective nonadministration, five case sections, **7 unique IDs**, **6 valid same-page links**, and absence of em dashes in the main prose.

**Status distinction:** Later analytic counts, coding flags and worksheet internal consistency are **verified at the retained-record level**. Public case wording and paragraph connections are **Editorially verified** and now provenance-qualified. **Authentic historical original student wording**, undocumented rewriting/transcription history, independent second-reader sheets, consent/assent and school authorization remain **blocked or independently unconfirmed**. Neither the school study nor the entire website should be marked Fully verified. No private student excerpts, full source tables or student-level hash lists were added to the public repository.

## Exact next continuation point

**C-RV29ar | Independent ethics, authorization and reader-document access check.** Search available private Project/Library files for original institution-director authorization, participant and guardian consent/assent materials, dated independent-rater records, adjudication logs and original response facsimiles. Distinguish **generic templates or draft forms** from **completed permission or consent evidence**, and independent reader narratives from actual dated dual-coded outputs. Do not transfer private administrative or student records to public GitHub. Compare only specific publicly asserted methods/ethics claims in `research-action.html` with authentically available source documentation; preserve claims as *author-reported* when records are not located. Do not infer consent was absent or fabricate sign-off. Keep the **source version ambiguity** here unresolved until original submissions or a trustworthy transformation log permits resolution. Record a bounded result and exact next checkpoint; keep publisher/browser parity and final-August scoping S2C separately blocked.
