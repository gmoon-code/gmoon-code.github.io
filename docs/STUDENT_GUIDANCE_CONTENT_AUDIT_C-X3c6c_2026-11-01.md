# Stage C-X3c6c | Data and Statistics Lab guidance, panels 18–24 of 32

1 November 2026. Continued from [C-X3c6b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c6b_2026-11-01.md). Individually reviewed seven Data Lab panel headings, descriptions, linked terms and decision metadata in `assets/student-guidance.js` against `rescue-model-v2.5.json`, curriculum Stages 13–15 and the previously audited Research Methods and Results field guidance. Applied scientific inference rules, unit-level traceability, evidence boundaries, Canadian English and the author's principles of concise, natural instructional prose.

| Panel | Status | Decision |
|---|---|---|
| `data.import` | Corrected | Record source file and origin, export date, row semantics, unchanged original, leading-zero identifiers, paired and nested links, and confidentiality |
| `data.quality` | Reviewed and retained | Already requires investigation and documentation rather than automatically deleting unusual values or missing records |
| `data.explore` | Corrected | Preserve independent, repeated and paired structures, denominators for counts and noncausal interpretation |
| `data.setup` | Corrected | Quantitative estimand and outcome type must match data structure; qualitative work should retain an interpretive question rather than being forced into statistical language |
| `data.run` | Reviewed and retained | Already requires confirming selected columns against analysis units before calculation |
| `data.history` | Corrected | Record dataset version, variable mapping, decisions, uncertainty and designation of prespecified, exploratory or sensitivity analyses |
| `data.audit` | Corrected | Reconcile reported participants or experimental units with evidence, missingness and exclusions; respect interpretive and causal limits |

**Seven panels reviewed, five text values corrected, two retained.** No changes to titles, term links or decision keys. An analysis can be numerically executable yet methodologically unsupported if it counts nested measurements as independent treatment replicates; the reviewed guidance now makes that dependence more visible.

## Implementation and verification

- Source correction commit: https://github.com/gmoon-code/research-methods/commit/66965f1264e2e615754c91d8ab9cf8f5b9319f12
- Test assertions commit: https://github.com/gmoon-code/research-methods/commit/dabfaab18e2cd303bf25a540851688853f6aba70

Compared the saved source with the preceding blob `1be4caccef76accfcfcdf3cb66f41e23d3b9405c`. Exactly five `labs.data.*.text` values changed, with no revisions to the other three laboratories, the 18 stage guides, 113 field guides or 90 glossary entries. All seven Data Lab keys resolve against the existing Rescue Lab model. Targeted source-level assertions passed and the Node regression assertions were committed, **but they have not been executed**. No browser, data-import interaction, analysis execution or public-site parity test is claimed.

## Exact next checkpoint

**Stage C-X3c6d | Writing Lab panels 25–32 of 32**, ordered `intro`, `lit`, `method`, `results`, `discussion`, `closing`, `citations`, `audit`. Compare source writing guidance with curriculum Stages 8 and 15–18, Rescue laboratory guidance and the established authorial writing rules. Give particular attention to evidence-supported claims, non-formulaic and varied paragraph progression, honest proposal/report status, citation traceability and research limitations. Revise only supported problems, verify source diff, add tests and save next ledger. After completion, 32/32 panels will be source-editorially reviewed; runtime and deployed verification remain separate.
