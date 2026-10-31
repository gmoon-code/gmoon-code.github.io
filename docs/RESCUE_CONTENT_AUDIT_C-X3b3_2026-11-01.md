# Stage C-X3b3 | Data laboratory Rescue content

1 November 2026. Continued the website's exhaustive written-content audit from [C-X3b2 Methods](RESCUE_CONTENT_AUDIT_C-X3b2_2026-11-01.md). This checkpoint covers all seven `labs.data` tabs in the canonical Rescue model. The 113 previously audited fields and the reviewed Literature and Methods laboratories remain unchanged.

## Exact coverage

Read `gmoon-code/research-methods/assets/rescue-model-v2.5.json` for `labs.data.import`, `quality`, `explore`, `setup`, `run`, `history`, `audit`. Inspected the corresponding Stage 13–15 guidance and tab descriptions in `assets/student-guidance.js`; inspected `assets/rescue-ui.js` for Level 1–5 rendering and Level 3 decision-menu/fallback behaviour. Checked all Data glossary terms and the five mapped decision-choice keys. Reviewed the task body, conceptual terminology, available comparisons or mapped decision menus, worked scenario, reasoning, sample output and next-decision prompt for each tab.

## Material problems detected

- Import, quality and exploration reused the same extreme plant-height example despite teaching distinct processes.
- Analysis setup and running an analysis shared an identical paired-binary scenario and draft, missing the latter's need to identify actual columns and independent units.
- Analysis history and results audit duplicated the same observational correlation report instead of teaching traceability and alignment between design and claim.
- All seven Level 5 prompts repeated a generic instruction. Five tabs without mapped menus had no tailored Level 3 comparison.
- Lab titles used em dashes contrary to the author's editorial rule.
- Existing examples gave too little guidance about untouched source records, repeated-ID integrity, documentation of exclusions, descriptive pattern variation, cluster-aware analysis, analytic version control and reporting denominators.

## Changes implemented

Every Data tab now has a distinct Level 1 body, Level 4 parallel situation and reasoning sequence, worked draft and Level 5 prompt. Five tabs without mapped choices gained authored Level 3 comparison prompts. The two choice-driven tabs (`setup` and `run`) retain their existing mapped menus. Titles use middle dots instead of em dashes. No additional glossary terms or choice keys were invented.

- **Import:** retain an unmodified dated raw file; make a working copy; preserve identifiers, row links and transformation logs; mention access restrictions when records are identifiable.
- **Quality:** investigate outliers, duplicates and missing or inconsistent entries against original records; distinguish source-supported corrections from retaining valid unusual measurements.
- **Explore:** inspect individual paired score trajectories and missingness, not just overall mean differences; preserve noncausal interpretation.
- **Setup:** specify paired binary observation structure, the before/after proportion difference and the discordant-pair logic of McNemar-type methods; note that paired change alone does not prove intervention effects. Qualitative inquiry is explicitly distinguished from numerical estimands.
- **Run:** model independently assigned fertiliser trays containing nested seedlings, guard against pseudoreplication and specify appropriate unit-level or cluster-aware analysis.
- **History:** preserve original and sensitivity analyses with their data versions, exclusions, outputs and reasons, rather than selecting a favoured p-value.
- **Audit:** identify 18 volunteers contributing two observations each, correct an inflated independent sample count and remove an unsupported causal conclusion.

These are clearly hypothetical examples, not purported observations from the author's own empirical research.

## Supporting methodological references

Cross-checked the revised guidance against:
- Utrecht University, *Storing and preserving data*, https://utrecht-universiteit.nl/en/research/research-data-management/guides/storing-and-preserving-data and Oxford University, *Data handling and acquisition*, https://www.ox.ac.uk/research/support/data-computing/research-data/managing-research-data/data-handling-and, on source preservation and documented transformation.
- ARRIVE Guidelines, *Study design 1b*, https://arriveguidelines.org/arrive-guidelines/study-design/1b/explanation, and Cornell Statistical Consulting Unit, *Diagnosing and Avoiding Pseudoreplication*, https://cscu.cornell.edu/wp-content/uploads/pseudo.pdf, on nested observations and treatment-assignment units.
- NCBI Bookshelf, *McNemar and Mann-Whitney U Tests*, https://www.ncbi.nlm.nih.gov/books/NBK560699/, on paired binary outcomes, discordant pairs and the limits of inferential interpretation.

## Commits and verification

- Canonical Data laboratory: https://github.com/gmoon-code/research-methods/commit/192e0bda6a4961f229e46d4719f23834a822f4ee
- Active visitor-facing model: https://github.com/gmoon-code/research-methods/commit/7d9875c9f4cab170781ac8ad93107b4a89c3aa01
- Added targeted structural and pedagogical regression assertions: https://github.com/gmoon-code/research-methods/commit/c2b011856cf111b9510cefafa79f147719b01038

Re-fetched the canonical and active files and parsed their JSON content. Deep equality passed. Verified all seven Data tabs are present; titles, bodies, situations, worked drafts and Level 5 prompts are mutually distinct; all five fallback comparisons are distinct; all glossary terms resolve in actual `student-guidance.js`; all mapped choices resolve to defined options. Confirmed the UI source renders `compare_prompt` for non-choice tabs. None of the seven Data entries uses an em dash. The edit was programmatically scoped so the fields and three other laboratory objects were unchanged.

**Verification limitation:** Newly committed Node regression assertions have not been executed in an actual Node runtime. The repository was unreachable from the local execution sandbox, so no test-run result is claimed. The revised source was inspected and checked by connector-side structural assertions. Full five-level browser interactions, output persistence and publication parity remain outstanding.

## Status and continuation

**C-X3b3, Data laboratory 7/7 source-editorially checked and synchronised; methodological source-checks completed; browser/runtime regression and deployment verification still open.**

Among the 32 lab tabs, Literature 8, Methods 9 and Data 7 have undergone this renewed review (24/32). **Next checkpoint is Stage C-X3b4, Writing laboratory**, with its eight tabs in canonical order. Subsequently review supplementary field help, cross-system and cross-page editorial consistency, then full browser interactions and live-publication parity before calling this audit complete. Preserve all prior verified changes and avoid presenting any unexecuted tests as passed.
