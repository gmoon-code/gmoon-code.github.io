# Stage C-X3c7a | Novice promise and first five research-choice guidance groups

1 November 2026. Continued from [C-X3c6d](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c6d_2026-11-01.md). Reviewed the standalone `novicePromise` and `choices.questionType`, `choices.gapType`, `choices.designType`, `choices.hypothesisNeeded`, and `choices.citationStyle` against the source-visible guidance UI, previously audited curriculum, response examples, Rescue field scaffolds and nine research pathways. Examined each title, prompt, option description and reflection question. Status: **source-editorially verified**.

## Per-item review

| Object | Outcome | Rationale |
|---|---|---|
| `novicePromise` | Corrected | Replaced an impersonal statement about what the website 'should' explain with direct, gentle student guidance about using Research Terms/Student Guide and recording uncertainty |
| `choices.questionType` | Corrected one option | Descriptive salinity example now measures Day 7 visible shoots per dish rather than asserting radicle-defined germination; other six explanations and the questions were retained |
| `choices.gapType` | Corrected one option | The documented-literature-gap definition now specifies coverage of recorded searches and reviewed studies, and discourages global absence claims from quick searches; other seven options retained |
| `choices.designType` | Corrected one option | Quasi-experimental description now requires an intervention or change with appropriate comparisons/time structure and acknowledges nonrandom assignment and causal limits; other eight options retained |
| `choices.hypothesisNeeded` | Reviewed and retained | Already distinguishes confirmatory prediction from descriptive/exploratory research and permits genuine uncertainty |
| `choices.citationStyle` | Reviewed and retained | Already directs students to assignment or disciplinary requirements rather than defaulting to an unsupported style |

Four source values changed across the onboarding promise and 29 option descriptions in the five reviewed choice groups. Explanatory questions, choice labels and panel titles remained unchanged. The updates follow the author's careful, direct student-facing voice without unnecessary abstract language.

## Source implementation and verification

- Content commit: https://github.com/gmoon-code/research-methods/commit/5bf8596265a82a08ebca5628478dd33228ced134
- Regression assertions: https://github.com/gmoon-code/research-methods/commit/db02142d54fc5c879e0c82f896a42705285735aa

Parsed the committed guidance and recursively compared it with the pre-audit Git blob `8d708c0079e23019a12b385fbc382337a08c8c91`. Exactly four leaf values changed. All 18 stage summaries, 113 field entries, 90 glossary entries and 32 laboratory descriptions are unchanged, as are the 16 other choice groups. The selection labels still correspond to the canonical pathway model and Rescue choices. Direct source-level assertions passed. **Node tests were committed but not executed; browser and live-publication parity remain unverified.**

## Exact next continuation point

**Stage C-X3c7b | Remaining choice guidance, methodological choices 6–13 of 21:** `mdAssignment`, `mdSameUnit`, `msMethod`, `meHuman`, `meMinors`, `meIdent`, `meSensitive`, `meIntervention`. Review every prompt, choice label, option definition and reflection question against the Methods Lab and ethics guidance, applicable institutional boundaries and canonical Rescue help. Preserve direct vs indirect identification, voluntary recruitment and sampling/assignment distinctions. Then audit choice groups 14–21, including source screening, synthesis stances and statistical test options.
