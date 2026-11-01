# Stage C-X3c5b | Student-guidance stage summaries 7–12 of 18

1 November 2026. Continued from [C-X3c5a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c5a_2026-11-01.md). Reviewed every `title`, `plain`, `steps`, `strong`, `examples`, `stuck`, `terms` and `walkthrough` in student-guidance stage objects 7–12 against `assets/curriculum.js`, the nine paths in `pathway-model-v2.3.json`, `rescue-model-v2.5.json` and `response-examples-v2.11.json`. Preserved factual scope, the author's natural writing rules and the previously verified field guidance. The stage is **editorially source-verified, not runtime/deployment-verified**.

## Per-stage decisions

| Stage | Scope | Source values corrected | Substantive reason |
|---|---|---:|---|
| 7 | Synthesising literature | 4 | Require actual estimates, measurements and searched sources before convergence, feedback effects or gaps can be claimed |
| 8 | Literature-review writing | 7 | Reduce rigid paragraph formulas; vary conceptual development and citation placement; keep fictional synthesis explicitly fictional |
| 9 | Research-design choice | 3 | Distinguish observational studies, interventions without random assignment, and mixed-methods evidence integration; bound associational claims |
| 10 | Hypotheses, variables, units | 2 | State dish as experimental unit when assignment is at dish level; recognise that self-reported stress is an operational measure |
| 11 | Sampling, measurement and ethics | 4 | Separate planned/recruited/analysable sample; clarify human-participant approval; align shoot measures with the existing research example |
| 12 | Protocol and dataset | 4 | Correct dataset example to seed/dish/Day 7 visible-shoot and shoot-length variables; distinguish absence from missing observations and from radicle emergence |

**Twenty-four source values were corrected.** All remaining values were individually read and retained where already appropriate. Stage counts include adjustments to the `plain`, `steps`, `examples` and `walkthrough` text; no structural keys were removed.

### Literature claims and writing style

Stage 7 now treats the apparent agreement of fictitious studies as an example of the *work required* to substantiate a synthesis, rather than a ready-made literature finding. Students are asked to compare the measured outcomes, designs and estimates of the actual papers they retrieve. The classroom rationale remains bounded by the source corpus and documented search.

Stage 8 no longer describes a fixed sequence of paragraph moves as the usual prose ideal. A literature review may need a multi-study comparison, a source-specific methodological explanation or a careful account of uncertainty. The revised guidance gives each paragraph a connected intellectual task, and its fictional examples explicitly require verification before becoming empirical claims. This addresses the author's preference for meaningful, diverse sentence connections without mechanically replacing one transition phrase with another.

### Research design and units

Stage 9 now acknowledges quasi-experimental investigations that evaluate an intervention without random assignment, and explicitly asks how qualitative and quantitative parts are integrated when mixed methods are appropriate. It continues to discourage unwarranted causal conclusions from an observational association.

Stage 10 says that the **dish is the experimental unit** when salinity is assigned independently to dishes. Its observed-stress example describes the operational self-report score without conflating it with all biological or psychological stress processes.

Stage 11 distinguishes proposed participants from actual recruitment. One convenient classroom sample may support a useful local claim, but planned numbers cannot be reported as realised participants or treated as a representative random sample. The measurement example now matches Day 7 shoot-length and visible-shoot outcomes, while retaining the distinction from germination. Permission and review are positioned before participant recruitment and data access.

### Data-plan integrity

Stage 12's earlier row and binary examples described an individual plant's height over time and a radicle-based germination variable. Those are legitimate measurements in other designs, but they were at odds with the canonical salinity exercise in the previously reviewed Materials, Procedure, Row Unit and Columns fields. The corrected example uses a record for one planted seed's Day 7 observation with `dish_id`, `seed_id`, `NaCl_mM`, `visible_shoot`, `shoot_length_cm` and an observation-status field. The no-visible-shoot code is different from a missing observation and does **not** determine whether radicle emergence occurred. Seed records remain grouped within independently assigned dishes for experimental comparison.

## Implementation and checks

- Content correction commit: https://github.com/gmoon-code/research-methods/commit/e8ea5053d2b6a4ede553874c27e410e317cc5dea
- Regression assertion commit: https://github.com/gmoon-code/research-methods/commit/2bc67b68d74e6d5e9eb8aecb2ce49cc7ddbfd3f4

Re-fetched the source and compared it recursively with the exact previous blob `6da7c531058c9cf027f54b35b3f45ed09e808c4c`. Exactly **24 changed paths**, all within stages 7–12, were found. Stages 1–6 and 13–18, the 113 field-guide entries, 90 glossary terms and other guidance structures were unchanged. Targeted source-level assertions for the six summaries passed. Thirteen new regression assertions were committed to the existing Node test file. **The Node suite has not been run in this audit session**; browser displays, interactions, actual note saving, and deployed parity remain unverified.

## Exact next continuation point

**Stage C-X3c5c | Student-guidance stage summaries 13–18 of 18.** Read all stage-object prose, examples, warnings, terms and walkthroughs. Compare with curriculum sections, the nine pathways, canonical Rescue scaffolds, response-examples records and earlier source verified guidance. Focus on raw data, missingness, unit-level statistical inference, uncertainty, Results, Discussion, qualitative alternatives, synthesis boundaries, citations and final revision. Implement justified minimal edits, preserve completed source content, verify with a scoped diff, commit tests and update the ledger.

Afterward audit the separate 32 lab-guide text entries and remaining support prose, complete the cross-system/editorial reconciliation and execute runtime/browser and live-publication checks when tooling permits. Do not interpret completed source reviews as full website verification.
