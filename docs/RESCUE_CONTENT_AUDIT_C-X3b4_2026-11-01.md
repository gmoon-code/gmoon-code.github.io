# Stage C-X3b4 | Writing laboratory Rescue content

1 November 2026. Continued from [C-X3b3, Data laboratory](RESCUE_CONTENT_AUDIT_C-X3b3_2026-11-01.md) in the comprehensive academic website written-content audit.

## Coverage and inspection

Read each of eight `labs.writing` entries in `gmoon-code/research-methods/assets/rescue-model-v2.5.json`: `intro` (Stage 8), `lit` (Stage 8), `method` (Stage 12), `results` (Stage 15), `discussion` (Stage 16), `closing` (Stage 17), `citations` (Stage 18), and `audit` (Stage 18). Compared these with the corresponding `assets/student-guidance.js` tab descriptions and relevant stage guidance, especially the distinction between completed empirical studies and proposals, and between numerical Results and qualitative Findings. Inspected the five-level lab rendering in `assets/rescue-ui.js`, including Level 3 comparisons and Level 5 student decision notes.

## Issues identified

- The Introduction and Literature Review tabs duplicated a paragraph-by-article scenario, making the introduction's local rationale and novelty boundaries difficult to distinguish from literature synthesis.
- The Method tab repeated a seed-level data-table example instead of teaching fidelity to reported procedures and deviations.
- The Results tab reused a correlation result with a sentence saying discussion of causation is 'reserved for Discussion', which could wrongly imply a later Discussion can make an unsupported causal interpretation. It also failed to accommodate evidence-grounded interpretation in qualitative Findings.
- Discussion, closing, citation audit and whole-paper audit had unevenly developed or mismatched examples, with the final two sharing the same generic causal-language alignment example.
- All eight Level 5 prompts were identical and generic; all eight Level 3 prompts relied on a generic fallback. Titles contained em dashes.
- Cross-tab specificity was insufficient about proposal versus completed-study statuses, traceability to actual source passages, and reconciling questions with the evidence that was actually collected.

## Corrective revisions

Replaced the eight entries' Level 1 explanations, Level 3 comparison prompts, Level 4 worked situations and drafts, and Level 5 requests with differentiated material. All titles use middle dots rather than em dashes.

- **Introduction:** a school-garden pollinator inquiry illustrates why two checked papers do not establish novelty. The draft models a bounded local research purpose.
- **Literature:** two expressly hypothetical studies operationalise 'engagement' differently. The draft compares their measures without asserting empirical findings not yet verified.
- **Method:** a planned ten observation days versus seven completed days illustrates accurate reporting and disclosure of deviations; the `observational unit` glossary term is included.
- **Results:** an expressly hypothetical complete-pair sample of 20 students reports all 12 increases, five unchanged scores and three decreases, without causal attribution. Guidance accommodates qualitative Findings.
- **Discussion:** a sunny-plot/bee-count comparison illustrates time-of-day confounding and appropriate bounded interpretation.
- **Closing:** a proposed seedling study illustrates why an abstract cannot report uncollected results.
- **Citations:** a universal claim drawn from six interviews at one school is flagged pending source verification, without inventing a supposedly corrected empirical finding.
- **Whole-paper audit:** written individual responses cannot answer a question about group interaction; the evidence chain requires a narrower question or new authorised interactional evidence.

Every scenario is instructional and hypothetical. No new empirical source or credential is asserted.

## Implemented commits

- Canonical model revisions: https://github.com/gmoon-code/research-methods/commit/c2fd69253dfcd0511fc620def499c81343b8475a
- Active runtime sync: https://github.com/gmoon-code/research-methods/commit/17fc150d18c1572526112214df837cf5934c5880
- Additional pedagogical regression assertions: https://github.com/gmoon-code/research-methods/commit/08e9db0bd453f305b3eff647e3b0b39a93d43553

## Verification

Re-fetched and parsed the complete canonical model, active runtime model, actual guidance and test source. Canonical and runtime models are deeply equal. All eight Writing tab titles, bodies, authored Level 3 prompts, worked situations, drafted outputs and Level 5 prompts are distinct. All eight are free of em dashes. All glossary terms and mapped decision keys across **all four** laboratories resolve against the actual student guidance. The current UI source includes the previously verified `compare_prompt` fallback. All 113 field entries remain in the canonical model, with lab counts Literature 8, Methods 9, Data 7, Writing 8.

Previously reviewed field, Literature, Methods and Data content was preserved through narrowly scoped updates to `labs.writing`. Targeted test assertions were committed for Writing, extending those already added for Data.

**Limit:** New Node tests were **not run**. The code execution container could not resolve GitHub's host to obtain the repository; code-level inspections and structural assertions were performed using GitHub connector access. Full browser five-level interaction, note persistence, package tests and deployed-publication parity remain unverified. Therefore the 32 tabs are source-editorially reviewed, not fully verified in a visitor-facing browser.

## Exact continuation

**Stage C-X3c | Supplementary and cross-system written-content integration.** Check that field-level Rescue help, lab help, Path Coach, glossary, mapped decisions and the study curriculum tell a consistent story, including actual Level 3 choice rendering and Level 5 notes. Inspect any remaining lesser-known prompts or supplementary content before declaring source coverage. Follow with website-wide cross-page scholarly/style consistency and browser/live deployment checks. Consult existing ledgers instead of repeating source-reviewed work. Preserve all verified earlier revisions and separately document any unrun tests or blocked deployment checks.
