# Stage C-X3c11c | Manuscript-wide citation coverage and nonmechanical writing diagnostics

Date 1 November 2026. Continued from [C-X3c11b](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c11b_2026-11-01.md). Reviewed the complete manuscript-level citation audit and citation panel, Method and Discussion sentence heuristics, proposal Discussion requirements, exported Writing Lab outlines, Canadian English spellings and the author's prohibition on em dashes. Examined their surrounding Writing Lab guidance and checked the reported issues against actual source code and executed tests. This stage focuses on **literal academic-writing and evidence-traceability content**, not page styling or layout.

## Reviewed material and findings

| Area | Verified issue | Correction |
|---|---|---|
| Citation coverage across the paper | The whole-paper citation audit and visible citation panel examined Introduction, Literature Review and Discussion only. Citations solely in Method, Results, Conclusion or Abstract could go unreported | Both now examine the actual draft text of all **seven manuscript sections**. Source identities, ambiguity and source-screening warnings still use the prior stage's constrained bibliographic matching |
| Citation UI scope | The empty-state text expressly said that only three manuscript sections were inspected | The text now specifies all seven draft sections, and makes clear that other citation styles and unusual references require manual inspection |
| Method section classification | The previous detector treated any use of “significant” as a critical Results-language problem. Ordinary wording such as `significant figures` could be wrongly flagged | Narrowed detection to explicit result-like language, including statistically significant results. Suspected results in Method receive a wording/check prompt rather than a conclusive determination of incorrect content |
| Discussion answer heuristic | A Discussion could be treated as having a clear research-question answer merely because it contained generic phrases such as `results suggest`, whereas equally clear answers using different phrasing triggered a warning | Removed the false lexical threshold. The advice prompts a continuous reading of the Discussion and recognition of an explicit, evidence-grounded answer, without asserting that a particular fixed phrase proves adequacy |
| Discussion limitations | The diagnostic relied on a small list of keywords, which could incorrectly mark valid prose that expressed limitations through context or scope | Changed it to a lower-severity content-review prompt, explicitly acknowledging that limitations may be expressed without conventional vocabulary |
| Proposal Discussion guidance | A proposal received the same imperative to interpret existing anchor findings as a completed empirical report | The checklist now asks how planned evidence may bear on the question and warns against inventing observed findings |
| Research question wording | An unrecorded question was described as `not locked`, implying a commitment or lock event that the Writing Lab had not established | It is now described as `not recorded`, with guidance to connect the introduction to the actual question |
| User writing rules | Generated Method and Results Markdown outlines included two em dashes in authored lines | Removed the em dashes and retained readable labels that preserve factual meaning |
| Spelling | Scanned remaining user-facing text for common American/Canadian variant spellings | No unsupported mass replacement was applied. Canadian conventions can accept `organize` and `organization`; preserve consistency with the user's preference for `analyze` rather than imposing arbitrary British spellings |

## Commits

- [Full-manuscript citation coverage and careful heuristics in the Writing engine](https://github.com/gmoon-code/research-methods/commit/71f616a8926eaabbdf1fec6b23ba1909e639f8ad)
- [Visible citation panel now audits all seven drafts](https://github.com/gmoon-code/research-methods/commit/f8d323e090d90858ed60cff86040085231dd47c7)
- [New manuscript-wide citation and writing-style regression cases](https://github.com/gmoon-code/research-methods/commit/f3f33db5a647fcc98cd709bd66d95fb234a91c3d)

Verified final source blob SHA values:
- `assets/writing.js` `7b1524d11c18b053d0367546eb7c7b61afb06a33`
- `assets/writing-lab-ui.js` `52939e14d947d47c1d8cef2ecaf8e7d8b40f0cd0`

## Verification

**Six of six targeted Writing Lab suites passed** against the committed sources in isolated V8 with the Node `require`, filesystem and browser global bootstrapping adapted to the available execution environment.

1. `tests/writing.test.js`
2. `tests/writing-content-integrity.test.js`
3. `tests/writing-guidance-ui.test.js`
4. `tests/writing-reporting-fidelity.test.js`
5. `tests/writing-reporting-ui.test.js`
6. `tests/writing-manuscript-citation-coverage.test.js`

The new regression uses actual draft content with citations appearing only in Method, Results, Conclusion and Abstract. It checks that all four are detected by the whole-paper engine and rendered citation panel, that evidence-limitation language cannot be judged by formulaic word matches, and that routine measurement terminology such as significant figures is not treated as a results claim. It also checks that proposal Discussion requirements do not imply observed data. Both source files parsed successfully, and zero em dashes remained in these two audited Writing Lab source assets.

**Not executed:** complete native Node CLI tests, full DOM/browser interaction and persistence, generated Word file inspection, original-article citation support verification or public deployment parity. The citation parser is an incomplete recognition aid, not a complete APA or other referencing validator. Distinct citations with identical author/year keys remain flagged for manual bibliographic identification.

## Outstanding substantive questions

- The detector still misses some legitimate in-text citation variants, including prefixed citations, organisational authors, multiple narrative formats and non-Latin author names. Expand only with representative source-grounded regression fixtures and never equate a match with verified claim support.
- Bibliographic entries remain ungenerated until each record's original publication details can be verified. The source workspace does not certify an exact quoted passage or every nearby inference.
- A score or warning count from the whole-paper heuristic is not a full scholarly evaluation. Cross-paragraph rhetorical development, claim boundaries and the author's style require deliberate reading of whole authored passages.
- Proposal/completed distinctions are student-reported; methods documentation and actual observation require evidence outside these simple controls.
- System-wide manuscript-to-source comparison, deeper references/abstract/statement checks, native Node/browser and published-site verification remain outstanding.

## Exact next continuation point

**Stage C-X3c11d | Source-key and citation-format edge cases, bibliography and final export fidelity.** Review sourceKey assumptions about multi-author names, source identity and non-Latin names; verify reported citation visibility for reasonable APA variants without treating matching as source verification. Examine reference-related wording in generated manuscript documents and audit snapshots. Test actual Writing Lab export handlers and the limits of citation completeness claims. Then proceed to cross-system source/content consistency and final native Node, browser and deployment parity checks. Preserve C-X3c11a–c and the earlier Data Lab ledgers.

**Stage status:** C-X3c11c source-editorially completed and six focused suites verified in isolated V8. Comprehensive website content audit remains in progress.
