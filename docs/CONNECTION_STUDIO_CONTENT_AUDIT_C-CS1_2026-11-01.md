# Connection Studio content audit | C-CS1

Date 1 November 2026. Continuation of the comprehensive academic website audit after Research Methods Studio C-X3c12p.

## Scope and page inventory

The root comprehensive editorial ledger previously covered 19 public/legacy top-level HTML files. Additional public tools, subroutes and the nested Studio manifest had not received equivalent renewed content verification. Connection Studio is a separate reader-facing application at `connection-studio/index.html` with substantive copy in `connection-studio/app.js` and the teaching content bank `connection-studio/data.js`. It contains 12 named relationships, 26 techniques, 96 word/phrase frames, 20 relationship diagnoses, 20 choice questions, 20 sentence rewrites and 10 extended paragraph challenges.

Reviewed the full 12-relationship descriptions, all 26 technique names and examples, the 20 relationship diagnosis scenarios and explanations, and the 20 selection scenarios and their model answers, within the limits of the available source. Read the home, reference-library, exercise instructions and progress descriptions in `app.js`. The primary evidence is the original author-constructed instructional copy and answer bank. There is no proof that classroom incidents described in fictional examples were actual observations.

## Changes made

1. A shared footer now tells readers that the classroom and research scenarios are illustrative writing exercises rather than reports of actual students or verified findings. This avoids interpreting synthetic classroom examples as empirical experiences on an academic site. Commit [44e04ee](https://github.com/gmoon-code/gmoon-code.github.io/commit/44e04eefeb289fb8058c8ae923d665b2c62e1e37).
2. The rewrite activity metadata used `lexical` for two exercises, a valid technique identifier that was falling through as lowercase text because the label resolver searched rhetorical relationships only. The resolver now retrieves technique names as well, yielding `Lexical chain` without changing teaching content or answer records. Commit [0ef66db](https://github.com/gmoon-code/gmoon-code.github.io/commit/0ef66db22a8ed325d43fcd2aa9589409ea747faf).

Strong existing cautionary material was preserved, including distinction between correlation and causation, comparison of evidentiary sources, limitations of multiple-choice exercises and the admission that free-response work is not scored automatically. No invented research citations or claims about demonstrated effectiveness were introduced.

## Verification

Executed original teaching bank in an isolated JavaScript evaluator and confirmed all 12 relationships, 26 techniques, 96 signals, 20 diagnoses, 20 choice questions, 20 sentence rewrites and 10 paragraph challenges. Verified ID uniqueness across banks, available correct options, valid choice indices, presence of rationales and two worked models for every writing challenge. Confirmed that the revised app parses and its shared footer text is present. **13 of 13 targeted structural/content checks passed**.

Committed [native Node regression tests](https://github.com/gmoon-code/gmoon-code.github.io/commit/c7ff6cf26c3977fab7afe14b2ba2c5447cfefe10) and a [GitHub Actions workflow](https://github.com/gmoon-code/gmoon-code.github.io/commit/457ea20df41fce82c8839ba5ace902dfcda351b0). GitHub Actions [Connection Studio content integrity run 41316423002](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41316423002) completed successfully. This validates repository content structure under Node, not the browser interaction, exercises' psychological validity or every suggested response's scholarly merit.

## Important editorial boundaries

The exercises are invented teaching material, not observations of identifiable actual students. The model answers and explanations are useful examples, not unique answers to authentic writing tasks. The response bank has no independent empirical validation or evidence of measured improvement in writing. The earlier portfolio pages remain editorially reviewed but retain reported external-record and deployment parity gaps. Physical browser and live public URL could not be fetched from available tool environment.

## Coverage status

- `connection-studio/index.html` and first-order content modules: **Editorial review in progress**. Instructional bank and key labels have been examined, content correction committed and Node structural tests passed. Browser verification and detailed examination of all 20 rewrite and 10 extended paragraph model responses remain to be completed.
- `studio/index.html` and public/editor application routes: **Not reviewed in renewed content audit** despite older interface QA.
- Main 19 top-level public HTML files: **Editorially verified per existing renewed-pass ledger**, with each page's factual primary-source uncertainties still open.

## Exact next checkpoint

**Stage C-CS2 | Connection Studio extended writing tasks and paragraph examples.** Review all 20 sentence-rewrite and 10 paragraph-challenge source texts, constraints, hints, model responses and rationales sentence-by-sentence for natural movement, scholarly plausibility, varied forms, grammatical accuracy and avoidance of unsupported inference. Reconcile examples across pages with the published scholarly writing style without erasing useful exercises in punctuation or contrast. Implement only justified changes, run the new native CI and preserve this ledger. Then enumerate and audit remaining independently discoverable `studio/`, `editor*`, `publisher/` and legacy public utility content as appropriate.

**Verification level:** Edited and source-checked; Node structural regression passed. Full interactive/browser and empirical validation outstanding.
