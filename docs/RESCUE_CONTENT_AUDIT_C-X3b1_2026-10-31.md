# Stage C-X3b1 | Literature laboratory Rescue content

31 October 2026. Continued the comprehensive academic website content audit from [the completed 113-field Rescue checkpoint](RESCUE_CONTENT_AUDIT_C-X3a5_2026-10-31.md). This stage addresses the eight Literature laboratory help tabs and the actual five-level visitor-facing rendering.

## Complete scope and audit observations

Reviewed `labs.literature` in `assets/rescue-model-v2.5.json`: `search`, `sources`, `screen`, `study`, `synth`, `gap`, `claims`, `outline`. Each lab tab generates Level 1 task clarification from its body; Level 2 concept help from glossary terms; Level 3 comparisons from mapped decisions or fallback content; Level 4 a worked example; Level 5 a student-authored decision note using a tab-specific prompt. Inspected the actual rendering logic in `assets/rescue-ui.js` and checked glossary terms and mapped choices against `assets/student-guidance.js`.

### Main problems

- The `search` help gave only an example Boolean string, without distinguishing a proposed query from a search actually executed.
- `sources` and `screen` shared an answer about accepting a study with caveats, despite requiring source extraction and eligibility decisions respectively. This could incorrectly encourage a source-quality judgement to replace a predetermined inclusion rule.
- `study`, `synth` and `gap` shared a generalized retrieval-practice claim. Their guidance did not separately demonstrate measurement comparability, source-supported synthesis or an appropriately bounded study rationale.
- `claims` and `outline` reused the same asserted synthesis paragraph, potentially presenting a hypothetical literature finding as verified evidence.
- All eight entries repeated the same generic Level 5 prompt to write the next literature decision and why it fits.
- Several tabs with no mapped decision choice displayed the same generic Level 3 comparison text. One Level 2 glossary term, `TRAPP`, had no matching glossary definition and therefore displayed a fallback without conceptual explanation.
- All eight headings contained em dashes and were not aligned with the author's stated editorial rule.

### Implemented corrections

`search` distinguishes planned search syntax from actual query, date, filters and retrieval count. `sources` requires a verified citation, methods, measured outcome and source-bound finding. `screen` models exclusion using stated eligibility rules, not the direction of a study's result. `study` compares assessment definitions and intervals before comparing findings. `synth` shows how to build a theme from checked sources while acknowledging incompatible measures. `gap` offers a local extension instead of an unsupported claim of novelty; its Level 3 uses the existing `gapType` decision support. `claims` models an unresolved sweeping assertion and its necessary source check. `outline` develops a sequence of comparisons and naturally connected paragraphs.

All eight now have distinct task-specific bodies, worked situations and reasoning sequences, draft outputs and Level 5 prompts. Added `compare_prompt` to the canonical lab entries. A minimal change in the existing visitor-facing `assets/rescue-ui.js` renders this tab-specific comparison when Level 3 has no decision menu, replacing the previously generic fallback. The `TRAPP` glossary reference was replaced with the existing, relevant `citation` entry. Eight tab titles were refined using a middle dot instead of an em dash.

Hypothetical examples and placeholder study IDs are not described as real empirical findings. Guidance makes distinctions among measured observations, interpretations and claims based on source verification.

### Commits

- Initial search, source, screening and matrix revisions: https://github.com/gmoon-code/research-methods/commit/ae621bdbe6c649bf1997d324865c870abfc1e5c4
- Synthesis, rationale, claim audit and paragraph planning: https://github.com/gmoon-code/research-methods/commit/c5f450e39d8eb68d736ee95b4eca120e22aa1120
- Level 3 comparison content and glossary repair: https://github.com/gmoon-code/research-methods/commit/e2512ba9342c49e11278399caf7e9116332871d0
- Level 3 UI content display: https://github.com/gmoon-code/research-methods/commit/535c29e3bcb62c84d715754be298fa4c287b5ebc
- Tab-title editorial correction: https://github.com/gmoon-code/research-methods/commit/248c2ec1ed526b5461bd694385888e81dc7a43c8
- Canonical-to-runtime final sync: https://github.com/gmoon-code/research-methods/commit/afe49f716d9e150331fb07c3fbc53c62dd72e1e7
- Regression additions and final assertion correction: https://github.com/gmoon-code/research-methods/commit/898ece5c852f14979c4b1ef9b99a1cfadbab1445 and https://github.com/gmoon-code/research-methods/commit/a8fec1b57b7e7eb9617fb294f5adba7e8c7cca95

## Verification

Compared the complete canonical Rescue model after the stage (blob `0fc65123866411a7826c964c8d45ea412f3cb03d`) with its immediately prior blob `efdb15f3ba88df4fa1cdf6e6b72c42c3e8a329d9`. **Only the `literature` lab object changed. All 113 field entries and the methods, data and writing labs are unchanged.**

All eight Literature entries have unique titles, bodies, Level 3 comparison prompts, Level 4 worked drafts and Level 5 next-decision prompts. All terms resolve against the actual student glossary. All eight contain no em dashes. Current `gapType` choice data resolves in the existing source. The updated `assets/rescue-ui.js` was successfully parsed as JavaScript and contains the new content rendering expression. Canonical and active Rescue model objects match. Actual `tests/rescue-v25.test.js`, using the real model and Rescue engine in an isolated V8 harness, completed with `PASS v2.5 progressive rescue state and logging`.

These checks establish editorial and source-methodological verification and a syntax-level check of the rendering change. **A real browser test of opening each five-level lab path and production deployment parity remains outstanding.** Full Node package and end-to-end user interaction tests have not been claimed.

## Status and exact next continuation

**Stage C-X3b1, Literature laboratory (8/8 tabs) editorially and source-methodologically verified.** Rescue field bank 113/113 is preserved. One of four Rescue laboratories has been reviewed in this renewed pass; the other three have not.

**Next Stage C-X3b2 | Methods laboratory.** Begin with `labs.methods.design`, then examine `vars`, `rep`, `sample`, `measure`, `ethics`, `procedure`, `data` and `audit` in that order. Check every visitor-facing five-level content route, glossary term and mapped choice, field-specific worked reasoning, proper distinction between experimental and observational units, consent/approval claims, methodological validity and uniqueness of next-decision prompts. Preserve all audited field entries and the Literature lab. Then continue to the Data and Writing labs, supplementary field help, cross-system editorial checks, and live publication/browser verification.
