# Stage C-X3c7c | Remaining research-choice guidance groups 14–21 of 21

1 November 2026. Continued from [C-X3c7b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c7b_2026-11-01.md). Reviewed every title, prompt, choice explanation and reflection question in `sourceType`, `screeningStatus`, `themeStance`, `analysisStructure`, `outcomeType`, `correlationCoefficient`, `anovaModel` and `fisherChoice`. Compared with Literature and Data Lab guidance, Rescue model, student-guidance field review, curriculum statistical distinctions and published methods guidance. Status: **editorially source-verified, with material cross-system dependency outstanding**.

| Choice group | Status | Decision |
|---|---|---|
| `sourceType` | Reviewed and retained | Source-type classes distinguish original empirical studies, systematic reviews/meta-analyses, narrative reviews and other sources without assuming that publication venue guarantees evidentiary quality |
| `screeningStatus` | Corrected one option | The 'Included' explanation now requires completed relevant eligibility checks and distinguishes apparent title/abstract relevance from full-text inclusion |
| `themeStance` | Corrected one option | A study should be called conflicting only for substantively incompatible comparable evidence; differing p-values or statistical-significance labels alone are insufficient |
| `analysisStructure` | Reviewed and retained | Distinguishes independent, paired, nested, categorical and repeated binary evidence, and flags simplified choices' limitations |
| `outcomeType` | Reviewed and retained | Distinguishes count, continuous/numerical, ordinal, binary, nominal and qualitative evidence with suitable classification cautions |
| `correlationCoefficient` | Reviewed and retained | Pearson and Spearman descriptions correctly emphasise association structure and scatterplot interpretation rather than a normality-test-only rule |
| `anovaModel` | Reviewed and retained | Welch versus classical ANOVA descriptions maintain the independent-groups and variance-model distinction |
| `fisherChoice` | Reviewed and retained | Chi-square and Fisher exact explanations correctly require suitable independent count tables and warn that paired outcomes need paired methods |

**Eight choice groups reviewed, two option descriptions corrected, six groups retained.** Choice labels, IDs, prompts and questions were preserved.

## External methods cross-check

PRISMA 2020 distinguishes screening records, assessing full-text reports for eligibility, and the number of studies included in a review. Refer to https://www.prisma-statement.org/prisma-2020 and https://pmc.ncbi.nlm.nih.gov/articles/PMC8005925/. Cochrane's methods guidance cautions against interpreting differences in study effect estimates or significance categories without attention to uncertainty, design and measurement; see https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-10 and https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-15.

## Significant unresolved cross-system integrity issue

During verification, source inspection of `assets/literature.js`, line 29, found:

```javascript
screeningStatus:s.screeningStatus||"Included",
```

This default labels a source without a recorded screening status as 'Included'. The same module's `gapReadiness` and `makeStudyMatrixCSV` functions select sources with `screeningStatus === "Included"`. **Consequently, an unreviewed source can be treated as part of the included evidence set through this code path.** This is directly at odds with the corrected guidance and with the distinction between preliminary relevance and verified eligibility. It is an identified source-code dependency, **not corrected in the content-only stage**; a change requires reviewing how new records, legacy saved projects, screen buttons and exports manage status, then executing regression checks. Do not mark screening/inclusion integrity or overall Literature Lab functioning as fully verified.

## Changes and verification

- Content commit: https://github.com/gmoon-code/research-methods/commit/cb9ee2721163c1a1cbc29701ee38c51543cb2487
- Added regression checks: https://github.com/gmoon-code/research-methods/commit/170d59e0216e8a892e2f442aa1e3d13d32161d94

Re-fetched `student-guidance.js` and compared its source recursively with immediate predecessor blob `11e1cfc8f88fd90fac01006c60d869169f7885de`. Exactly two leaf values changed, both within the intended choices; all 18 stage guides, 113 field entries, 90 glossary definitions, 32 lab descriptions, novice promise and other choices were unchanged. Source-level assertions passed. Node tests were committed but not executed; browser and public-site parity remain outstanding.

## Consolidated residual guidance coverage

| Area | Source entries reviewed | Scope |
|---|---:|---|
| Novice onboarding text | 1 | C-X3c7a |
| Choice explanations | 21 / 21 | C-X3c7a–c |
| Choice groups with any corrected content | 9 | `questionType`, `gapType`, `designType`, `msMethod`, `meHuman`, `meIdent`, `meIntervention`, `screeningStatus`, `themeStance` |
| Choice groups reviewed and retained | 12 | No revision justified |

Individual decisions and exact changed property paths are recorded in the three batch ledgers.

## Exact next continuation point

**Stage C-X3c8a | Cross-system student-help prose and screening integrity.** Inspect the actual `student-guidance-ui.js`, `rescue-ui.js`, `path-coach.js`, `literature.js` and relevant UI/help fallback literals to locate unreviewed instructional content, inconsistent language and the source-inclusion default above. Determine how default statuses and stage transitions affect the actual evidence set. Preserve all audited guidance values and do not change application logic without targeted tests and verified compatibility. Then review remaining user-facing method/analysis messages and run Node/browser/public parity checks where accessible. The 21/21 choice review is complete at the source-editorial level; the site-wide audit is not.
