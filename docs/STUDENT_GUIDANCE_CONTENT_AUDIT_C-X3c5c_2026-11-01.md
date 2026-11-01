# Stage C-X3c5c | Student-guidance stage summaries 13–18 of 18

1 November 2026. Continued from [C-X3c5b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c5b_2026-11-01.md). Individually reviewed the six final student-guidance stage objects against the same canonical curriculum, nine pathway families, previously reviewed Rescue help, response-examples model and the author's evidence-integrity and writing-style rules. This completes the **source-editorial inspection of all 18 student-guidance stage summaries**, not the whole website or actual browser execution.

## Coverage decisions

Every `title`, `plain`, `steps`, `strong`, `examples`, `stuck`, `terms` and `walkthrough` was examined in stages 13–18. No structural keys were removed. Seventeen source-value revisions were made.

| Stage | Substantive scope | Values edited | Outcome |
|---|---|---:|---|
| 13 | Cleaning, data integrity and descriptives | 4 | Corrected examples to Day 7 `shoot_length_cm`, `visible_shoot` and per-dish summaries; separated observed absence from missingness and radicle emergence |
| 14 | Analysis selection and inference | 0 | Individually reviewed and retained. The existing paired-binary, independent numerical and repeated-binary analyses distinguish design and outcome structures appropriately |
| 15 | Results writing | 3 | Replaced an unexplained numeric result with a clearly illustrative reporting instruction; qualified a hypothetical sleep-score correlation as insufficient without sample/uncertainty information |
| 16 | Discussion, mechanisms and limitations | 5 | Strengthened evidence-led paragraph development, mechanistic uncertainty, meaningful limitations and non-formulaic continuation |
| 17 | Conclusion and abstract | 3 | Distinguished a proposal's planned methods from completed research findings; discouraged findings or causal effects implied by a title |
| 18 | Final academic audit | 2 | Required checking adjacent-sentence relationships, paragraph transitions, repeated rhetorical structures, Canadian English and coherent claims across sections |

### Data examples

Stage 13 previously used `height_cm` and `germinated` as examples, potentially suggesting that the source-verified salinity dataset recorded radicle emergence. The revised guide uses `shoot_length_cm`, Day 7 visible-shoot coding, per-dish summaries, and separate observation status. Unobserved seeds cannot be silently coded as zero. The demonstration also clarifies that absence of a visible shoot does not determine whether radicle emergence occurred. Qualitative evidence is acknowledged as requiring an inspectable corpus and analysis trail.

### Statistical reasoning

Stage 14 was retained. The examples differentiate paired binary change (McNemar-type reasoning), two independent numerical groups (conditional Welch comparison), and repeated binary observations on the same units (Cochran's Q as a possible omnibus approach). The section does not force an inferential test or quantitative estimand onto qualitative questions. No alteration was justified by the current source audit.

### Reporting and interpretations

Stage 15 no longer uses a fictitious 1.8 cm difference as though it were an observed result from identifiable data. Its reporting example asks students to supply their calculated difference, uncertainty interval and justified test details. The fictional correlation of `r = .52, p < .01` remains explicitly illustrative, with a warning that a complete report requires sample information and appropriate uncertainty.

Stage 16 now lets the reasoning determine paragraph order, rather than making the Discussion a predictable sequence of distinct rhetorical moves. Claims should distinguish measured processes from proposed mechanisms. A limitation must show which interpretation it constrains and what additional evidence would clarify the boundary; it is not included as a routine disclaimer. The fictional sleep-score explanation is explicitly qualified and does not assert causation.

Stage 17 distinguishes a completed empirical abstract from a proposal. A proposal describes intended inquiry and does not fabricate findings. The title must not claim an unverified causal effect. Stage 18 adds an explicit read-through for natural sentence-to-sentence and paragraph connections, accumulated repetition, Canadian English and cross-section consistency, making the author's editorial preferences part of the final-check guidance rather than a generic instruction to proofread.

## Commits and verification

- Final stage-source revision: https://github.com/gmoon-code/research-methods/commit/188b6ef29fad108b2cfb76a8e43a869fea4f36d0
- Regression assertions: https://github.com/gmoon-code/research-methods/commit/3794da7ea2c875d018dd9e28b6ef3ce24c25dc4c

Re-fetched `assets/student-guidance.js` and compared its parsed source recursively to the immediately preceding blob `7dcda21224211ab665acd3cd03e8d4311f7ce893`. Exactly **17 paths** changed, all within stages 13–18. Stages 1–12 remained identical, as did all 113 previously reviewed field guides, all 90 glossary entries, the laboratory guidance, choices and novice-promise text. Targeted source-content checks passed. Fourteen new Node assertions were committed, but **the Node test suite was not executed in this session**. Runtime rendering, note persistence and public-deployment parity have not been verified.

## Stage-summary completion record

| Batch | Entries individually reviewed | Corrected source values |
|---|---:|---:|
| C-X3c5a (1–6) | 6 | 29 |
| C-X3c5b (7–12) | 6 | 24 |
| C-X3c5c (13–18) | 6 | 17 |
| **Stage-summary total** | **18 / 18** | **70** |

These counts represent revised values, not unique entries. Stage 14 was examined and retained. All 18 summary entries are now reviewed at the source-editorial level. The overall comprehensive website audit is still in progress.

## Exact next continuation point

**Stage C-X3c6a | Student-guidance laboratory text, first coherent set of 32 lab-guide descriptions and help blocks.** Inspect the `labs` object in `assets/student-guidance.js` (literature, methods, data, writing). Verify each help entry against the curriculum, relevant laboratory source materials, the Rescue lab scaffolds, response examples and the research-methods data-model; preserve findings/plan distinctions, correct statistical and ethics claims, maintain the author's voice, verify source diff and add regression tests. Split into manageable laboratory batches rather than assuming all 32 are correct. Record the exact following item after each batch.

Remaining broader tasks include further novice-friction and interface-support prose, cross-system and cross-page content reconciliation, executing the Node suite, browser checks and public-site verification. The 18/18 stage-summary completion does not imply any of those are complete.
