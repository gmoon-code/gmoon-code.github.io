# Stage C-X3c6a | Literature Lab guidance, panels 1–8 of 32

1 November 2026. Continued from [C-X3c5c](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c5c_2026-11-01.md). Reviewed all eight Literature Lab panel descriptions and titles in `gmoon-code/research-methods/assets/student-guidance.js` against the corresponding `assets/rescue-model-v2.5.json` laboratory guidance, curriculum Stages 5–8, related field guides and the Literature Lab's source-record model. Evaluated scholarly claims, search status, evidence qualification, sentence-level clarity and natural writing. Status: **editorially source-verified**, with runtime and published-site checks pending.

## Per-panel record

| Panel | Status | Decision |
|---|---|---|
| `literature.search` | Corrected | Specify platform, execution date, exact submitted query, settings and result counts only for searches actually run. Keep planned queries explicitly distinct |
| `literature.sources` | Corrected | Ask for verified bibliographic information, measured findings and page/table locations; retain source-specific limitations |
| `literature.screen` | Corrected | Tie include/exclude/pending decisions to stated criteria and record the decision stage and reason, regardless of direction of findings |
| `literature.study` | Reviewed and retained | Already distinguishes comparison dimensions and the need to check explanations of apparent disagreement |
| `literature.synth` | Corrected | Build themes from actual sources, acknowledge complicating evidence and check whether measures and contexts permit comparison |
| `literature.gap` | Corrected | Defend replication, local extension, method comparison or unresolved findings using documented evidence; do not claim field-wide absence from limited searches |
| `literature.claims` | Reviewed and retained | Already requires source-to-claim traceability and qualifications when populations/designs differ |
| `literature.outline` | Reviewed and retained | Already privileges connected ideas and meaningful comparisons over a mechanical paragraph sequence |

**Eight panels individually reviewed, five descriptions changed, three retained.** All titles, terms and decision-key metadata were retained. The corrections clarify how a planned search differs from a performed search and prevent students from turning an incomplete literature scan into unwarranted claims. The more coherent prose is deliberately instructional, without adding unnecessary rhetorical flourishes.

## Commits and verification

- Source revisions: https://github.com/gmoon-code/research-methods/commit/e6224833d6d273ac27d52338aa84d99d3d93d3ff
- Regression checks: https://github.com/gmoon-code/research-methods/commit/fd4c8df3f43270b85db051498ebea4c993e9558e

Re-fetched the committed source and recursively compared it with the pre-audit Git blob `b1f2f44a219e15c360cc92b49d044d38d3cdfc8e`. Exactly the descriptions of `search`, `sources`, `screen`, `synth` and `gap` changed within `labs.literature`. All 18 stage summaries, 113 student-guidance fields, 90 glossary entries, remaining lab panels, choices and novice-promise text were preserved. All eight panel keys exist in canonical Rescue Lab guidance. Source-level assertions passed, and Node test assertions were committed. **Node tests were not executed here.** Browser rendering and deployed version parity remain unverified.

## Exact next checkpoint

**Stage C-X3c6b | Methods Lab panels 1–9 of 32**, in the order `design`, `vars`, `rep`, `sample`, `measure`, `ethics`, `procedure`, `data`, `audit`. Compare each with the canonical Methods Lab and Rescue guidance, curriculum design Stages 9–12, field guidance, verified research-data model and the nine pathways. Resolve only supported methodological or writing issues and preserve all prior audited material. Then review Data Lab (7 panels) and Writing Lab (8 panels) separately; finally complete cross-lab and runtime verification.
