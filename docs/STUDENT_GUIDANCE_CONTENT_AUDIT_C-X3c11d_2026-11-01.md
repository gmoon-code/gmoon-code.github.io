# Stage C-X3c11d | Conservative bibliography identifiers, citation variants and Writing Lab export fidelity

Date 1 November 2026. Continued from [C-X3c11c](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c11c_2026-11-01.md). Reviewed `sourceKey`, `citationAudit`, `paperAudit`, the complete Writing Lab citation panel and the actual Method, Results and paper document export handlers. Compared the implementation against Literature Workspace source fields (`authors`, `year`, `citation`, screening status, IDs), the earlier manuscript-wide citation audit, and the author's requirements for accurate claims, gentle and precise prose, natural connections and no invented references. **Source-level corrections and eight focused Writing Lab suites verified; not a native Node, real browser or deployed-site verification.**

## Confirmed findings and justified corrections

| Content area | Source-backed problem | Implemented improvement |
|---|---|---|
| Source-key construction | The earlier `sourceKey` took the last word from unstructured author text. A record such as `John Smith` or `World Health Organization` could be indexed under `Smith` or `Organization` without evidence that the last word is the correct citing surname. This is particularly problematic for different personal-name conventions and organisations | Limited automatic key creation to structured author strings with a recognisable first-author surname, a single explicit surname, or an appropriately formatted initial citation. If an author/year combination remains unclear, it is **unindexable**, not guessed. Structured publication year remains necessary |
| Author and year record completeness | Sources with incomplete authors or publication years were silently absent from the audit's indexing/unused-source counts | `citationAudit` now exposes an explicit `unindexable` collection. The whole-paper audit and citation panel ask students to check these records rather than treating their omission as proof of no citation |
| Common citation forms | The earlier detector missed qualified parenthetical citations such as `(see Smith, 2024; e.g., Lee, 2023)`, narrative two-author citations such as `Park and Lee (2020)`, and some accented surnames | The detector now recognises those limited forms using Unicode-aware patterns and keeps the original text of each detected citation. The first-author/year key remains a retrieval aid, and a match still does not independently validate full authorship, publication identity or the cited claim |
| Citation guidance | The citation panel's reference note did not explain the consequences of unsupported author formats and missing structured fields | Added a count and visible explanation of records without a reliable author-year key. The caution now explicitly acknowledges multi-author identity, organisational authors, non-Latin patterns and unusual citation formats, with a request to consult actual publications |
| Export routing | Before this stage, Method, Results and manuscript Markdown functions had been checked individually, but their use in the actual Writing Lab button handlers had not been executed in a scoped regression | Added a handler-level test exercising all three actual export actions with controlled document functions. It confirms that the passed Method text retains the saved protocol date and planning status, that the Results outline carries the historic/current distinction, missing tokens, original source and denominators, and that the paper export preserves the student-reported proposal status and does not invent references |
| Audit snapshots | The Writing Lab's Save Audit action had not been checked together with these exports | The same handler-level regression confirms the audit history receives a dated entry and that its action routes back to the audit view |

## Scope boundaries

The citation checker remains intentionally incomplete. An unstructured multiword name may be a valid personal or organisational author but cannot be safely treated as an APA surname without more structured metadata. Non-Latin in-text names, institutional abbreviations, additional punctuation conventions, multiple works in one citation beyond the checked patterns and many complex narrative formats still require manual verification. **A bibliographic match is never evidence that the cited paper supports the nearby statement.** The checker does not generate or fabricate a reference list.

The Word export test invokes the actual Writing Lab handlers and captures the Markdown handed to `RMSWordExport.fromMarkdown`. It **does not** inspect a rendered Word document, confirm its formatting, or simulate a full browser download. Audit-history timestamps and student-supplied reporting-status labels do not prove research completion, ethics approval or original data validity.

## Source and test commits

- [Conservative author-year source keys and prefixed or accented citation patterns](https://github.com/gmoon-code/research-methods/commit/4ce05efaee0b78450faaddce1f306d522e426183)
- [Citation panel count for records without reliable source keys](https://github.com/gmoon-code/research-methods/commit/da4b4f1101499476e8d9833f93b41d914a95d27f)
- [Visible explanation for unindexable bibliographic records](https://github.com/gmoon-code/research-methods/commit/0da2573421400baf405ce123974fcbbc6531456c)
- [Manual original-publication checking and citation-parser scope](https://github.com/gmoon-code/research-methods/commit/7dcf910ed32fb260bb3693fd60a536816750984d)
- [New conservative citation-identity and rendered-panel regression](https://github.com/gmoon-code/research-methods/commit/39e79839cf4fc53989dae6dd96458d4c79a50c3b)
- [New actual Writing Lab Method, Results, paper and Save Audit handler regression](https://github.com/gmoon-code/research-methods/commit/cf40802bf141fd302ed6c48144da0429fff05352)

Final committed source blobs
- `assets/writing.js` `7f90f75ec8dbbc17ddbcd8d7276ce099f1e911a8`
- `assets/writing-lab-ui.js` `1ec0f08236c00912b3eb55936b01b40e726832bf`

## Verification executed

**Eight of eight targeted Writing Lab test suites passed** in isolated V8 with the original repository JavaScript source and Node-style bootstrapping adapted to the available tool runner

1. `tests/writing.test.js`
2. `tests/writing-content-integrity.test.js`
3. `tests/writing-guidance-ui.test.js`
4. `tests/writing-reporting-fidelity.test.js`
5. `tests/writing-reporting-ui.test.js`
6. `tests/writing-manuscript-citation-coverage.test.js`
7. `tests/writing-citation-identity.test.js`
8. `tests/writing-export-routing.test.js`

Both edited production JavaScript assets passed syntax parsing. The new citations regression verifies conservative source keys, unindexable records, grouped citations with `see` and `e.g.` prefixes, narrative two-author citations and an accented surname. The export routing regression runs controlled `onclick` handlers from the actual Writing Lab module, verifies all three generated Markdown bodies and checks a saved audit snapshot.

No claim is made that the whole repository passed a native Node CLI, that a real browser interaction or file download succeeded, or that the public deployed website matches the audited source.

## Remaining editorial and scholarly dependencies

- Automatic matching cannot confirm citation validity, direct quotations or that an included source actually supports a particular claim. Checking source content and citation placement remains necessary.
- The Writing Lab's stored draft text can be misleading if the student records the wrong study status or includes invented findings. The status labels and automated warnings are limited safeguards.
- Cross-system terminology for research status, units, results and references must still be reconciled with the Methods and Data Labs, Rescue scaffolds, curriculum and actual public website copy.
- Higher-level writing quality, including adjacent sentence connections and cumulative stylistic monotony, requires editorial reading beyond simple source-string tests.
- Real Word file generation and download, a complete native Node regression run, end-to-end browser persistence and deployed-site parity remain outstanding.

## Exact next continuation point

**Stage C-X3c12a | Cross-system research-status, unit and evidence terminology audit.** Compare source claims and help messages across `assets/curriculum.js`, `assets/student-guidance.js`, canonical `assets/rescue-model-v2.5.json`, `assets/methods.js`, `assets/analytics.js`, `assets/writing.js` and the corresponding student-facing panels. Prioritise inconsistencies that could misrepresent planned versus completed research, a saved protocol as actual implementation or research approval, student/seed rows as independent assigned units, missing-value or exclusion choices, and historical statistical results as verified findings. Preserve previously audited and verified text, implement only source-supported corrections, add narrow regressions and create a ledger. Afterward move through any remaining cross-site academic pages and the final source, native Node, browser and public-deployment QA obligations. Do not infer completed coverage from passing module tests.

**Stage status**: C-X3c11d source content and handler routing verified for the specified functions and tests. The comprehensive academic website content audit is not yet complete.
