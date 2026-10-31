# Stage C-X3c2c | Response examples 26–50, sentence-level editorial audit

1 November 2026. Continued from [entries 1–25](RESPONSE_EXAMPLES_CONTENT_AUDIT_C-X3c2b_2026-11-01.md). This stage individually reviewed the next 25 visitor-facing response examples in `gmoon-code/research-methods/assets/response-examples-v2.11.json`.

## Scope and individual coverage

Inspected the expected response shape and length, weak model, working response, extended response where present, and task rationale of each entry. Compared its reasoning, explicit research status, editorial voice and evidence limitations with the corresponding canonical Rescue five levels, student guidance and research curriculum.

| Number | Field | Status |
|---|---|---|
| 26 | `rq3` | Corrected |
| 27 | `questionType` | Corrected |
| 28 | `finalRQ` | Reviewed, retained |
| 29 | `rqJustification` | Reviewed, retained |
| 30 | `searchBlock1` | Reviewed, retained |
| 31 | `searchBlock2` | Corrected |
| 32 | `searchBlock3` | Reviewed, retained |
| 33 | `searchStrings` | Corrected |
| 34 | `databases` | Reviewed, retained |
| 35 | `includeCriteria` | Corrected |
| 36 | `excludeCriteria` | Corrected |
| 37 | `searchLog` | Reviewed, retained |
| 38 | `theme1` | Reviewed, retained |
| 39 | `theme2` | Reviewed, retained |
| 40 | `theme3` | Reviewed, retained |
| 41 | `tensions` | Reviewed, retained |
| 42 | `repeatedLimits` | Reviewed, retained |
| 43 | `gapType` | Reviewed, retained |
| 44 | `gapStatement` | Reviewed, retained |
| 45 | `litToRQ` | Reviewed, retained |
| 46 | `litIntroPlan` | Reviewed, retained |
| 47 | `litThemePlan` | Reviewed, retained |
| 48 | `litTensionPlan` | Reviewed, retained |
| 49 | `litEndPlan` | Reviewed, retained |
| 50 | `litDraft` | Corrected |

## Issues and decisions

**Draft questions and evidence routes.** After the previous stage's change to `rq2`, `rq3` would have presented another closely related qualitative question. Its replacement now asks how published secondary-science studies define and measure delayed recall after retrieval practice. This gives the three question candidates distinct observational, qualitative and literature-synthesis pathways. `questionType` previously gave an instruction in place of the actual selected value. It now models the exact available category, `Correlational / observational`, with its rationale outside the selected response.

**Literature-search coherence.** The second search-concept block was concerned with biology/science-learning settings, while its Rescue equivalent and related retrieval examples prioritised delayed recall as the outcome. The revised example focuses on delayed recall and related measurement terms, while explicitly distinguishing a retention test as a procedure. The example Boolean search strings now actually connect the proposed activity, delayed outcome and optional school-age population blocks and identify their intended databases. They remain unexecuted search proposals. ERIC, Education Source and Scopus are retained as examples of possible sources without a claim that any search was performed.

**Eligibility and screening.** The inclusion criteria now specify original peer-reviewed empirical studies of secondary-school science learning with an identifiable retrieval-based activity and a later learning outcome, regardless of result direction. The exclusion rules mirror those eligibility boundaries and rule out excluding studies for unfavourable findings. This makes the model easier to apply consistently and reduces the possibility of results-driven selection.

**Literature-draft source integrity.** The full literature-review example refers to Dunlosky and colleagues (2013). Confirmed the article's existence and the general nature of its review of learning strategies, outcome tasks and learner/material differences against the Association for Psychological Science's official publication record, https://www.psychologicalscience.org/journals/pspi/1529100612453266/ and DOI https://doi.org/10.1177/1529100612453266. The worked draft's later comparison used '[insert study A]' and '[insert study B]' and described them as papers retrieved 'in my own search', although no such search was documented. The paragraph now explicitly identifies studies A and B as placeholders and makes comparisons conditional on actually retrieving and checking sources. The short preview is intentionally labelled an opening, with the full three-paragraph model supplied in the expanded response. That expanded response has 266 words, within the field's suggested 250–600 range, and is a drafting illustration rather than a completed empirical synthesis.

**Editorial restraint.** Eighteen entries were read and retained. Their provisional thematic claims are appropriately conditional, and their source-status notes already prevent unverified findings or fictional retrieval counts from appearing as real data. Unnecessary stylistic rewrites were avoided.

## Commits

- Canonical examples, seven revised entries: https://github.com/gmoon-code/research-methods/commit/3b0201708943c6dcd3e2e3fbcec13e521bcf7974
- Active visitor model synchronisation: https://github.com/gmoon-code/research-methods/commit/bbf67524923f3a0b14be0c66ea7fba0113fea5f4
- Content regression assertions: https://github.com/gmoon-code/research-methods/commit/f4fef257ff2cedcde6ff909f51517174b6332276

## Verification and limitations

Re-fetched canonical, active, earlier checkpoint and test sources. Deep comparison confirmed canonical and active examples match, exactly these seven of entries 26–50 changed, and entries 1–25 and 51–113 remained unchanged from the previous checkpoint. All current example labels, types and stages match canonical Rescue fields. Each non-full-draft response in entries 26–50 remains within its suggested word range; the full `litDraft` model has three paragraphs and 266 words. None of entries 26–50 contains an em dash. Source-level regression checks were added, but Node execution and real browser rendering were **not** performed.

**Status: entries 1–50 of 113 individually editorially reviewed and source-synchronised. The overall website audit is still in progress.**

## Exact next checkpoint

**Stage C-X3c2d | Response examples 51–75**, starting `designType` and continuing through `procedure` in canonical order. Check every example against its Rescue and student-guide content, especially claims about assignment, causal inference, quantitative and qualitative units, consent and school authority, instrument validity and measurable protocols. Finish with active-model sync, explicit verified scope and a new ledger. Then continue through entries 76–100 and 101–113 before other supplementary content, whole-website writing, browser tests and live deployment verification.
