# C-RV29dc | The restored-gallery checker now verifies the two actual, different page image sets

**Date:** 3 November 2026. **Continued from:** [C-RV29db](PUNGMUL_KCI_LINK_DESTINATION_C-RV29db_2026-11-03.md). **Scope:** An unexpected CI failure of the restored Interests/Pungmul photo-gallery proof, caused by an obsolete test fixture, after the one-link scholarly citation update to `pungmul.html`. **Outcome:** Corrected the regression-test source expectations to match the currently deployed curated photography, verified all relevant original image assets exist and are distinct between pages, and obtained **10/10 successful actual live HTTPS byte comparisons**. No photograph, crop, image order, border radius or academic prose was modified.

## The observed failure and why it was misleading

[Original gallery audit run 41655799335](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799335) was triggered by the Pungmul citation update. Its report returned `5/7` verified assets with two flagged HTML pages. The Interests source HTML byte comparison had **already matched** the public copy, but the script nevertheless marked it failed because it expected the obsolete filenames `pungmul-stage.webp`, `pungmul-group.webp`, `pungmul-solo.webp` and `pungmul-rehearsal.webp` on **both** pages, with each one referenced exactly once. Actual page-specific gallery image counts for those old file names were zero, as they should be. The Pungmul source HTML also briefly differed from public bytes while the new citation URL was deploying.

This is **a stale test expectation combined with temporary deployment lag**, not evidence that the seven current images were missing. The user-established editorial choice was to keep a **distinct** photograph set on Interests and the Pungmul detail page, and use rounded, appropriately sized presentation.

## Current source-backed image inventory

Directly fetched the current `interests.html` and `pungmul.html`, extracted all actual local `img src` values and relevant image anchors, and checked each local asset against the complete recursive repository tree. The actual two sets do not overlap:

| Page | Current intended original photographic assets |
| --- | --- |
| `interests.html` | `assets/interests-pungmul-street.webp`, `assets/interests-pungmul-dancers.webp` |
| `pungmul.html` | `assets/pungmul-rehearsal-studio.webp`, `assets/pungmul-ensemble-stage-photo.webp`, `assets/pungmul-outdoor-autumn.webp`, `assets/pungmul-portrait-janggu.webp`, `assets/pungmul-gong-jump.webp` |

**7/7 distinct intended local photos exist** in Git, all referenced by the correct page. Interests also contains unrelated off-site book and series-cover images, which are outside this dedicated Pungmul-gallery byte test and are covered only to the extent of separate external/visitor checks. The Pungmul page includes a leading rehearsal photograph and four linked gallery figures; the Interests page includes two linked photographs.

## Minimal verification-script change

Updated only `scripts/audit_live_photo_restoration.py`. It now has page-specific `GALLERIES` expectations, checks that the two sets are disjoint, compares the two actual HTML pages, `pungmul.css` and all seven source photo files to their delivered public bytes, and requires exactly one current `img src` reference to each correct local photo. The final version also detects unexpected extra local assets in the `img` source set and continues to flag editor-added image-layer marker attributes. A small follow-up edit corrected the test's raw regex boundaries so it actually recognizes HTML `img` tags.

**Script commits:** [`b5ebdc10`](https://github.com/gmoon-code/gmoon-code.github.io/commit/b5ebdc1011c63b247f8721060a986887fc6be2fc) and [`b74b62de`](https://github.com/gmoon-code/gmoon-code.github.io/commit/b74b62de3240013731bc8ed36c41387d4724b194). Exact final script blob **`b58c95c40755117c9564d1c5978307a9508fc5de`**.

## Independent actual browser/remote evidence

The amended fixture's first run, **41656259554**, finished success. The final corrected-pattern [restored gallery run 41656308850](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41656308850), at source SHA `b74b62de`, independently finished **success**, recording **`files: 10, matched: 10, failed: []`**. These ten exact public-file comparisons cover **two HTML pages, one CSS stylesheet and seven distinct photographed media files**. This confirms that the earlier Pungmul href revision had reached published HTML when this newer check ran.

The separately triggered [Pungmul visitor audit 41655799348](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799348) also finished success at the source revision that contained the corrected citation, with **no reported visitor failures**. Its responsive presentation checks remain separate evidence, not a universal certification of rounded images on every device.

## Verification boundaries and scholarly-site relevance

The corrected checker is an integrity safeguard for preserving the author's chosen distinct photo sets. It does not measure subjective photographic quality or independently authenticate the subjects, dates or photographer credits. It also does not replace page-specific Chromium screenshots, image-crop assessment or assistive-technology inspection. **No public HTML, original photographs, CSS or citation prose was edited during C-RV29dc.**

The research source register remains **46 F / 6 A / 1 M / 0 P**, and the comprehensive scholarly/website audit remains **In progress**. The original classroom-administered instruments, source student texts, signed permissions and final August scoping study coding remain independently evidence-gated.

## Exact next checkpoint

**C-RV29dd | Post-correction public academic release and evidence inventory reconciliation.** Verify the current source and public delivered `pungmul.html` against the successful 10/10 source gallery run and current fresh linkgraph/external checks. Reconcile any remaining older full-release CI failures as source-/time-specific rather than treating them as current image defects. Do not modify the already restored photos, image presentation, scholarly citations or unrelated prose unless a genuinely new verified issue appears.
