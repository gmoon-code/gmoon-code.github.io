# C-RV29ct | Residual assessment scoring claims in the AP Biology teaching page

**Date:** 3 November 2026. **Continued from:** [C-RV29cs](AP_BIOLOGY_ASSESSMENT_FORM_VERSION_C-RV29cs_2026-11-03.md). **Scope:** Live repository source for `teaching-ap-biology.html`, related `research-action.html`, `research.html`, `cv.html` and `index.html`; the existing AP Biology visitor regression test; and the same two private Unit 2 and Unit 3 edited assessment PDFs retained in the authorized Library. **Outcome:** Two remaining unsupported original-assessment mark-value references removed and verified in an actual browser/print CI run. The historical administered form and mark allocation remain independently unverified.

## What was actually inspected

The relevant private PDFs were retrieved and read again by document page, without uploading their pages or the student response archive to public GitHub. In `TEST Unit 3 Cellular Energetics - Edited.pdf`, page 4, question 24 contains a longer and more explicitly scaffolded Bentazon/plastoquinone/cytochrome item marked **five points**. In `Unit 2 Test VA - Edited.pdf`, page 5, the targeted amphibian sodium-transport subpart (b) is marked **two points** within a multi-part task. These are document statements, not proof of administration or authentic grading.

The [29 October author manuscript comparison](LATE_OCTOBER_ACTION_MANUSCRIPT_SITE_CROSSWALK_C-RV29cr_2026-11-03.md) documented a **shorter two-point Unit 3 target question** and selected research classification criteria. The material difference between the retained edited Unit 3 PDF and manuscript appendix persists. It cannot be resolved from these two versions alone.

The prior C-RV29cs correction had updated the main quoted prompt label, but a new exact-source scan found **two lingering occurrences** of the unsupported “two-point” assumption elsewhere in the same AP Biology page. Related Home, Research, Action Research and CV source pages were also searched for original item point-value assertions, with **none found under the searched terms**. This was a targeted claim scan, not a new sentence-by-sentence read of those four unchanged pages.

## Two issues and narrow changes

1. In the `#bio-record-criteria` section, the introductory paragraph said the research classifications were distinct from **“the two-point scores students received on the original assessment.”** This was not independently established for the actual administered Unit 3 form. The replacement is **“These research classifications described the causal relationships expressed in students’ explanations, using criteria separate from classroom marks.”** This preserves the crucial analytic/teaching-score distinction without inventing a mark value, a grading conversion or blind coding.

2. In `#bio-assessment`, the closing disclaimer contrasted the constructed prospective task with **“the original two-point classroom question”**. That repeated the same unverified mark assumption and reiterated distinctions already sufficiently explained by the section heading, hypothetical experimental setup and prospective teaching context. The replacement retains the substantive attribution and removes redundant restatement: **“The experimental values and student task are constructed examples.”**

No mechanism diagram, research classification criterion, student count, pattern interpretation, citation, task data, headings, section order or personal reflection was revised. The two revised passages are shorter and maintain the author's measured prose; no em dash, unnecessary rhetorical contrast or mechanical transition was introduced.

**HTML commit:** [`7f147bec`](https://github.com/gmoon-code/gmoon-code.github.io/commit/7f147beca823e70fae2b20ddd1d5881034402f13). Re-fetched revised `teaching-ap-biology.html` blob: **`f1e4366a1fc33fd66586d438b50156ef0d45641c`**. Direct exact-text checks found both replacements and neither old sentence. A subsequent case-insensitive search of its entire HTML source found **zero remaining “two-point” or “five-point” references**.

## Regression fixture and actual verification

Added a visitor-audit guard in `scripts/audit-teaching-ap-biology.py` which checks the actual `#main` browser text for two- or five-point item assertions and preserves the correct manuscript-level attribution of the displayed prompt. The guard does not claim to authenticate original scoring. **Test commit:** [`e1a9211`](https://github.com/gmoon-code/gmoon-code.github.io/commit/e1a9211d0aa74e3c6e5450937aa0b0061cf09789). Verified test blob: **`8fffff3b0c71b836eb2353090d8c488f40a7b5eb`**.

Actual [AP Biology visitor audit run 41646793446](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41646793446), source commit `e1a9211d0aa74e3c6e5450937aa0b0061cf09789`, finished **success**. The fetched job log explicitly records five responsive Chromium checks at **320, 375, 768, 1024 and 1440 px**, plus keyboard, dark appearance and **11-page A4 print** checks, ending **“SUMMARY 8 checks 0 failed.”** Screenshot, source and PDF evidence was uploaded to CI artifact **13235960534**.

These tests establish local browser-source rendering and bounded print/layout behaviour for the tested commit. They do **not** independently establish publication on the current Pages CDN, authentic historical classroom instruments, original response quotations, or executed permission documents. Public delivery of this *latest* amendment requires a fresh source-versus-served check after a successful deployment; the earlier 16/16 parity success applied to the preceding C-RV29cs text.

## Unresolved primary source limits

**Status:** Teaching wording **Editorially verified** and bounded CI/browser verified. Actual administered question version, original scoring scheme, historical classroom mark allocation and independent original response surfaces **Reviewed with issues / Blocked**. The supplied edited test's five-point question must not be silently treated as the administered form. The late manuscript's two-point description must not be promoted to externally authenticated scoring either.

The retained analytic findings (28 participants; 84 assessment records; Unit 2/3/4 complete classifications 7/18/25; ten pairs and 5/2/2/1 pattern categories) were not recomputed in this narrow stage, and no contradiction to them was inferred. The September/October response-string transformation, original consent/school permission evidence and final August scoping row-level S2B/S2C remain separately unresolved.

**Research-source register:** unchanged at **46 F / 6 A / 1 M / 0 P**. **Whole-site audit:** In progress.

## Exact next checkpoint

**C-RV29cu | Current live-public delivery of the AP Biology corrections and evidence-gated assessment provenance.** Verify that the Pages deployment for the amended HTML has succeeded and obtain fresh actual public `main` text equality (rather than inheriting the prior parity run). Reconcile the corrected source and current delivered page. If a dated administered Unit 3 form, actual marks/rubric, unmodified student response facsimile or record-transformation log appears, perform the appropriate source-to-claim comparison. Otherwise retain the explicit instrument-version uncertainty, and continue to a genuinely unreviewed issue or new source rather than rereading the same manuscript or asserting complete research verification.
