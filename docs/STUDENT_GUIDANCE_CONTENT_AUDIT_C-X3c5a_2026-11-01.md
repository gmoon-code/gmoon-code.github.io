# Stage C-X3c5a | Student-guidance stage summaries 1–6 of 18

1 November 2026. Continued immediately from [C-X3c4e](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c4e_2026-11-01.md). Audited the first six stage objects of `gmoon-code/research-methods/assets/student-guidance.js` against the corresponding Stage 1–6 lessons in `assets/curriculum.js`, the reviewed field-level Rescue help, `response-examples-v2.11.json`, and the nine research pathways in `pathway-model-v2.3.json`. Applied the author's editorial rules, including evidence-status discipline, Canadian English, non-formulaic reasoning and natural connections. This stage is **source-editorially reviewed, edited and re-fetched**, not browser or executed-Node verified.

## Coverage and individual decisions

Every `title`, `plain`, `steps`, `strong`, `examples`, `stuck`, `terms` and `walkthrough` for stage summaries 1–6 was examined. Each stage was retained structurally, with 29 targeted values revised.

| Stage | Purpose | Source values corrected | Reason |
|---|---|---:|---|
| 1 | Start with curiosity | 4 | Make access contingent on permission; distinguish a plant observation from an experimentally tested explanation; Canadian spelling |
| 2 | Narrow topic and feasibility | 3 | Account for restrictions on participants/data and approval; distinguish local microclimate observations from climate-change evidence |
| 3 | Preliminary research landscape | 7 | Document actual searches and sources; mark hypothetical question shifts and candidate terminology as unverified; avoid claiming literature findings not read |
| 4 | Research questions | 3 | Repair mismatch between hypothetical germination and the audited Day 7 visible-shoot records; preserve dish-level experimental units; state observational limits |
| 5 | Search design and execution | 7 | Separate proposed and run searches; check platform access and syntax; record complete search provenance; distinguish synonyms from adjacent concepts |
| 6 | Critical source extraction | 5 | Preserve source locations for claim verification; use TRAAP as prompting questions rather than a substitute for appraisal; explicitly mark invented illustrative findings |

### Stage 1

Replaced the suggestion that resource access can be assumed with an explicit permission/confirmation check. The houseplant example now describes an observation and a possible controlled test without treating light as the established explanation. The walkthrough avoids presenting school plants as available for manipulation. Its proposed design uses *standardised* containers, consistent with Canadian English.

### Stage 2

The feasibility advice includes restricted data and inaccessible approvals. The student-survey example is explicitly contingent on an appropriate participation, consent and school-approval process. A comparison of shaded and exposed surfaces is described as a bounded local observation, not proof of a changing climate. This retains the curriculum's topic-narrowing purpose without promising a climate trend from a limited time window.

### Stage 3

The steps now ask students to record actual platforms, dates and submitted terms and to distinguish plausible patterns from what inspected sources establish. The sleep/grades question shift is presented as an illustrative revision pending reading, rather than a documented result. The retrieval-practice walkthrough treats study vocabulary as candidate terms to validate in relevant papers and develops a review-oriented question without pretending an intervention took place. This matches earlier Rescue and response-example caution about planned versus completed searches.

### Stage 4

The descriptive and experimental seedling questions now name Day 7 *visible shoots*. The descriptive question requests seed proportions **per dish**, and the experimental question compares the mean dish-level proportion across assigned salinity conditions. This respects the previously audited 18 independent dishes, five seeds per dish and distinct germination-versus-visible-shoot measurements. The observational phone-use example acknowledges self-report and possible confounding. Qualitative and other retained material did not require a content change.

### Stage 5

The stage now separates planned search strings from executed search records. It explicitly requires platform, date, submitted query, filters, result counts and subsequent revisions for an actual search. Examples are identified as proposed terms rather than completed retrievals. The wording recognises that related concepts are not necessarily synonymous, and scholarly databases may require access or adapted syntax. This is consistent with the previously reviewed `searchLog`, `searchStrings` and `databases` field models.

### Stage 6

An extraction record now includes a persistent link/identifier and claim locations alongside the study's design, measurements and findings. TRAAP is retained as a set of source-evaluation questions and supplemented with design and measurement appraisal, avoiding the impression that an acronym alone demonstrates study quality. The fabricated n = 420 example remains explicitly *hypothetical*. Its relationship is described precisely as between reported activity hours and well-being score; no external study is claimed as the source. The inclusion walkthrough now ties eligibility to the selected review criteria and the evidence the study can support.

## Implementation and verification

- Source change: https://github.com/gmoon-code/research-methods/commit/501be6a683fe9281b5125271a0f4a431c6a47d7
- Follow-up prose refinement: https://github.com/gmoon-code/research-methods/commit/22a4608d2b4400aaf1230404cee789e6b39d78d6
- Regression assertions: https://github.com/gmoon-code/research-methods/commit/49df9712b52f323940d381afbef6d02dc7dd986f

Re-fetched the source on `main`, compared its parsed object recursively against the pre-audit Git blob (`64274970f4a8f06718c66eec5bed81a57a937c71`) and confirmed that **exactly 29 value paths in stages 1–6 changed**. Stages 7–18, all 113 field guides, all 90 glossary terms, labs, choices and novice-promise text were unchanged. Each of the 18 stage guides remains structurally complete. Thirteen directly evaluated semantic assertions passed against the saved source. The added Node test assertions are present in `tests/student-guidance.test.js`, and the pre-existing tests remain in place. **The Node test suite itself has not been executed here**, nor have browser interactions, notebook persistence, or live deployment parity been checked.

## Outstanding dependencies

The nine pathway models and canonical curriculum supply context, but they were not revised in this batch. Some generic pathway examples still mention seed germination, which is a different possible measured endpoint from the audited salinity Day 7 visible-shoot dataset; check the specific example's context before propagating language across systems. No claim of new external literature verification was made for fictional examples.

## Exact next unfinished stage

**Stage C-X3c5b | Student-guidance stage summaries 7–12 of 18.** Individually inspect every `title`, `plain`, `steps`, `strong`, `examples`, `stuck`, `terms` and `walkthrough` and any extra keys, against the corresponding curriculum stages, nine pathways, canonical Rescue help, response-examples model and authorial writing rules. Pay special attention to literature synthesis/gap claims, design selection, hypotheses and units, sampling, ethics and method specification; distinguish proposal from completed evidence. Apply supported minimal corrections, preserve previously completed source values, re-fetch and diff, add tests and save next ledger.

Subsequently review stages 13–18, separate 32 lab-guide texts, remaining help and interface prose, and the pending actual Node, browser and deployed-publication verification. Do not mark the entire website content audit complete.
