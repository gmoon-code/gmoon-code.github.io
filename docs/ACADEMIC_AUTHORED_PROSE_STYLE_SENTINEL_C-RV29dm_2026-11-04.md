# C-RV29dm | All-route static prose typography, original citation integrity and continuity limits

**Date:** 4 November 2026. **Continued from:** [C-RV29dl](LINKED_APP_ORIGINAL_RELEASE_NUMERIC_CROSSWALK_C-RV29dl_2026-11-04.md). **Scope:** Current original repository revision, 26 actual HTML routes, authored static heading/paragraph/list/caption text, the earlier request to replace an “Imagine a biology class” research opening, exact punctuation of cited source titles, and a narrow automated regression for future copy changes. **Decision:** No authored static prose em dash or reinstated “Imagine” opening was found. Two em dashes in **exact bibliographic transcriptions** are correctly preserved. No website copy change warranted.

## Current material and original coverage

At stage start, GitHub head was **`f49ed2284c83674bdfb76b06d3c16dd8658e7440`** and the main audit ledger was current through C-RV29dl. A Git compare against that checkpoint returned **zero subsequent source changes**. The non-truncated repository tree contained **26 HTML files**, including top-level academic pages and supplementary authoring/legacy routes. Earlier source/content reports document prior sentence-level examination and distinct original research provenance limits; this stage is a *new precise typography and prohibited-opening regression*, not another claim of comprehensive rereading.

Independently fetched the full current HTML for all 26 routes. Inspected the bounded static content of each `main` region, or `body` for tool/error/redirect routes without a main, extracting authored `p`, `li`, `figcaption`, `h1`–`h6` elements after excluding embedded scripts and styles. The actual check covered **895 static text segments**. The short broad result was **zero inappropriate em dashes in authored prose** and zero “Imagine” instruction at the Research page's opening.

The opening paragraph in current `research.html`, blob **`f083527f1cc0f8d60587133333b15ccc0d994237`**, instead begins **“In a biology lesson, students may examine a simplified diagram tracing human sex development...”**. This honours the previously requested academic opening. The phrase “I can imagine travelling...” in an Interests discussion of *The Hobbit* is an ordinary verb in a book reflection and is not a formulaic imagined-classroom opening or new instruction requiring deletion.

## Precisely two bibliographic exceptions, checked against original metadata

Two original-source transcriptions contain the em dash glyph as part of **published proper titles**, rather than prose composed by the site author:

1. `research.html#reading-gonsalves`. Gonsalves, A. J. (2014), **“Physics and the girly girl—there is a contradiction somewhere”**, DOI **10.1007/s11422-012-9447-6**. Original publication metadata and citing articles preserve the phrase/punctuation as an article-title quotation. [Original Springer identifier](https://doi.org/10.1007/s11422-012-9447-6); [independent journal-citation example](https://link.springer.com/article/10.1007/s11199-016-0669-z).
2. `teaching-ap-biology.html#bio-ref-shiroda`. Shiroda et al. (2024), journal **`CBE—Life Sciences Education`**, DOI **10.1187/cbe.23-08-0157**. The original scholarly publisher itself styles the journal name using the em dash. [Original publisher article](https://doi.org/10.1187/cbe.23-08-0157).

Changing either punctuation item solely to satisfy a ban on em dashes in the author's own prose would create an unnecessary error in scholarly attribution. This stage distinguishes **the user's prose rules** from **faithful transcription of other authors' publication titles**. Other colon-containing headings and bibliography titles and labelled figure-source fields were likewise not rewritten as though they were ordinary prose sentences.

## Small, reviewable source guard and actual verification

Added [`scripts/audit-academic-prose-style.py`](../scripts/audit-academic-prose-style.py), [commit **`0125935`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/0125935a7f9d5081dedfc19a6cd83817e177bb1a), and the corresponding [GitHub Actions workflow](../.github/workflows/audit-academic-prose-style.yml), [commit **`b824656`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/b82465670e62e35ef98d728dd07baf989bdc3171). The read-only guard extracts those static elements, checks for em dash punctuation, retains only the two original-source title exceptions by precise page/element and expected text, verifies that the first Research paragraph no longer opens with “Imagine,” and writes a bounded JSON report. It exits nonzero on non-exempt violations.

The actual independent [GitHub Actions run **41747254893**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41747254893) on commit `b82465670e62e35ef98d728dd07baf989bdc3171` completed **success**, job **126303269667**. The actual output reports:

`ACADEMIC_PROSE_STYLE_SUMMARY {"routes": 26, "segments": 895, "preservedSourceTitles": 2, "issues": []}`

The check is designed to rerun when HTML or its own checker source changes. It does not edit HTML, remove punctuation, apply artificial transitions, silently change direct citations or claim that a passing static predicate verifies the meaning of all adjacent sentences.

## Evidence and editorial status

**Verified within scope:** Current 26-file repository source inventory, 895 static text segments, first authored Research paragraph not beginning “Imagine,” exactly two separately supported citation-title exceptions, zero inappropriate author-prose em dash findings, and a successful original checkout-backed CI run.

**Not established by this single check:** Student-data authenticity, author credentials, signed consent/permissions, full original restricted papers, the August scoping study-level source matrix, nuanced paragraph cohesion and quality, text generated in JavaScript, actual assistive-technology/browser rendering, authenticated publishing or all external link destinations.

The full academic-content audit remains **In progress**, scholarly Research reference register **46 F / 6 A / 1 M / 0 P**. No academic HTML, research records, public text, citations, images, layout, styling or published runtime behaviour was changed.

## Exact next checkpoint

**C-RV29dn | New independent scholarly evidence or genuinely overlooked authored content, not repeat static prose scanning.** First check for source deltas since the passing 26-route check and for genuinely accessible primary research/permission/scoping evidence. If neither exists, focus on a separate material user-facing claim from *generated* explanatory content not already covered by the static HTML check, or explicitly preserve the evidence-gated status rather than manufacturing an editorial correction. Do not mistake an HTML-only exact typography guard for complete sentence-level editorial verification or invalidate authentic original publication-title punctuation. Preserve the signed historical Unit 3, source answer transformations, school/participant authorization, independent reading records, final August S2B/S2C and author-selected public contact address as **Blocked** until actual original evidence becomes available.
