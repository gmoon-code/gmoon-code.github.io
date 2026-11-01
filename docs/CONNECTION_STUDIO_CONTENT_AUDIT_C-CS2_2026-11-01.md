# Connection Studio content audit | C-CS2

Date 1 November 2026. Continued from [C-CS1](CONNECTION_STUDIO_CONTENT_AUDIT_C-CS1_2026-11-01.md).

## Coverage

Read all 20 sentence-rewrite `REWRITE` records and all 10 extended `PARAGRAPHS` records in `connection-studio/data.js`, including their initial passages, rewrite objectives, constraints, hints, two models and rationale notes. Reviewed the shared model display and teaching guidance in `connection-studio/app.js`. Compared recurring scientific and classroom examples to the author's stated style, distinctions between hypothetical and observed material, and research-methodological warnings established in the academic website content audit.

## Editorial judgement

The examples generally distinguish observation from inference, accommodate small-sample evidence, avoid treating increased response length as demonstrated learning, and treat multilingual classroom and classification episodes as illustrative rather than collected empirical data. The multiple model choices offer structurally different sentence and paragraph connections, including lexical reference, actor continuation, justified comparison and scope qualification. Did not reword these examples merely for variety, remove meaningful conceptual repetition, or replace the instructor's voice with generic academic prose.

A specific risk remained in some writing models, particularly examples that enrich a generic original statement through actions such as groups revising classification criteria or speaking in discussion. Such detail can be useful to demonstrate specificity in a fictional exercise, but it cannot become an empirical account without original documentation. Rather than altering many worthwhile model responses, added one visible common instruction directly beside the revealed models requiring support from original evidence for any specific classroom action or reported finding.

Source commit [e81d4e](https://github.com/gmoon-code/gmoon-code.github.io/commit/e81d4e3680b4a0f939d1c619ff4522e43cbb84f5) in `connection-studio/app.js`. Added a regression assertion in [d3074fa](https://github.com/gmoon-code/gmoon-code.github.io/commit/d3074fa35ab11e30fd5445bbbf051d7547e55add) to `tests/connection-studio-content.test.mjs`.

## Verification

GitHub Actions native Node content-integrity workflow [run 41316647230](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41316647230) completed with **success**, including the new shared model caution and previous bank/answer-key integrity checks. This is source and native-unit regression coverage. It is not a rendered browser, accessibility, usability or learning-outcome validation. A later GitHub Pages deployment was in progress when checked and must not be reported as already complete.

## Remaining audit

The entire Connection Studio content bank is now reviewed in the renewed pass at instructional-editorial level. Full empirical validation of learning effectiveness is not available or claimed. Actual browser response rendering, import/export paths and live public parity remain outstanding. Other public/editor applications and source documents have not received equivalent complete content examination.

## Exact next checkpoint

**Stage C-ED1 | Website Studio author-facing claims and instructions.** Review `studio/index.html`, its page manifest and publishing scripts for truthfulness of claims about authentication, saved changes, publication, source files and the scope of editable pages. This is a content-only verification of explanatory copy and legal/security accuracy, not a UI-layout redesign. Inspect script implementations before correcting user-facing guidance, run targeted source or native checks and record any verification blocked by missing credentials. Thereafter audit separate editor and publisher pages and supporting materials in repository inventory.

**Status:** Connection Studio teaching content editorially reviewed within source, one common evidence caveat corrected, Node regression passed. Browser/public delivery and actual pedagogical effectiveness remain unverified.
