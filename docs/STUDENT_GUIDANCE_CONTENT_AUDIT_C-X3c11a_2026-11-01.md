# Stage C-X3c11a | Writing Lab citations, source identity, draft guidance and author voice

Date 1 November 2026. Continued directly from [C-X3c10f](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c10f_2026-11-01.md). Examined `assets/writing.js` citation detection, source keys, introduction and results blueprints, section and whole-paper audits, title/causal wording checks, and discussion guidance. Examined the corresponding visible introduction, literature, method, results, citation, discussion and whole-paper guidance in `assets/writing-lab-ui.js`. Compared them against previously audited Writing Lab help and the established author style, especially diverse meaningful transitions, natural paragraph development, evidence fidelity, cautious claims, Canadian English and no unsupported generalisation. **Source-level editorial work and targeted test execution completed; real browser and deployed site not verified.**

## Problems identified and corrected

| Content / pathway | Verified risk or editorial defect | Correction |
|---|---|---|
| Grouped author–year citations | The previous detector recognised individual citations but missed grouped records such as `(Smith, 2024; Lee, 2023)`. Lack of detection could make a legitimate introduction appear uncited | It now parses semicolon-separated citations in one parenthesis and simple narrative citations separately. The checker still explicitly states that it is not a complete APA/style parser |
| Ambiguous bibliography identity | The old citation map silently overwrote a source when two records had the same surname/year, presenting one as a unique matching record | The citation audit now retains all candidate records. A duplicated key is marked ambiguous, with its candidate count, and requires publication-level verification. Unmatched records remain separate |
| Screening status versus claim support | A matching source record could be interpreted as approval of the cited finding and could include Pending/Excluded sources without any qualification | A unique bibliography match exposes the recorded screening status. Pending or excluded sources prompt review of their appropriate use, without falsely declaring that they cannot ever be cited as background. Neither matching nor Included status independently confirms that a given claim is supported |
| Writing Lab citation UI | The table said only “Matched” or “No match”, obscuring ambiguity, status and the limits of author–year identifiers | Labels now say “Unique bibliography matches” and “Unmatched or ambiguous”; the table exposes source status and the interface explains that the nearby claim still requires source verification |
| Writing Lab introductory structure | “Introduction funnel” and a fixed “Paragraph 1/2…” sequence implied mandatory identical paragraph jobs and transitions | The interface now presents an introduction **evidence plan** with possible rhetorical focuses and flexible paragraph boundaries. Linked IDs are explicitly for verification |
| Literature-construction instructions | Every paragraph was instructed to compare multiple sources regardless of the kind of evidence being examined | The revised instructions allow substantive comparison where justified and close treatment of a single source where warranted; the sequence of ideas should follow evidence rather than a template |
| Primary-analysis label | `resultsBlueprint` labelled the **last stored** analysis as `primary`, although the time of storage says nothing about prespecification | The property is renamed `latest`. The Results guidance explicitly distinguishes latest, planned and independently verified evidence |
| Protocol fidelity | The Method panel referred to the “Latest locked protocol” and could suggest that saved plans establish actual procedure or research approval | It now calls the file the most recently saved version and asks students to compare it with what was actually done and any deviations. A saved protocol does not grant study approval |
| Causal-word detector | Simple changes described by “increased” or “decreased” could be automatically flagged as causal claims even in descriptive Results | The detector now targets a narrower set of causative expressions. It is a heuristic, not a substantive determination of causal identification |
| Fixed rhetorical counts | The Discussion checklist required 2–3 anchor findings and at least two limitations, while the Introduction and Literature panels prescribed rigid progression | The requirements now focus on evidence-relevant findings, meaningful limitations, claim boundaries and appropriate comparison, without numeric quotas |
| Arbitrary section-length warning | Every draft shorter than 40 words was flagged with the same warning, regardless of whether the section was a brief conclusion or a substantial literature synthesis | Brief nonempty drafts receive a low-severity prompt for an actual content check. Length alone is not represented as evidence of quality |
| Apparent paper-alignment score | A heuristic issue score could be labelled “Strong alignment”, overclaiming the ability of string checks to evaluate a whole paper | Labels now identify the quantity of **automated concerns**, with an explicit UI statement that claims, original sources and natural argument quality still require human examination |
| Citation and section checks | An ambiguous source match or Pending/Excluded citation was not raised during an individual section audit | Introduction, Literature Review and Discussion audits now surface ambiguity and status questions, rather than relegating those issues only to the whole-paper review |

## Important correction during implementation

An initial source-reading diagnosis mistakenly claimed that the whole-paper audit referenced the wrong Results and Discussion fields. Its local `w` variable already referred directly to `p.writing.sections`, so the original `w.results` and `w.discussion` accessors were correct. The attempted change to `w.sections.results` and `w.sections.discussion` caused the existing tests to fail. **Both mistaken changes were restored immediately, committed and retested successfully.** No false fix to these correctly functioning fields remains in the audited source. This reinforces that source-level decisions require executed regressions.

## Commits

Production:
- [Citation clusters, ambiguous-source handling and careful audit labels](https://github.com/gmoon-code/research-methods/commit/1f358107b6d4d6f810036ce80ea452ead0cf1319)
- [Evidence-based writing prompts and narrowed rhetorical heuristics](https://github.com/gmoon-code/research-methods/commit/784e0ce87afe71ebf1d2092097449b3d5de24fef)
- [Restore the original correct whole-paper draft accessors](https://github.com/gmoon-code/research-methods/commit/a5655d9be026b39fc222f7a675878fc3cecd27a7)
- [Rendered Writing Lab labels, citation status and flexible intro guidance](https://github.com/gmoon-code/research-methods/commit/3ff5b89f19b35d87f5ed80ff27489b987a84262e)

Tests:
- [New grouped-citation, ambiguity and draft-language regression test](https://github.com/gmoon-code/research-methods/commit/7594db43753991934103bb6209fc66cc6797eec5)
- [New rendered Writing Lab guidance test](https://github.com/gmoon-code/research-methods/commit/7342e58b585352d67b6e248b3a0d38302cd8a892)

Verified final source blobs:
- `assets/writing.js` `64499028b7ce802bf39c4f4a98cfc41bf71bd00e`
- `assets/writing-lab-ui.js` `4bccc63e251eee0312dc830f18fc10720aec6e8e`

## Verification performed

**Three targeted Writing Lab suites passed** against the committed sources in the isolated V8 environment with the Node `require`/`global.window` and filesystem bootstrap adapted:

1. `tests/writing.test.js`
2. `tests/writing-content-integrity.test.js`
3. `tests/writing-guidance-ui.test.js`

Assertions cover semicolon-grouped and narrative citations, exact author-year source identifiers, duplicate bibliographic candidates, Pending/Excluded source statuses, the absence of an invented `primary` designation, a correctly present Results and Discussion draft, reduced false-positive causal flags, nonmandatory section length, actual rendered citation labels and introductory source guidance. Both production JavaScript files passed syntax parsing. The original whole-paper accessor was restored after a failing regression and both source and new tests were rerun.

These are **source/test results, not real browser usage or published-site verification**. Citation matching remains incomplete for some styles, unusual surnames, complex multiparenthetical references and references lacking structured author/year metadata. Author-year identity alone cannot establish publication identity or validity of the claim.

## Outstanding substantive content

The remaining Writing Lab content requires further scrutiny before a website-wide completion claim. In particular
- Results and abstract checks assume that every project has completed analysis outputs, even when the student is drafting a proposal, qualitative study or review.
- Results notes exported by the Writing Lab need to carry historical analysis qualifiers and missing-data provenance from the Data Lab rather than displaying unqualified summaries.
- Paper-level citations and reference verification remain manual. The export does not generate full bibliographic references from unchecked records.
- The Method, Results, Discussion, Abstract and paper-export guidance still needs detailed checking for proposed versus observed status, research design and disciplinary variations.
- Sentence-by-sentence cohesion, source-content verification and original-paper comparison cannot be guaranteed by the heuristic Writing Lab checks.
- Native Node CLI, full real-browser input/persistence tests and deployed public-site parity remain unverified and are mandatory closing stages.

## Exact next continuation point

**Stage C-X3c11b | Writing Lab Method, Results, Discussion, Abstract and export fidelity.** First review `resultsBlueprint`, `resultsNotesMarkdown`, `methodBlueprint`, `methodOutlineMarkdown`, `paperMarkdown`, the writing-section audit heuristics and their UI displays. Keep proposals distinct from completed work, preserve source-verified results and exceptions, and make historical versus current statistical provenance explicit. Check the manuscript/reference export and avoid invented citations or claims. Implement justified corrections, run tests, and save a new ledger before expanding to cross-system and full-site writing consistency.

**Stage status**: C-X3c11a is complete for citation detection, provenance status and the initial writing-interface language. The comprehensive website content audit is still in progress.
