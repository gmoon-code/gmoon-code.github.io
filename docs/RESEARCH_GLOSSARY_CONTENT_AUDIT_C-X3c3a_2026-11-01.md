# Stage C-X3c3a | Research glossary definitions 1–30

1 November 2026. Continued from [C-X3c2f, the completed 113-entry response-example audit](RESPONSE_EXAMPLES_CONTENT_AUDIT_C-X3c2f_2026-11-01.md), under the same comprehensive website academic-content master prompt. This is an individual prose and methodology audit of the first 30 entries of `gmoon-code/research-methods/assets/student-guidance.js`, not a claim of completing the 90-definition glossary.

## Per-entry coverage

Compared all definitions to their use in four Rescue labs, the 18-stage research curriculum, field-level student help and relevant methodological guidance. Reviewed each definition for conceptual precision, implicit claims, logical progression, Canadian English, unnecessary complexity and coherence with the established educational examples.

| # | Glossary term | Editorial status |
|---|---|---|
| 1 | `analysis` | Corrected, source-reviewed |
| 2 | `association` | Reviewed, retained |
| 3 | `attrition` | Reviewed, retained |
| 4 | `binary` | Reviewed, retained |
| 5 | `blinding` | Reviewed, retained |
| 6 | `blocking` | Reviewed, retained |
| 7 | `boolean search` | Corrected, source-reviewed |
| 8 | `calibration` | Reviewed, retained |
| 9 | `categorical` | Reviewed, retained |
| 10 | `causal claim` | Reviewed, retained |
| 11 | `chi-square test` | Reviewed, retained |
| 12 | `coding` | Corrected, source-reviewed |
| 13 | `confidence interval` | Corrected, source-reviewed |
| 14 | `confounder` | Reviewed, retained |
| 15 | `construct` | Reviewed, retained |
| 16 | `continuous` | Reviewed, retained |
| 17 | `control condition` | Reviewed, retained |
| 18 | `controlled condition` | Corrected, source-reviewed |
| 19 | `correlation` | Reviewed, retained |
| 20 | `counterbalancing` | Corrected, source-reviewed |
| 21 | `covariate` | Reviewed, retained |
| 22 | `data dictionary` | Reviewed, retained |
| 23 | `dependent variable` | Reviewed, retained |
| 24 | `descriptive statistics` | Reviewed, retained |
| 25 | `effect size` | Reviewed, retained |
| 26 | `estimand` | Corrected, source-reviewed |
| 27 | `experimental unit` | Corrected, source-reviewed |
| 28 | `exposure` | Corrected, source-reviewed |
| 29 | `external validity` | Reviewed, retained |
| 30 | `Fisher exact test` | Reviewed, retained |

## Significant findings and direct corrections

- **`exposure`** formerly defined exposure exclusively as a factor observed rather than assigned by the researcher, implying that exposure terminology could never apply to an assigned intervention. The revision defines the relevant factor broadly, then explains that an observational exposure is measured while an experimentally assigned factor is usually called treatment. See the Agency for Healthcare Research and Quality's observational comparative-effectiveness methods chapter, https://www.ncbi.nlm.nih.gov/books/NBK126191/, which defines exposure as an explanatory factor whose measurement must be justified.
- **`counterbalancing`** previously said counterbalancing 'helps address' carryover effects, potentially suggesting that varying order removes carryover. The new entry explains that it distributes or reveals order, practice and fatigue effects, while carryover may still require safeguards. Cross-checked with Dalhousie University's *Research Methods in Psychology & Neuroscience*, https://digitaleditions.library.dal.ca/researchmethodspsychneuro/chapter/chapter-9-simple-experiments/.
- **`estimand`** previously named only a generic target quantity and examples. Its revised definition specifies relevant population, outcome, comparison and measurement timing, with a clear contrast between the quantity aimed for (estimand) and the realised numerical estimate. Cross-checked with the *BMJ*'s methodological primer, https://www.bmj.com/content/384/bmj-2023-076316. The wording remains accessible outside clinical trials.
- **`confidence interval`** previously explained uncertainty and disclaimed a guarantee but did not explain why an interval receives a confidence level. The revised explanation describes repeated-use coverage conditional on assumptions and avoids interpreting the particular 95% interval as a 95% probability for a fixed parameter.
- **`experimental unit`** now names the independently **assigned** unit rather than the smallest unit that 'could independently receive' treatment, clarifying the planned tray/dish examples and nested observations.
- **`boolean search`** now explains that concept-group alternatives can include relevant variants and appropriately checked related terms, not only true synonyms, and encourages checking platform syntax.
- **`analysis`, `coding`, `controlled condition`** received precise and minimal improvements to scholarly wording and Canadian English, including `organising`, `labelling` and `standardised`. Analysis now acknowledges qualitative interpretation and research synthesis without implying all questions require numerical analysis.

The remaining 21 definitions were individually read and retained because the concepts and boundaries were already conveyed accurately. Examples such as the distinction between a control condition and controlled conditions, categorical and binary data, confounding and correlation, and confidence versus causal evidence did not warrant unnecessary changes.

## Implemented commits

- Source guidance and glossary revision: https://github.com/gmoon-code/research-methods/commit/6fb646c51f431fe577c6eb1313633548c6d2d2e2
- Regression assertions for the first 30 definitions: https://github.com/gmoon-code/research-methods/commit/a2b25f540dec3555a306241ffaad994b72978060

## Source verification

Re-fetched and parsed the committed `student-guidance.js`. Compared it with the source at the previously recorded checkpoint. Exactly **nine** of the first 30 definitions changed. All glossary entries 31–90, all 113 field-help entries, all 18 stage guides, all 32 laboratory helper entries, the mapped decisions and other student-guide metadata were unchanged. Confirmed each of the first 30 definitions remains populated and em-dash-free. All glossary terms used in the 32 Rescue lab tabs still resolve; there were no missing references. The existing student-guidance UI and Rescue help sources refer to the glossary. The new structural and content regression assertions are committed, but **the Node test suite was not executed**. Visitor-facing modal interactions and deployed parity remain unverified.

## Status and exact continuation

**Stage C-X3c3a, glossary entries 1–30 individually editorially checked; nine corrected and source-verified.** Not fully verified in-browser.

**Next Stage C-X3c3b, entries 31–60 of the same 90-term glossary, in stored object order.** Review every definition against its research design, stage usage, cross-path distinctions and Canadian English. Record all 30 per-entry decisions, apply justified revisions, and verify against the preserved 1–30 and 61–90 groups. Then inspect definitions 61–90, the 113 student-guide field descriptions, 18 stage guides and remaining novice/student-help wording. Finally perform cross-page consistency checks, Node tests, browser interactions and live publication parity before claiming site-wide verification.
