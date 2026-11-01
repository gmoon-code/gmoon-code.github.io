# Stage C-X3c3c | Research glossary definitions 61–90, final glossary batch

1 November 2026. Continued from [C-X3c3b, glossary definitions 31–60](RESEARCH_GLOSSARY_CONTENT_AUDIT_C-X3c3b_2026-11-01.md). The last 30 glossary entries were each read in full and compared with their pedagogical use in the research curriculum, Rescue laboratory prompts and the author's academic writing requirements.

## Individual entries and review decisions

| # | Definition | Editorial status |
|---|---|---|
| 61 | `protocol` | Corrected |
| 62 | `pseudoreplication` | Reviewed and retained |
| 63 | `qualitative data` | Corrected |
| 64 | `random assignment` | Corrected |
| 65 | `random sampling` | Reviewed and retained |
| 66 | `reliability` | Reviewed and retained |
| 67 | `repeated measures` | Reviewed and retained |
| 68 | `replication` | Reviewed and retained |
| 69 | `research question` | Reviewed and retained |
| 70 | `sample` | Corrected |
| 71 | `sampling frame` | Corrected |
| 72 | `sampling method` | Reviewed and retained |
| 73 | `scale` | Reviewed and retained |
| 74 | `standard deviation` | Reviewed and retained |
| 75 | `statistical significance` | Reviewed and retained |
| 76 | `stratification` | Reviewed and retained |
| 77 | `subsample` | Reviewed and retained |
| 78 | `synthesis` | Reviewed and retained |
| 79 | `technical replicate` | Reviewed and retained |
| 80 | `theme` | Reviewed and retained |
| 81 | `TRAAP` | Reviewed and retained |
| 82 | `variable` | Reviewed and retained |
| 83 | `within-unit design` | Reviewed and retained |
| 84 | `Welch t-test` | Reviewed and retained |
| 85 | `ANOVA` | Reviewed and retained |
| 86 | `McNemar test` | Corrected |
| 87 | `Cochran Q` | Corrected |
| 88 | `regression` | Corrected |
| 89 | `citation` | Reviewed and retained |
| 90 | `identifiable data` | Reviewed and retained |

## Substantive corrections

- **`protocol`** now distinguishes prespecified and later analytic decisions while explicitly acknowledging dated, explained amendments. The old phrase 'locking a protocol' could imply that a research plan must never be amended.
- **`qualitative data`** now includes classroom talk, diagrams, models and observed interaction, respecting the curriculum and the author's emphasis on different routes through which learners make their science understanding available. Qualitative data need not consist solely of non-numerical transcript text, and some projects also use counts.
- **`random assignment`** now explains that randomisation reduces systematic assignment bias without guaranteeing identical groups in any one realisation, particularly with few experimental units.
- **`sample`** now distinguishes proposed eligibility and recruitment from the units that actually contribute evidence, while accommodating people, documents and physical records.
- **`sampling frame`** now describes the operational source from which a sample is selected and notes that it may fail to cover the whole population. It no longer inaccurately restricts sampling frames to probability samples.
- **`McNemar test`** now identifies paired binary marginal proportions and the role of discordant pairs while excluding unsupported causal claims or automatic conclusions about agreement. Cross-checked with https://www.ncbi.nlm.nih.gov/books/NBK560699/.
- **`Cochran Q`** now clarifies its omnibus role comparing related binary responses across three or more conditions, without suggesting that the omnibus result identifies particular differing conditions.
- **`regression`** now avoids presenting statistical association as an observed causal change and explicitly distinguishes model coefficients from causal effects absent further design and assumptions.

**Verified and retained:** The TRAAP checklist remains Timeliness, Relevance, Authority, Accuracy and Purpose, consistent with Australian National University guidance, https://libguides.anu.edu.au/c.php?g=906019&p=6594267. The remaining 22 entries were reviewed and retained, including replication versus technical repeats, reliability, validity-related terminology, within-unit designs, Welch's t-test, ANOVA, and source-linked citation integrity. Edits were limited to identified scholarly or interpretive problems.

## Commits

- Definitions 61–90, eight corrected: https://github.com/gmoon-code/research-methods/commit/09da7cfab974b9e5f816e67b6a99850555e88cd4
- Added final glossary regression assertions: https://github.com/gmoon-code/research-methods/commit/25550c68a70d2b83112ec859c0ec751981bae974

## Verification

Read back the committed `assets/student-guidance.js`, `assets/rescue-model-v2.5.json`, test source and student guidance UI. All 90 glossary entries remain present and nonempty, and none contains an em dash. No Rescue laboratory glossary lookup is broken. Compared to the preceding audit checkpoint, exactly **eight** glossary definitions changed, all among entries 61–90. Definitions 1–60 and all other student-guide objects remain unchanged; the project still has 113 field guidance entries, 18 stages, and all 32 laboratory help tabs. Source-level test assertions now cover all three 30-term batches. **The Node test suite was not executed**, and complete real browser glossary interactions and deployed publication parity remain outstanding.

## Overall glossary status

**90/90 glossary definitions individually source-editorially reviewed**, with 9 + 11 + 8 = **28 justified corrections**. These source-level checks do not mean fully verified browser behaviour or completion of the broader website audit.

## Exact continuation

**Stage C-X3c4a | Student guidance field entries 1–25 of 113** in the stored order of `assets/student-guidance.js`. Inspect each field's `meaning`, `write`, `example`, `questions`, `avoid` and any special values, comparing with the corresponding Rescue five-level content, corrected response-example models, curriculum sequence, Path Coach and established writing style. Preserve verified material, commit warranted changes, and record individual field statuses in the audit ledger.

Next continue student-guide field entries 26–50, 51–75, 76–100 and 101–113; thereafter inspect the 18 stage guides, 32 lab guides as distinct student-guide prose, remaining novice-friction and supplementary help text, and cross-page consistency. End with actual package tests, real visitor/browser interactions and production publication verification before labelling the website audit complete.
