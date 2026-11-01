# Stage C-X3c2f | Response examples 101–113, final individual editorial batch

1 November 2026. Continued from [C-X3c2e, response examples 76–100](RESPONSE_EXAMPLES_CONTENT_AUDIT_C-X3c2e_2026-11-01.md). This stage individually reviewed every substantive property of the final 13 response-example entries against canonical Rescue field help, the corresponding student guide and the wider example study's evidence definitions. The 113-entry response-example prose audit is complete at **source-editorial level**, not browser/runtime or live-publication level.

## Exact final batch

| Entry | Field | Review status |
|---|---|---|
| 101 | `litCompare` | Reviewed, retained |
| 102 | `alternatives` | Reviewed, retained |
| 103 | `limitations` | Corrected |
| 104 | `implications` | Reviewed, retained |
| 105 | `future` | Corrected |
| 106 | `discussionDraft` | Corrected |
| 107 | `conclusionDraft` | Corrected |
| 108 | `abstractDraft` | Corrected |
| 109 | `titleDraft` | Reviewed, retained |
| 110 | `keywords` | Corrected |
| 111 | `citationStyle` | Reviewed, retained |
| 112 | `citationAudit` | Reviewed, retained |
| 113 | `finalEdits` | Corrected |

## Substantive issues and corrections

**An unmeasured construct was still appearing in the written conclusions.** Previous checkpoints C-X3c2d and C-X3c2e clarified that the illustrative radish experiment records visible-shoot presence and shoot length on Day 7, not a separately defined radicle-emergence measure of germination. The `limitations` example previously described the combined outcome as germination plus subsequent growth. Its short and expanded examples now describe the intended visible-shoot-and-length measure and explain why it cannot demonstrate germination success or isolate post-germination growth. The expanded `discussionDraft` now states that a separate germination measure would be needed, and its selected-subset comparison is described without implying that the corresponding causal mechanism was observed.

**Proposal abstract and conclusion.** The expanded `abstractDraft` now retains visible-shoot status in place of an uncollected germination variable and defines the combined outcome without mislabelling it. Its short opening is now explicitly called a **preview**, with instructions to consult the complete expanded example. The `conclusionDraft` likewise refers to the actual visible-shoot-and-length measure. Neither example invents an observed growth difference or results from a completed study.

**Specific future research and discoverability.** The `future` model now identifies an independent germination measure requiring an explicit radicle-emergence criterion, so the proposed follow-up can separate a new germination observation from shoot length in seedlings. `keywords` replaces the methods-oriented phrase 'experimental units' with terms naming sodium chloride and visible-shoot emergence, improving alignment with the phenomena and measured outcomes.

**Final revision list.** `finalEdits` now prompts reconciliation of dish counts, independent-unit graphs, the no-visible-shoot versus missing-record rule and claims supported by original sources. It no longer refers to 'ungerminated seeds' when germination was not measured.

**Complete versus preview models.** The `discussionDraft` primary example is an expressly labelled opening and its expanded model has 450 words across six paragraphs, within the stated 300–700-word range. The `abstractDraft` primary example is labelled a preview, while the complete hypothetical proposal abstract has 186 words, within the stated 150–250-word range. Both length notes explicitly distinguish the previews from full models. The text is intentional instructional scaffolding, not a completed investigation.

**Editorial restraint.** The remaining six entries were read and retained. Conditional literature comparison, hypothetical implications, source-linked citation checking and genre-specific APA-style selection were already appropriate and required no unsupported modifications. No fictitious results, citations, DOIs or claims of participant data were added.

## Commits implementing the last batch

Changes were made in small source updates to reduce interruption risk.

- Final checklist initial correction: https://github.com/gmoon-code/research-methods/commit/a23e7f1b817ef433672d8a9956731cf8c261e819
- Searchable keyword correction: https://github.com/gmoon-code/research-methods/commit/47bfcb2e925cf66480507f720d4769547ae66cd8
- Discussion uncollected germination measure: https://github.com/gmoon-code/research-methods/commit/a9ea3315c504810327f11c98d5fd441114d4bd8a
- Discussion combined-outcome clarification: https://github.com/gmoon-code/research-methods/commit/ad7918d4d5e0ebf214e6f26aa3414651e244b96a
- Discussion selection-boundary clarification: https://github.com/gmoon-code/research-methods/commit/16608b6ce803960aa010c2c0a9162557707e6732
- Abstract measured-status correction: https://github.com/gmoon-code/research-methods/commit/b3870bbe17343387d20741525ec3f0c6cbef3b90
- Limitations construct and inference corrections: https://github.com/gmoon-code/research-methods/commit/15c6d1f7cf421b31da9e6df54a7fc326cce0eb70 and https://github.com/gmoon-code/research-methods/commit/001e8942e671f43658e8732da9baa10a4826d272
- Full-versus-preview conventions and future germination definition: https://github.com/gmoon-code/research-methods/commit/9813a3c1024e1c5ead6f423e1d20d8f76ec2807f
- Final limitations length and clarity: https://github.com/gmoon-code/research-methods/commit/f74a477f95379358462a12624c187c49519049d6
- Conclusion construct alignment: https://github.com/gmoon-code/research-methods/commit/528f8ebceefc22a7b7bffdbe73bdd21db6194b3f
- Explicit abstract-preview label: https://github.com/gmoon-code/research-methods/commit/c0b90233f69fb956df289f645fde16870c5f0797
- Active response-example runtime synchronisation: https://github.com/gmoon-code/research-methods/commit/2c504c12938bfab0fdd8c6283017b77c74282192
- Final-stage test source assertions: https://github.com/gmoon-code/research-methods/commit/a34c4519ab3a0458814d5da647f31b577bcc2f38

## Verification and audit boundary

Re-fetched and parsed `assets/response-examples-v2.11.json` and active `assets/response-examples.js`, compared complete objects, and verified **deep equality**. The full file contains 113 expected field entries. All keys, labels, stages and field types match `assets/rescue-model-v2.5.json`, and student-guide entries resolve. The final 13 entries have nonempty examples and explanations without em dashes; all ordinary examples meet their specified response lengths. The two deliberately short writing previews link to full expanded models within the advertised lengths. Compared with the preceding C-X3c2e checkpoint, **exactly seven of the final 13 entries changed**; entries 1–100 remain unchanged. Source-level test assertions were added for final-stage content and complete field coverage, but **the Node test suite was not executed**. Browser rendering, storage persistence and deployed parity also remain unverified.

**C-X3c2b through C-X3c2f now provide per-entry editorial evidence for 113/113 response-example objects. This does not establish that the entire academic website audit is complete.**

## Exact continuation checkpoint

**Stage C-X3c3a | Student guidance and research glossary, entries 1–30 of the 90 glossary definitions**, beginning in the current order of `assets/student-guidance.js`. After glossary, review the 113 student-guide field entries and the 18 stage guides, remaining novice-friction and supplementary help strings, and cross-system/cross-page consistency. Preserve the completed 113 field Rescue scaffolds, 32 lab tabs, 113 response-example records and 20 reviewed transfer tasks. Finish with actually executed Node tests, real visitor-browser interactions and publication-parity checks before declaring any full site verification.
