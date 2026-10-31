# Stage C-X3c1 | Rescue, Path Coach and curriculum integration

1 November 2026. Continued from [C-X3b4 Writing laboratory](RESCUE_CONTENT_AUDIT_C-X3b4_2026-11-01.md), using the user's full comprehensive written-content audit requirements. This is the first cross-system integration pass, **not the entirety of Stage C-X3c**.

## Sources examined

- `gmoon-code/research-methods/assets/rescue-model-v2.5.json` (113 fields; 32 laboratory tabs)
- `assets/rescue-model.js` (active synchronised model)
- `assets/student-guidance.js` (113 field guidance entries, 90 glossary definitions, 21 decision mappings, 32 lab guidance tabs)
- `assets/path-coach-model-v2.4.json` (nine pathway IDs, required/recommended fields, stage-specific checks)
- `assets/pathway-model-v2.3.json` (nine pathway definitions and field modes)
- `assets/curriculum.js` (18 stages and actual field references, particularly Stages 10, 14, 15 and 17)
- `assets/rescue-ui.js` (Level 3 choice/fallback presentation, Level 5 collection)
- `assets/rescue.js` (Level progression, note and field-revision requirements)
- `tests/rescue-v25.test.js` (existing structural test source)

## Cross-system findings

Programmatic comparisons found no missing canonical field guidance entry, no Path Coach required or recommended field with a mismatched stage or `hide` mode, no unresolvable lab glossary term, no missing lab decision choice, and no omitted canonical field from the curriculum's field descriptors.

**Substantive mismatches did appear in the shared wording.** The `experimentalUnit` Level 1 and 2 questions assumed independent assignment even when students were examining qualitative participants, literature sources or observational cases; `analysisChoice` leaned on quantitative outcome scales despite being core to literature review and qualitative paths. `resultsDraft` imposed a quantitative Results structure and an absolute bar on interpretation, whereas the student guide and curriculum permit evidence-grounded qualitative Findings. `unexpected` gave only statistical uncertainty guidance despite its relevance to discrepant qualitative accounts and conflicting sources. `abstractDraft` treated results as universally available, although proposals are supported and the guide says not to invent uncollected findings. `primaryEstimand` needed to signal that its quantity belongs to the quantitative component of mixed-methods work. `comparisonStructure`, `operationalDefs` and `interpret1` needed to accommodate cases, qualitative evidence and linked source records without assuming experiments or numerical records.

The curriculum's Stage 14 navigation label read 'Statistical analysis' for research pathways that also include qualitative and literature synthesis. Several Stage 14–15 directions and checks presupposed p-values or numerical results in an otherwise multi-path study sequence.

## Implemented source corrections

Nine specific Rescue fields were refined at the indicated levels. Previously verified worked examples, distinctive prompts and pathway-specific Level 5 frames were otherwise preserved.

- `comparisonStructure` Level 2 now explains comparisons among cases, studies and conditions, including dependence.
- `operationalDefs` Level 2 now accommodates qualitative coding, case boundaries and eligibility rules alongside numerical operational definitions.
- `experimentalUnit` Levels 1–2 now distinguish assignment units, observational cases and underlying studies.
- `analysisChoice` Levels 1–2 now specify statistical, qualitative and synthesis analyses.
- `unexpected` Level 2 now covers discrepant accounts, conflicting studies and uncertain estimates.
- `resultsDraft` Levels 2–3 now distinguish quantitative estimates from evidence-grounded qualitative findings.
- `primaryEstimand` Levels 1–2 now distinguish quantitative estimands from qualitative strands in mixed-methods inquiry.
- `abstractDraft` Levels 1–3 and Level 5 now support both completed work and proposals, preventing fictitious findings.
- `interpret1` Level 2 now distinguishes observed and recorded evidence from inferred mechanisms and explanations across study types.

The curriculum received six narrowly scoped text replacements in Stages 14 and 15. These refine the navigation label, multi-method analysis purpose, quantitative-specific interpretation heading, applicable analytical checks, descriptive/corpus reporting guidance, and source-traceable results checks.

## Committed changes

- Canonical nine-field correction: https://github.com/gmoon-code/research-methods/commit/6960a47b6bc83cb0b47d8a4c35436b20aa06e10e
- Active runtime model synchronisation: https://github.com/gmoon-code/research-methods/commit/a3dc91e592de3e5770390fce7b6272c128da096f
- Curriculum Stages 14–15: https://github.com/gmoon-code/research-methods/commit/f97670d98484716f53dcebc2280f5e3325d581a5
- Additional cross-system regression assertions: https://github.com/gmoon-code/research-methods/commit/e97fb0ac36689611d329b3a93e584da0629e5c15

## Source-level verification

Re-fetched and parsed the complete canonical and active Rescue models. Deep equality passed. Verified 113 canonical fields, 113 student-guide field entries, and the four laboratory tab counts Literature 8, Methods 9, Data 7 and Writing 8. All 113 unique Level 1 prompts, Level 3 worked examples, Level 4 drafts and Level 5 frames remain unique, and all Rescue field entries remain em-dash-free. All field identifiers appear in curriculum source. All laboratory terms resolve to glossary entries and all mapped choices resolve to actual guidance. Every lab tab has a mapped comparison or authored fallback. Required and recommended Path Coach fields have correct stage numbers and are not hidden by the corresponding pathway mode. Inspected `rescue-ui.js` for Level 3 fallback usage and `rescue.js` for Level 5 user note and rationale requirements. The source confirms that both must be nonblank before a laboratory note is saved; it does not establish a successful real-browser save.

**Important testing boundary:** The newly committed Node regression assertions were not executed. The current isolated execution environment cannot resolve GitHub's host, so no local checkout or complete package run was performed. These source-level checks do not establish browser interaction fidelity, storage persistence, or production parity.

## Status and exact continuation

**Stage C-X3c1 source-level cross-system alignment verified for the relationships inspected.** The entire supplementary content audit is not finished.

**Next Stage C-X3c2 | Remaining supplementary content and authored examples.** Inspect `assets/response-examples-v2.11.json`, `assets/transfer-bank-v1.9.json`, `assets/novice-friction.js`, `assets/student-help-ui.js`, and any meaningful lesser-used help and decision text, cross-checking with Path Coach and the curriculum. Scope each review by its exact records, make only warranted corrections, then verify. Afterwards perform full cross-page research/style comparison and live browser/publication testing. Do not claim complete coverage or successful Node/browser tests until they are actually executed.
