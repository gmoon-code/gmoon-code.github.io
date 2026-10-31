# Stage C-X3b2 | Methods laboratory Rescue content

1 November 2026. Continued from [Stage C-X3b1](RESCUE_CONTENT_AUDIT_C-X3b1_2026-10-31.md), without changing previously reviewed Rescue fields or the Literature laboratory.

## Scope

Reviewed the nine canonical `labs.methods` entries in `gmoon-code/research-methods/assets/rescue-model-v2.5.json`: `design`, `vars`, `rep`, `sample`, `measure`, `ethics`, `procedure`, `data`, `audit`. Examined the Level 1 body, Level 2 terminology, Level 3 comparison opportunity, Level 4 example, and Level 5 continuation for conceptual relevance and methodological scope. The prior Literature stage verified that `compare_prompt` is rendered for tabs without mapped decision menus.

## Issues found

- `rep` duplicated `vars`' stress/performance example, leaving independent treatment units and pseudoreplication unexplained in the example.
- `measure` and `ethics` duplicated `sample`'s class-convenience-sampling example instead of illustrating instrument quality and participant protections.
- `procedure`, `data` and `audit` repeated the same seeds-in-dishes example and worked draft, although each tab requires a different decision.
- All nine Level 5 prompts were generic and repeated verbatim; entries without mapped menus had no authored, task-specific comparison.
- Titles used em dashes contrary to the author's writing rule.
- The initial design, sampling and variables examples needed more explicit distinctions among assignment, observation, unit structure, operationalisation and supported claims.

## Changes implemented

All nine entries received distinct titles, refined bodies, task-specific Level 3 `compare_prompt` content, separate worked situations with reasoning and provisional draft outputs, and specific Level 5 reflection prompts. The revised examples address observational sleep and quiz scores, operationally defined stress, seed subsamples versus dish replication, convenience-class recruitment, plant-height measurement, identifiable student records and school permission, a reproducible seedling protocol, nested data and missingness, and a dated pre-collection protocol audit.

Examples remain hypothetical. The ethics example directs the student to applicable institutional and school rules, consent or assent where required, and approved alternatives rather than treating any single permission rule as universal. The design and replication examples expressly prevent unjustified causal and independent-replicate claims.

## Commits

- Canonical Methods laboratory corrections: https://github.com/gmoon-code/research-methods/commit/d793f34a0c372acbe0fb324124d2db61d89be365
- Active visitor-facing model synchronisation: https://github.com/gmoon-code/research-methods/commit/25ae472fe74a4fc32788e5c1b68c0d53a4e60c7e

## Verification and limits

Re-fetched both models and parsed their complete contents. Deep JSON equality passed. All nine Methods tabs are present; their titles, worked situations, worked draft outputs, comparison prompts and next-decision prompts are individually distinct. None of the nine Methods entries contains an em dash. The original field and Literature objects were preserved through a narrowly scoped object edit. These are **source-level editorial checks**, not a real-browser or deployed-site test.

**Status: Methods lab 9/9 source-editorially verified, with methodological and deployment testing outstanding.** Confirm that all terms resolve in the rendered Level 2 glossary and all mapped choices render in Level 3 during the subsequent integration pass. Full five-level interactive browser behaviour and production parity remain **unverified**. This file makes no claim of a complete automated test suite.

**Exact next checkpoint: Stage C-X3b3, Data laboratory**, starting `labs.data` in canonical order. Afterwards audit Writing laboratory, remaining supplementary help and cross-path consistency, then perform browser/end-to-end and live-publication checks. Maintain the preserved 113/113 field coverage and the Literature and Methods revisions.
