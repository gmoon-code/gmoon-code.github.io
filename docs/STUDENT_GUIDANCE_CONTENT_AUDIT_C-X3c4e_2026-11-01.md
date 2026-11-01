# Stage C-X3c4e | Student-guidance fields 101–113, completion of field-help editorial review

1 November 2026. Continued from [C-X3c4d](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c4d_2026-11-01.md) with exact source-level scholarly review of the final 13 field-help objects in `gmoon-code/research-methods/assets/student-guidance.js`. Each `meaning`, `write`, `example`, `questions` and `avoid` was compared against the corresponding five-level Rescue help, previously corrected `response-examples-v2.11.json` and the academic author's writing rules. This concludes **113/113 student-guidance field entries** at the *editorial source-verified* level.

## Individually reviewed entries

| # | Field | Outcome |
|---|---|---|
| 101 | `litCompare` | Corrected |
| 102 | `alternatives` | Reviewed and retained |
| 103 | `limitations` | Reviewed and retained |
| 104 | `implications` | Corrected |
| 105 | `future` | Corrected |
| 106 | `discussionDraft` | Corrected |
| 107 | `conclusionDraft` | Corrected |
| 108 | `abstractDraft` | Reviewed and retained |
| 109 | `titleDraft` | Reviewed and retained |
| 110 | `keywords` | Reviewed and retained |
| 111 | `citationStyle` | Reviewed and retained |
| 112 | `citationAudit` | Reviewed and retained |
| 113 | `finalEdits` | Corrected |

## Substantive issues and corrected content

**Source-specific comparison.** `litCompare` had a fictitious comparison described as 'two earlier studies' pointing in a similar direction. Although marked fictional, that example could be read as a ready-to-cite empirical pattern. The guide now asks students to verify each source's population, salinity range, outcomes and actual estimates before claiming convergence, and explicitly warns against invented support.

**Bounded implications and follow-up.** `implications` now presents a local result conditionally rather than treating a hypothetical outcome as completed, and distinguishes a warranted question for further inquiry from a broader behavioural recommendation. `future` now aligns its follow-up with the actual seedling example's limitations, proposing additional independently assigned dishes and a separately defined radicle-emergence germination measure instead of assuming germination was observed in the Day 7 visible-shoot records. The germination/visible-shoot distinction is supported by Northam and Callihan, *Weed Science*, https://www.cambridge.org/core/journals/weed-science/article/abs/interpreting-germination-results-based-on-differing-embryonic-emergence-criteria/7275DF289D02657CD2C20E2867E8425D.

**Authorial style and paragraphs.** `discussionDraft` now develops interpretations from actual evidence, allowing relevant literature, alternatives and limitations to enter where they intellectually change the claim. Its reflection questions explicitly test adjacent-sentence progression and unresolved inference. The source no longer endorses a fixed sequence of rhetorical moves or mechanical transitional phrases. `conclusionDraft` now distinguishes the bounded verified answer in completed work from the purpose and contribution of a proposal. It does not report hypothetical effects as established.

**Final audit precision.** `finalEdits` now identifies exact checks on independent-unit counts, visible-shoot coding and source-to-claim citations, then requires a rereading of adjacent paragraphs and related sections for consistency, supporting the author's primary writing-style rules.

Seven other entries were read and retained. Their source-integrity warnings, genre-specific abstraction guidance, title and keywords, citation-style requirements and hypothetical examples were already defensible. No gratuitous changes were made to their prose.

## Implemented commits

- Final 13 field-guide revisions, six entries: https://github.com/gmoon-code/research-methods/commit/373073a9ff36c39cc0c54bde8f2e5f217ba854c9
- Regression assertions for the last batch: https://github.com/gmoon-code/research-methods/commit/0618e9fc3febb8a43fe228458b6930bfc256c872

## Verification and scope

Re-fetched `assets/student-guidance.js` and compared with Stage C-X3c4d's version. **Exactly six** fields among entries 101–113 changed. All fields 1–100 remain unchanged, as do the glossary's 90 definitions, 18 stage guides, 32 lab helpers, choice maps and remaining metadata. All 113 field entries have nonempty `meaning`, `write`, `example`, `questions` and `avoid`, with no em dashes, and keys resolving in both the current canonical Rescue and response-example models. Six new content assertions matched source values; `tests/student-guidance.test.js` now contains assertions for all five completed field batches. These checks are **source-level only**. The Node tests were committed but not executed in a checked-out repository, and real browser, note persistence and deployed parity remain outstanding.

## Overall student-guide field status

| Field-guide editorial batch | Individually reviewed | Edited | Retained |
|---|---:|---:|---:|
| C-X3c4a, entries 1–25 | 25 | 10 | 15 |
| C-X3c4b, entries 26–50 | 25 | 15 | 10 |
| C-X3c4c, entries 51–75 | 25 | 18 | 7 |
| C-X3c4d, entries 76–100 | 25 | 20 | 5 |
| C-X3c4e, entries 101–113 | 13 | 6 | 7 |
| **Total** | **113** | **69** | **44** |

Other source-reviewed components of this project include the 113 Rescue field scaffolds, 32 Rescue laboratory tabs, 113 response examples, 90 glossary definitions, 20 transfer tasks and Path Coach cross-system field assignments. Their source-review results should not be misrepresented as proof of deployed browser functionality.

## Exact next unfinished stage

**Stage C-X3c5a | Student-guidance stage summaries 1–6 of 18.** Review each stage object in `assets/student-guidance.js` in order, including `title`, `steps`, `examples`, `stuck`, `terms` and any extra properties, comparing each with `assets/curriculum.js`, the Rescue field help, the nine Path Coach pathways and all research-status distinctions. Pay particular attention to actual search records, unsupported study examples, research approval, scientific inference, Canadian English and the author's natural paragraph-level prose. Apply minimal warranted corrections, preserve completed field guide and glossary content, verify and save the next ledger.

Then examine stages 7–12 and 13–18, the separate 32 lab-guide descriptions, novice-friction/remaining help text, cross-system and site-wide academic writing, and actual Node/browser and deployed-publication verification. **Do not claim the entire website audit is complete.**
