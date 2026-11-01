# Stage C-X3c11b | Writing Lab research status, Method/Results fidelity and manuscript exports

Date 1 November 2026. Continued from [C-X3c11a](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c11a_2026-11-01.md). Reviewed the complete Method/Results blueprint functions, manuscript section and whole-paper audits, Method and Results Markdown exports, research-paper Markdown builder, and corresponding Method, Results, Discussion, Closing and export guidance in `assets/writing.js` and `assets/writing-lab-ui.js`. Compared these with the audited Methods Lab's dated protocol snapshots, Data Lab's historical analysis provenance and the user's mandatory evidence accuracy and personal writing voice. **Scoped source revisions and five focused suites passed in isolated V8. No browser, native Node CLI or deployed-site verification was performed.**

## Findings and corrections

| Component | Source-supported issue | Implemented correction |
|---|---|---|
| Research reporting status | The Writing Lab had no explicit, dependable distinction between a proposal, completed research and an unconfirmed manuscript. The abstract and paper audits could demand observed results from a proposal, while a saved statistical run could be mistaken for a completed study | Added a student-selected `writing.reportingMode` with values `proposal`, `completed` and `unconfirmed`. Existing projects default to unconfirmed rather than inferring status from available records. The Results panel exposes the distinction and saves the choice |
| Proposal audit | The whole-paper audit required Results and Discussion drafts and a Data Lab run even when the manuscript represented work that had not been undertaken | For explicitly marked proposals, those completed-results checks are not presented as missing empirical evidence. The abstract prompts instead examine whether proposed work was misrepresented as observed |
| Qualitative/review work | Numerical output records were treated as a prerequisite for any Results section, and conventional test vocabulary was demanded even for qualitative findings | Missing numeric Data Lab calculations are now a warning about traceability, not proof of absent evidence. Qualitative and review-based findings can be supported by other records; numerical cues are not mandatory |
| Unconfirmed status | The audit could silently assume completed work when status had not been recorded | The whole-paper audit requests explicit confirmation and avoids claiming actual study completion on behalf of the student |
| Method blueprint | The latest saved protocol was shown without its recorded date and could be interpreted as a description of completed procedures | The blueprint retains `lockedAt` as `protocolRecordedAt` and labels the record as the most recently saved **planning** version. The Method outline asks students to verify actual conduct, changes and contemporaneous records. A saved protocol does not establish ethics approval |
| Results blueprint and outline | The Writing Lab exported unqualified neutral summaries from saved runs without the Data Lab's missing-value decisions, historical safeguards, analysis settings, original dataset metadata or analysed denominators | Each analysis outline now carries its stored timestamp, safeguards, source file, rows used and omitted, configured missing tokens, original estimand, model/column choices, summary and assumption checks. Older records are explicitly described as requiring renewed verification |
| Manuscript export | The paper builder used unqualified empirical section headings for every draft, could imply observed Results for proposals and did not identify the manuscript's research status | The export records the student-selected status. Proposals use `Planned Method`, `Proposed analysis and reporting` and anticipated-interpretation headings, retaining authored draft text with a clear warning that anticipated outcomes are not observed findings. Completed or unconfirmed projects retain Results and Discussion headings, with an unconfirmed status note as applicable |
| Reference fidelity | Full bibliographic entries remain unverified | The paper export explicitly says that no reference entries were generated and directs students to verify every citation against original publications. It does not invent a bibliography |
| Tone and genre | The earlier audit relied on generic empirical expectations that could override an appropriate research genre | Revised prompts recognise differences among proposed, quantitative, qualitative and review work and avoid prescribing findings or interpreting numerical results that are not present |

## Corrections discovered through regression

The first new reporting-mode test exposed an actual bug in the new whole-paper audit. The mode was being read from the section-text object (`w.reportingMode`) instead of the project-level Writing Lab record (`p.writing.reportingMode`). That implementation was corrected and retested. The subsequent failure came from a case-sensitive assertion looking for `verify` where the actual correct exported sentence began with `Verify`. The test was corrected without rewriting the intended Method message. An earlier rendered-guidance test also referred to the previous wording of the latest-analysis caution and was updated to the revised text.

No failed test is being counted as passed until the corrected file and actual repository source were executed again.

## Commits

Production revisions:
- [Research-status-aware section and paper audits](https://github.com/gmoon-code/research-methods/commit/e95feb61a10a975ec962e77f95f3427a5f311c2a)
- [Method, Results and paper export evidence fidelity](https://github.com/gmoon-code/research-methods/commit/d66992671133d65841ae414eec375d83646da71b)
- [Rendered research-status choice and Method, Results and Discussion instructions](https://github.com/gmoon-code/research-methods/commit/40e4ef6de1261840a7e4c235b8bb2763e24adcee)
- [Correct reporting-mode source within the whole-paper audit](https://github.com/gmoon-code/research-methods/commit/aafe307844c5151c68bd72c46cd5d83c4909ea2f)

Regression coverage:
- [Explicit proposal, qualitative and historical export cases](https://github.com/gmoon-code/research-methods/commit/5f308b3fc6a3bfd034e2ab43df980b4bff6ca0ec)
- [Rendered status and export-routing test](https://github.com/gmoon-code/research-methods/commit/ec555c6bff35e810da4262759bda435ec34b3b04)
- [Refresh older rendered-language expectation](https://github.com/gmoon-code/research-methods/commit/7af73b58d5dfc5f7fb02e818a8c2c4a33d347d25)
- [Correct case-sensitive test expectation](https://github.com/gmoon-code/research-methods/commit/dd1db0ee49083888eeecf879335ef4face709dc9)

Final fetched production blobs:
- `assets/writing.js` `714c32d791242144436218d25dee862b006ef67a`
- `assets/writing-lab-ui.js` `5bb82b5f14df860c208ffdda22bf6503dbf924be`

## Verification performed

**Five of five actual Writing Lab test suites passed** in isolated V8 with adapted Node bootstrap and file-reading functions.
1. `tests/writing.test.js`
2. `tests/writing-content-integrity.test.js`
3. `tests/writing-guidance-ui.test.js`
4. `tests/writing-reporting-fidelity.test.js`
5. `tests/writing-reporting-ui.test.js`

The newly added examples cover a research proposal with no observed findings or statistical run, a completed qualitative project with evidence outside the numerical laboratory, a previously saved Method version with its recorded date, historical and current statistical results, omitted rows and missing tokens, and retained source/configuration/estimand details. The rendered-interface test checks explicit reporting-status options and different Discussion instructions. Both edited production assets also passed JavaScript syntax parsing.

**Not performed**: actual browser change/save events; persisted browser-store round trips; end-to-end generated Word file content and formatting; complete Node CLI tests; full research paper claim verification; deployed-site parity.

## Remaining limitations and cross-system dependencies

- Reporting status is a student-selected declaration. The application cannot determine that research has actually been completed, whether participants gave consent, or whether results are authentic. The `completed` choice is intentionally labelled as student-reported.
- An archival Method version captures a plan. Even a `lockedAt` timestamp does not prove when particular work was carried out or that procedures followed the plan. The Method must be checked against actual evidence.
- A stored statistical calculation is not necessarily the primary, prespecified, best-supported or independently validated analysis.
- Research writing can contain complex citation patterns not parsed by the simple detector. No citation match alone verifies a claim.
- The `paperMarkdown` export includes user-authored text as entered, even if a proposal's text wrongly describes observed effects. Its status labels help readers recognise the uncertainty; they do not independently rewrite or certify the text.
- The exported Results outline includes selected Data Lab provenance fields but does not itself reanalyse the stored dataset. The original Data Lab ledger and tests remain controlling for numerical inference.
- A complete sentence-by-sentence audit of all other writing guidance, reference conventions, document exports and cross-page academic prose remains outstanding.

## Exact next continuation point

**Stage C-X3c11c | Remaining Writing Lab claim checks, literature synthesis and citation integrity.** Audit the entire Writing Lab export and section-audit chain for cited source eligibility, unmatched/multiple author–year records, causal wording false positives, methods/results boundaries, interpretation of limitations, and conclusion/abstract accuracy. Check natural flow and diverse meaningful connections between each neighbouring instructional sentence and paragraph against the user's writing rules. Extend actual regression cases as warranted. Then proceed to comprehensive cross-system consistency and ultimately native Node, real browser and deployed-site verification. The website's overall content audit must not be described as finished before those later checks.

**Stage status**: C-X3c11b is source-editorially corrected and verified by five targeted isolated-V8 suites; broader audit incomplete.
