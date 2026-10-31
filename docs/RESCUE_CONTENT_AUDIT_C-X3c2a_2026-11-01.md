# Stage C-X3c2a | Supplementary response and transfer content integration

1 November 2026. Continued from [C-X3c1, cross-path integration](RESCUE_CONTENT_AUDIT_C-X3c1_2026-11-01.md).

## Reviewed material

- `gmoon-code/research-methods/assets/response-examples-v2.11.json` and active `response-examples.js` (113 field keys, metadata and sampled scholarly language).
- `assets/transfer-bank-v1.9.json` and active `transfer-bank.js` (all 20 candidate transfer tasks, including scenarios, prompts, competency criteria and cues).
- `assets/novice-friction.js` (visitor-facing checkpoint language and identified false-claim detection conditions) and `assets/student-help-ui.js` (field and general-help wording) examined as a preliminary content inventory, not yet fully editorially certified.
- `assets/curriculum.js`, `assets/rescue-model-v2.5.json` and `assets/student-guidance.js` for parallel field definitions.
- Existing response/transfer test source files.

## Identified and corrected issues

**Two response-example field labels disagreed with the canonical Rescue field labels.** `primaryEstimand` in the examples and curriculum described a 'quantity or phenomenon', although the canonical field is a quantitative estimand and is hidden for qualitative and narrative-review pathways. Its help now specifies the quantitative target, and a mixed-methods project addresses its qualitative question separately. `limitations` had a generic label while the field's actual expectation was at least two specific limitations and how each restricts interpretation.

Aligned the two labels in the response examples and curriculum with the canonical fields, refined the `primaryEstimand` expected response and explanatory guidance in the examples, and clarified the student-guide's `primaryEstimand` meaning, write guidance, illustration and self-questions. This leaves the response-example labels, stages and types matching all 113 canonical Rescue field entries.

**Two transfer scenarios blurred methodological or source status.** `TR15` requested a central result in an abstract without specifying whether the study was completed. It now explicitly concerns a hypothetical **completed** empirical study, so students are not encouraged to invent results for proposals. `TR16` cited an invented Garcia (2022) study as though it could be real; it now explicitly describes a **fictional citation-checking exercise and invented example source**. `TR13` uses Canadian `fertiliser` spelling in the scenario and title.

All 20 transfer tasks were examined for the relation between their scenario, requested decisions, criteria and cue. No other substantive correction was supported by this pass. The transfer bank remains explicitly unvalidated and is not represented as a secret assessment set.

## Implementation commits

- Canonical response-example corrections: https://github.com/gmoon-code/research-methods/commit/c16b40fa61d81b997e77609a6ff86af32564806d
- Active response-example sync: https://github.com/gmoon-code/research-methods/commit/8af12831a19069a8f4ae95e0f84e66acf3eddb9f
- Curriculum field-label alignment: https://github.com/gmoon-code/research-methods/commit/1042c328dbe84dd55dd891e60267556603f8d0f4
- Transfer task corrections: https://github.com/gmoon-code/research-methods/commit/a260baf430a0aff3307c29df496563750c010af5
- Active transfer-bank sync: https://github.com/gmoon-code/research-methods/commit/a422a33dd916dea2618133d4d129339331af097a
- Response-example content regression assertions: https://github.com/gmoon-code/research-methods/commit/25b20ceb18b9d576ce1549ac0ab8aa484b40a851
- New transfer-bank content consistency test: https://github.com/gmoon-code/research-methods/commit/3069f3357c862293e3d3d414f5f9afaf9e3d3d37e8
- Student-guide estimand alignment: https://github.com/gmoon-code/research-methods/commit/8dea2ee89ee77ba712509b09271be44cd7c60baa

## Verification

Freshly re-fetched and parsed both canonical models and active runtime equivalents. Response models match in full; transfer models match in full. All 113 example entries match their corresponding Rescue field key, stage, type and label. Curriculum labels for the two edited fields agree with Rescue. The student guide's estimand definition now distinguishes the quantitative component. All 20 transfer-task IDs are unique, and each task has a scenario, prompts, cue and competency-specific criteria. The two corrected contexts are explicitly identified as hypothetical. Cross-system regression assertions were committed.

**Boundary:** These are source-level and structural verification results. The newly added Node tests have **not been executed**, and no real browser persistence or production parity was established. The 113 example entries were checked for coverage and metadata alignment but **have not each received the exhaustive sentence-by-sentence editorial audit** required by the master prompt.

## Exact continuation point

**Stage C-X3c2b | Response-example editorial audit, entries 1–25**, following the canonical field order and checking each expected shape, example, rationale, uncertainty, writing style and relationship to the field help. Continue in similarly small verified batches until all 113 are genuinely read, corrected when justified and source-verified. Subsequently finish detailed student guidance, glossary, novice-friction and supplementary help wording, revisit all cross-system connections, and run real tests and production checks before declaring the website audit finished.

Preserve the source-reviewed 113 Rescue field scaffolds, 32 lab tabs, the Path Coach alignment, and all completed supplementary corrections. Do not confuse metadata coverage with exhaustive prose review.
