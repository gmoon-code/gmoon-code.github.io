# C-RV29dw | Research Chat context-off transmission and academic privacy wording

**Date:** 4 November 2026. **Continued from:** C-RV29dv. **Disposition:** A concrete disclosure omission in `research-methods-studio.html#methods-privacy` was verified against the **current first-party application client, server and tests**, and corrected in one academic paragraph. Research bibliography and empirical study claims remain unchanged. **Full academic website content audit: In progress.**

## Source delta and distinct verification target

At the start of this stage, the academic repository `main` was still `d6ed6dfde00c3debda42e6b65819bec56d88439d`, with a complete nontruncated GitHub tree of **26 HTML routes** and **zero changed source files** since the C-RV29dv read-only gate. Current linked application repositories also remained unchanged relative to the earlier C-RV29dt source baselines.

Revisited remaining limited-access scholarly original search paths for Alexander (2023), Gilbert (2021), Prasad (2015), the specific Nasir et al. (2014) Cambridge second-edition chapter and Slotta and Linn's 2009 WISE book. The available original publishers, article abstracts, library descriptions and snippets did **not** yield continuous authenticated original texts for the corresponding research register rows. The alleged full-text link on a German education portal led to a Teachers College Press book page that could not be retrieved as original book pages, and was not reclassified as proof of a PDF. No bibliography tier was upgraded and no research passage was edited merely for activity.

Selected a **separately source-checkable privacy claim** on Research Methods Studio. Its current published academic privacy passage explained that project context, when enabled, is minimized before an optional networked Research Chat request, but did **not explicitly say that a visitor's question and recent conversation history are transmitted to the service even if project context is switched off**. This distinction is important to readers deciding whether to enter research-related text.

## First-party end-to-end source crosswalk

Read the source at `gmoon-code/research-methods` commit `94b9213ca7d4ad968c7fc9bfb02e253e4b162255`:

1. [`assets/ai-helper.js`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/assets/ai-helper.js) `buildPayload` constructs `question` and `conversation_history` independently of the `useProjectContext` Boolean; with project context disabled it supplies an empty `project_context`. `conversation()` selects recent user/assistant chat messages. This is not the same thing as the complete research notebook.
2. [`assets/ai-adapter.js`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/assets/ai-adapter.js) `normalizeChatCall` preserves the question and applies the last-**eight** message history limit whether or not context is enabled; `contextExplicitlyOff` instead selects a neutral structured context. `sendChat` sends JSON with distinct `question`, `history`, `context` and `mode` keys through `POST` to the configured class service. The client-side reduction strips specified email/phone patterns and limits permitted project fields. This is a bounded automated redaction rule, **not a guarantee of anonymity for arbitrary student-entered prose**.
3. [`api/research-chat.js`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/api/research-chat.js) independently normalizes incoming `question`, `history` (up to eight) and `context` before constructing the Cloudflare Workers AI request. Structured sensitive project keys are blocked, but arbitrary personally identifying text typed into a question is not universally detectable or guaranteed removed. Nothing about the project-context switch removes the question or chat history from an explicitly initiated Chat request.
4. [`assets/ai-helper-ui.js`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/assets/ai-helper-ui.js) displays a visitor-facing privacy note that the question and recent Research Chat messages are sent to the class service, while relevant project responses are included only when **Use my current project context** is enabled. [`tests/ai-helper-v212.test.js`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/tests/ai-helper-v212.test.js) asserts that disabling context retains `question` and `conversation_history` but empties `project_context`. [`tests/research-chat-backend.test.mjs`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/tests/research-chat-backend.test.mjs) inspects server context minimization and request handling.

The enabled/disabled distinction was verified **at the original source and existing-test assertion level**. No claim of live authenticated Chat experimentation, independent privacy penetration testing or absolute PII filtering is made.

## Single-paragraph public correction

In `research-methods-studio.html`, replaced only the existing Research Chat paragraph within `#methods-privacy`. New visitor wording:

> Optional Research Chat uses a server. Each request sends the question and up to eight recent Chat messages, even when project context is turned off. When project context is enabled, a minimized selection of project information is also sent. Students should avoid submitting identifiable participant records or other sensitive research data through that feature without appropriate safeguards.

The final sentence requiring students to verify sources and evaluate methodological guidance was also **preserved** in the published paragraph. The earlier paragraph warning that full recovery backups can include sensitive notebook records, and that old privacy copies may contain original text, remains untouched. This correction explains the decision-relevant privacy boundary without overstating data security or implying that setting context off makes Chat requests local-only. It uses a single purposeful progression and preserves the author's understated Canadian-English voice, with no inserted em dash or ordinary-prose colon.

**Public academic HTML commit:** [`6a9842f62bb21976034d6309680c39cf36cc8c9b`](https://github.com/gmoon-code/gmoon-code.github.io/commit/6a9842f62bb21976034d6309680c39cf36cc8c9b).

Original GitHub file readback matched the intended updated full HTML exactly, with the previous backup disclosure, source-verification caution and `#methods-privacy` structure intact. Direct GitHub compare from previous `d6ed6dfd...` to this commit confirmed **one changed file `research-methods-studio.html`, one line added and one removed**. No other public academic page or study figure was modified in that commit.

## Verification ceiling and next stage

The source correction triggers public Pages deployment and independent audit workflows. **Do not confuse a first asynchronous S8 failure during deployment or source-report propagation with a persistent served-page discrepancy.** The final live HTTP text/byte result must be recorded only after an actual successful source-matched delivery check.

The last fully passed release gate before this edit was [C-RV29du / run 41762038695](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41762038695), using the previous public academic page. It cannot certify the newly changed privacy sentence.

The independent 53-source Research reference register remains **46 F / 6 A / 1 M / 0 P**. The final August S2B/S2C study-row matrices, original Unit 3 administered/scored form and conversion, original student response transformation chain, dated independent reader files and executed school/participant permissions remain **evidence-gated**. No student-level private record is published in this report.

**Exact next checkpoint C-RV29dx | Confirm current public release and genuinely new research evidence.** Verify independently reported current HTTP parity for the updated academic privacy page, then inspect only new substantive source claims or original records rather than reopening completed scholarly reviews. Overall academic website content audit **In progress**.
