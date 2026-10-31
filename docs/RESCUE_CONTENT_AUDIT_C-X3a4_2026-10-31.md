# Stage C-X3a4 | Rescue fields 76–100

Date 31 October 2026. Continuation of the comprehensive academic website content-only audit. The prior verified checkpoint was Stage C-X3a3, with 75 of 113 Rescue fields completed. Stage C-X3a4 covers exactly the next 25 fields and all five scaffold levels for each.

## Coverage

Stage 12, fields 76–82, included `replication`, `methodControls`, `rowUnit`, `columns`, `missingRule`, `exclusionRule` and `analysisIntent`. Stage 13, fields 83–87, included `rawLocation`, `missingObserved`, `errorsCorrections`, `plots` and `descriptives`. Stage 14, fields 88–92, included `primaryEstimand`, `analysisChoice`, `assumptionChecks`, `effectSizePlan` and `multiplicity`. Stage 15, fields 93–97, included `analysisSample`, `result1`, `result2`, `unexpected` and `resultsDraft`. Stage 16, fields 98–100, included `directAnswer`, `interpret1` and `interpret2`. All are present in `assets/curriculum.js`, against which wording and task intent were checked.

Every Level 1 task and prompt, Level 2 explanation/questions, Level 3 strong example/caution, Level 4 worked reasoning and boundary, and Level 5 answer frame was inspected, with targeted edits to affected passages.

## Problems identified and corrections implemented

**Planning and data structures.** The seven Stage 12 entries originally reused one seed-measurement/data-row example even where the learner needed to distinguish independent treatment replication, control procedures, row structure, columns, missing data, exclusion decisions and planned analysis. New separate worked examples distinguish dish-level treatment units from seedling subsamples and repeated time points, name the protection being applied and describe a reproducible data schema. Missing outcomes are distinguished from legitimate zeros. Exclusion criteria must be specified without reference to preferred results, with an audit trail for unusual and invalid observations. Planned analysis now respects the level of treatment assignment and uncertainty associated with few independent units.

**Data provenance and description.** Five Stage 13 entries previously repeated one outlier example for original storage, missingness, correction logs, plots and descriptive summaries. New examples require unmodified source records and working copies, actual counts of missing observations, independently verified corrections, figures that reveal clustering, and summaries aligned to measurement level and outcome type. Hypothetical records are explicitly labelled as such. The examples avoid invented analyses or reported numerical results.

**Statistical inference.** The five Stage 14 fields originally reused a paired-binary classification and McNemar discussion irrespective of whether the field requested an estimand, method, assumptions, effect magnitude or multiplicity. The revised text distinguishes a population target from a test, makes pairing and discordant-count checks explicit, describes compatible effect estimates and confidence intervals, and separately documents primary and exploratory comparisons. It states that a p-value does not measure magnitude or determine scientific importance.

**Results and interpretations.** Stage 15 originally reused an unqualified fictional correlation with a p-value across all five fields. The revised worked examples require checked denominators, traceable output references and clearly marked unfilled estimates. Secondary findings are separately identified, and weak or inconclusive evidence is represented through uncertainty rather than interpreted as proof of no effect. The Results passage follows a coherent evidentiary order rather than mechanically repeating a source-led phrase. Stage 16 now has distinct examples for a bounded direct answer, a plausible but unmeasured mechanism and a second finding that qualifies the first. All are conditional on verified evidence.

**Writing decisions.** Revised Level 1 questions now align with the specific task. Level 4 situations, reasoning and draft text differ across all 25 fields, and Level 5 frames ask for the student's own evidence, decisions and justified boundaries. No em dashes or generic `[your project-specific answer]` / `Why it fits:` frames remain in this batch. Strong original elements and all selected field structures were retained.

## Methodological cross-checks

The 2016 American Statistical Association statement on p-values supports distinguishing p-values from effect sizes, practical importance and the truth of a hypothesis: https://doi.org/10.1080/00031305.2016.1154108

The 2025 CONSORT explanation and elaboration supports explicit accounting for analysis samples, missing data, exclusions, sensitivity and prespecified versus exploratory comparisons: https://www.bmj.com/content/389/bmj-2024-081124 . This guidance applies to randomized trial reporting and was used as a relevant methodological reference, not as a claim that all school projects are randomized clinical trials.

NIST's outlier guidance counsels checking errors and considering robust methods instead of removing valid extremes automatically: https://itl.nist.gov/div898/handbook/eda/section3/eda35h.htm

Penn State's teaching material on paired categorical data supports respecting paired observations: https://online.stat.psu.edu/stat504/Lesson11

## Implementation and verification

The canonical `gmoon-code/research-methods/assets/rescue-model-v2.5.json` was committed in five manageable batches:
- Fields 76–82: https://github.com/gmoon-code/research-methods/commit/f0a8735afc441bb606e796cf07c3028a9ccbb635
- Fields 83–87: https://github.com/gmoon-code/research-methods/commit/bc9d87455c32bfe19b1b0001551a5e0aad5a899b
- Fields 88–92: https://github.com/gmoon-code/research-methods/commit/0e2d8895f073358cccdfd10c7be222a500d1066e
- Fields 93–97: https://github.com/gmoon-code/research-methods/commit/e07ad914604140d34b9bb207033c6e8409d82363
- Fields 98–100: https://github.com/gmoon-code/research-methods/commit/045dc9c7c7de9f52b1c82160aa1f799bd3eaee88

The active `assets/rescue-model.js` was synchronized in https://github.com/gmoon-code/research-methods/commit/dc38c88a6552b13f56cc65c6f5fc21b91ff071c6 . The test suite additions are in https://github.com/gmoon-code/research-methods/commit/cf3dd3102bfde7f8227c923a11ee91dd07e76743 and the strengthened pending-sample assertion in https://github.com/gmoon-code/research-methods/commit/9c39bf0f874bfe6934d915476d5af5c10c7d10b1 .

Compared the current complete canonical model with exact pre-stage blob `5960c758b44c23d19e583dfea7636b042f84b28e`. Exactly fields 76–100 changed, in the specified order. The other 88 fields, all four laboratories, field stages/types and all Level 4 example boundaries are unchanged. All 25 have Level 1–5 coverage, unique Level 1 prompts, Level 3 strong examples, Level 4 worked drafts and Level 5 response frames; no prohibited em dashes or generic Level 5 answers occur in the revised batch.

The canonical model and active JavaScript parsed objects were compared and matched. The real `tests/rescue-v25.test.js` was run against the active Rescue model and engine in an isolated V8 harness. The test passed with `PASS v2.5 progressive rescue state and logging`. Following the small regression assertion refinement, re-run the test before treating this as the final post-commit check. This verification is source-level and does not certify full Node, end-to-end browser, published-site or primary empirical research parity.

**Status.** Stage C-X3a4 editorially and source-methodologically reviewed, revised and verified at repository source level. Cumulative Rescue field coverage is 100 of 113. The remaining 13 fields, all four Rescue labs, supplementary field help, cross-bank and cross-page consistency, Stage 17 editorial follow-through and browser/publication checks remain outstanding.

## Exact next continuation point

Stage C-X3a5, fields 101–113, begins with `litCompare` and `alternatives`, continues through `limitations`, `implications`, `future`, `discussionDraft`, Stage 17 `conclusionDraft`, `abstractDraft`, `titleDraft`, `keywords`, and Stage 18 `citationStyle`, `citationAudit`, `finalEdits`. Audit all five support levels and exact curriculum tasks. Keep the first 100 field entries, the four unchanged lab objects and eight completed Path Coach pathways intact. Synchronize canonical and active models, run actual regression checks, preserve the next checkpoint, and separately track still-untested browser and publication behaviour.
