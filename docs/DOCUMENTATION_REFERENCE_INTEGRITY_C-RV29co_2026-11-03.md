# C-RV29co | Archive-wide audit-documentation link and HTML fragment integrity

**Date:** 3 November 2026. **Continued from:** [C-RV29cn](PUBLIC_CV_OSMOSIS_PRINT_C-RV29cn_2026-11-03.md). **Outcome:** All parsed local references across the complete current documentation archive resolve to existing files. Additional direct links from reports into site HTML point to existing explicit `id` attributes. No current-site HTML, CSS, JavaScript, scientific statement or bibliography status was changed.

## Selection rationale

C-RV29cn closed print-output verification. The C-RV29co source-delta check found **no changed, added or removed deployed site assets** relative to the successful 26-route Chromium source baseline `c4e9044a618d284b39a8ae18291c0a66d833dac4`. The remaining original student submission, historical authorization and final August S2B/S2C sources were not newly available. Repeating already checked academic prose or inaccessible original texts would not improve factual confidence.

One independently checkable risk remained in the *audit evidence itself*. The growing report archive uses many relative citations, including links intended to open exactly the page passage previously reviewed. An archive report can be methodologically sound but difficult to verify if its cited local report or site fragment no longer exists.

## Actual verification

Created the read-only `scripts/audit-documentation-local-links.py` and `.github/workflows/audit-documentation-local-links.yml` on the academic website repository. The workflow runs on changes to `docs/**`, `README.md`, the guard or its workflow, and can also be dispatched manually. It checks all repository-local Markdown link destinations against the checked Git tree as real files. It excludes fenced code examples and external URLs.

A second refinement explicitly checked in-page fragment references to **HTML source files**. It decodes fragment paths, loads the referenced HTML and compares each fragment with actual explicit `id` values. It does **not** assume that a matching filename establishes a functioning in-page reference.

- Complete current documentation set **279 `docs/*.md` files and root `README.md`, 280 total**
- **862** parsed repository-local link destinations checked
- **106** links containing explicitly verified HTML `id` fragment targets
- **Zero** missing local destination files
- **Zero** missing explicit HTML fragment IDs in the checked set

The first successful source-file-only run was [41637975804](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41637975804), reporting **280 documents, 862 references, zero missing**.

The more comprehensive independent [GitHub Actions run 41638233477](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41638233477), tested head `2c00a8ccca34a7ecb3a1322ac3b7f9d8b81243b3`, job `125924768385`, successfully repeated the **280/862/0** checks, and its retained machine-readable [artifact 13230604397](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41638233477/artifacts/13230604397) explicitly reports `htmlFragmentsChecked: 106`, `unresolved: 0`.

## Method limits

These results prove local destination file presence and explicit HTML ID presence for **parsed Markdown link expressions**. They do **not** verify the truth of a scholarly quotation, the existence or completeness of a signed student consent record, the correctness of a study's statistics, external URL reachability, dynamically generated DOM targets, PDF-internal references, Markdown *heading* fragments or the complete functionality of every link in an interactive browser.

The guard's initial Markdown parser supports direct Markdown links and reference definitions, including one nested pair of parentheses. It does not claim to parse arbitrary Markdown syntax, HTML `href` attributes embedded in documentation or all possible link conventions. These bounds matter when interpreting a **zero missing** outcome.

The source-register's current **46 F / 6 A / 1 M / 0 P** evidence levels remain separate from this documentation-link result. Historic methodological reports remain immutable dated checks.

## Editorial decision

**No published academic site change was warranted.** The only repository code additions were a small non-production evidence-link audit script, its GitHub Actions workflow and this report. The archived documents had no broken parsed local links or HTML IDs requiring correction.

## Exact next checkpoint

**C-RV29cp | Evidence-triggered verification of substantive changes.** Reconcile the latest public-page and original research-file status before touching authored prose. If public academic content has changed since the recorded hashes, review the changed sentences and citations. If primary classroom submissions, dated transcript transformation history, executed historical permissions, independent coder records or final August study-by-study S2B/S2C records become available, inspect the actual source and correct only supported inaccuracies. Optionally extend this specific report-link guard to GitHub-flavoured Markdown heading fragments if a concrete destination warrants it. Do not mistake a further documentation check for authentication of underlying original empirical records.
