# Stage C-X3c2b | Response examples 1–25, sentence-level editorial audit

1 November 2026. Continued from [C-X3c2a supplementary content inventory](RESCUE_CONTENT_AUDIT_C-X3c2a_2026-11-01.md). This stage is an editorial review of the **first 25 of 113** visitor-facing response-example entries, in canonical order, not just a metadata check.

## Scope

Read every field in the first 25 `assets/response-examples-v2.11.json` objects, including `expected_shape`, `typical_length`, `length_note`, `too_vague`, `good_working_response`, `detailed_response` when present, and `why_it_works`. Compared each with its corresponding `rescue-model-v2.5.json` Levels 1–5, `student-guidance.js` field guidance, expected curricular sequence, task-specific evidence boundaries and the author's editorial requirements.

The 25 entries in reviewed order are:

| Entry | Field | Result |
|---|---|---|
| 1 | `interest1` | Reviewed; retained |
| 2 | `problem1` | Corrected; reviewed |
| 3 | `claim1` | Reviewed; retained |
| 4 | `access1` | Reviewed; retained |
| 5 | `ideaA` | Reviewed; retained |
| 6 | `ideaB` | Reviewed; retained |
| 7 | `ideaC` | Reviewed; retained |
| 8 | `broadTopic` | Reviewed; retained |
| 9 | `subtopic` | Reviewed; retained |
| 10 | `phenomenon` | Reviewed; retained |
| 11 | `contextPop` | Reviewed; retained |
| 12 | `scope` | Reviewed; retained |
| 13 | `timeLimit` | Reviewed; retained |
| 14 | `resources` | Corrected; reviewed |
| 15 | `safety` | Reviewed; retained |
| 16 | `topicChoice` | Reviewed; retained |
| 17 | `concepts` | Reviewed; retained |
| 18 | `synonyms` | Corrected; reviewed |
| 19 | `prelimSearch` | Corrected; reviewed |
| 20 | `known` | Corrected; reviewed |
| 21 | `methodsSeen` | Corrected; reviewed |
| 22 | `uncertain` | Corrected; reviewed |
| 23 | `questionShift` | Corrected; reviewed |
| 24 | `rq1` | Reviewed; retained |
| 25 | `rq2` | Corrected; reviewed |

## Significant findings and justified revisions

**Research provenance and academic claims.** The example of a classroom observation used a colon-led hypothetical label; it now integrates the hypothetical status into a natural sentence. The preliminary-search example required actual findings in its `expected_shape`, while its model provided **queries only**. The shape and explanatory rationale now explicitly permit planned queries and require dates and findings only after execution. The 'established knowledge' and 'methods seen' examples were revised to distinguish candidate claims or extraction schemes from study characteristics verified in actual literature. The uncertainty example now frames differences in recall-test timing as a question for comparison, not a demonstrated research gap.

**Conceptual precision.** The synonym bank now distinguishes closely related search terms from terms that refer to a distinct measurement occasion, avoiding an uncritical equivalence between 'delayed test' and 'delayed recall'. The materials example now includes a height-measurement ruler and separates laboratory equipment from permissions and supervision required for the proposed salinity investigation.

**Research-question development and coherence.** The question-revision model now identifies its hypothetical reading exercise and the evidence-generation insight prompting the revised observational question. The second research-question model now offers a qualitative alternative to the first candidate's numerical association, explaining the new source of evidence and participant safeguards. The alternative is meaningfully different while remaining tied to delayed biology recall.

**Writing style.** Edited models avoid unnecessary colon-led labels, exaggerated claims and generic research assertions. Their explanations reflect actual task logic rather than repetitive praise. Sixteen sufficiently clear entries were preserved without superficial rewriting.

## Source commits

- Canonical response models, nine edited entries: https://github.com/gmoon-code/research-methods/commit/3102df15486890b76c01f7f672a9421270bb5b80
- Active visitor-facing response model synchronisation: https://github.com/gmoon-code/research-methods/commit/93bdaba95c68264d13f2c98dfd52470c3f172ae0
- Regression assertions for the first 25 examples: https://github.com/gmoon-code/research-methods/commit/065dadc216238333a2390c07a4b56fd5309bbd59
- Correction of regex escaping in those assertions: https://github.com/gmoon-code/research-methods/commit/80767354216dd40bb1e53db160db50c5eeafdc70

## Verification

Re-fetched canonical and runtime models, parsed both successfully, and checked equality. They match. Every reviewed example retains matching field ID, stage, type and label against the canonical Rescue schema, has a nonempty shape and substantive example, and falls within its stated illustrative word-count range. All 25 remain free of em dashes in their authored content. Compared against the previously committed response-example version: **exactly nine of the first 25 entries changed, and the other 88 of 113 examples remained unchanged**. New test assertions were checked in repository source for accurate regular expression escapes; **Node tests have not been run**, so no complete package-test result is claimed.

Factual limits: The pedagogical examples are hypothetical. Search strings are proposals, not executed database searches. Their general scientific reasonableness and methodological boundaries were checked against existing curriculum and guidance, but the examples do not constitute externally validated evidence or live empirical findings. Browser rendering and publication parity remain unverified.

## Status and continuation

**C-X3c2b: Entries 1–25 individually editorially reviewed, nine corrected and synchronised, source-level verification completed; browser/runtime testing outstanding.**

**Exact next stage: C-X3c2c | Response examples 26–50**, beginning with the 26th canonical key `rq3` and continuing through `litDraft`. Read and compare every meaningful property of each example with its Rescue and student-guide equivalents; correct only substantiated problems, preserve the other 88 entries and existing laboratory revisions, synchronise the active model, verify and record a new ledger. Then continue in further 25-entry batches to 113/113. Thereafter finish other supplementary prose and full cross-system, browser and live-publication verification.
