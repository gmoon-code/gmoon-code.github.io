# C-RV29eg | Website Studio shared theme scope and layout-effect wording

**Date:** 4 November 2026. **Prior:** [C-RV29ef](STUDIO_CLEAN_DRAFT_STATUS_PUBLIC_PARITY_C-RV29ef_2026-11-04.md). **Scope:** Complete the remaining specifically identified Website Studio author-facing claim check by comparing the current `studio/index.html` Site style dialog and `studio/studio-plus.js` generated feedback with the actual shared CSS generator and a representative independently styled supplementary route. **Result:** Two factual copy corrections in supplementary authoring files, source regression with an explicit new test, and public HTTPS delivery verified at the tested source revision. **Academic page prose:** unchanged.

## Audit baseline and prior-review boundary

At the start of this stage, GitHub `main` was `18ff307a81775ab7b9a279ae525c86d2f3c8a170`. A complete nontruncated recursive tree contained **26 HTML files**. The 19 ordinary/legacy pages retain documented completed editorial source review in [C-RV29ed](ACADEMIC_PUBLIC_CONTENT_COVERAGE_CLOSEOUT_C-RV29ed_2026-11-04.md). The remaining seven supplementary routes have particular C-CS, C-ED and C-RV26/C-RV28/C-RV29 review boundaries; no route was overlooked, but this is not a claim of universal live/browser verification.

Read the loaded Website Studio modules `studio.js`, `studio-plus.js`, `studio-details.js`, `studio-resize.js`, `studio-move.js`, `studio-tables.js`, `studio-canvas.js`, `studio-chrome.js`, `studio-layers.js`, `studio-components.js`, `studio-free.js`, `studio-access.js` and their HTML page, then compared relevant visible help/status strings with the prior source reviews [C-RV26d](STUDIO_MODULE_CONTENT_SCOPE_AUDIT_C-RV26d_2026-11-02.md), [C-RV26e](STUDIO_COMPONENT_GUIDANCE_AUDIT_C-RV26e_2026-11-02.md), [C-RV28y](STUDIO_ACCESS_PERMISSION_HELP_AUDIT_C-RV28y_2026-11-02.md), [C-RV28z](STUDIO_BROWSER_RECOVERY_STATUS_CONTENT_AUDIT_C-RV28z_2026-11-02.md), [C-RV29dn](STUDIO_SHARED_FOOTER_TAILORED_COPY_WARNING_C-RV29dn_2026-11-04.md) and [C-RV29ef](STUDIO_CLEAN_DRAFT_STATUS_PUBLIC_PARITY_C-RV29ef_2026-11-04.md). The previous corrections to navigation reach, saved-draft truthfulness, permission probes and tailored Contact/CV footer overwrite warnings remain supported and unchanged.

## Two substantive inaccuracies found

**1. Static Site style dialog.** Before the correction, the dialog claimed:

> Change the look of the whole website in one place. Your words and layout stay as they are.

This is broader than the actual model. `applySiteLook()` writes changed `studio/site-settings.json` and `site-theme.css` drafts. `themeCSS()` modifies **`--page-max`**, **`--editorial-measure`**, font families, base font size, headings, line-height, other visual properties and the page background. Width and text-size changes can alter placement and wrapping; claiming that the “layout” remains the same is inaccurate. Moreover, source HTML such as ordinary `index.html`, `contact.html`, `cv.html`, `teaching-osmosis-practice.html`, `pungmul.html` and `writing-biological-classification.html` explicitly load `site-theme.css`, while `connection-studio/index.html` instead loads `./style.css` and `studio/index.html` loads `studio.css`. Thus the shared theme **does not affect literally every HTML route**.

Corrected the dialogue text to:

> Change the shared appearance of pages that use this site theme. The page content stays intact, although text size, widths and spacing can change.

This is clearer about reach and preserves the distinction between unchanged authored content and possible visual-layout changes.

**2. Generated apply-status toast.** The earlier `studio/studio-plus.js` toast promised:

> Site-wide style updated in your draft. Publish to apply it to every page.

The status follows the same `site-theme.css` draft path, so it cannot guarantee changes to supplementary pages not using that stylesheet. Replaced with:

> Shared site style updated in your draft. Publish to apply it to pages that use this theme.

The page-manifest and shared navigation/header/footer scopes, which operate through *different* code paths, were left untouched. Neither wording revision alters which CSS file is published or how the GitHub commit is assembled.

## Source commits, regression and public source delivery

- [`studio/index.html` commit **ab010774**](https://github.com/gmoon-code/gmoon-code.github.io/commit/ab010774ee29753df511f56244c5ed03bf9b4602), one static help-expression correction, original file returned by exact GitHub readback.
- [`studio/studio-plus.js` commit **ccb97e8b**](https://github.com/gmoon-code/gmoon-code.github.io/commit/ccb97e8b0bb2e22748032830e17b615d6d4d8f7a), one dynamic toast correction, exact readback.
- [`tests/studio-author-content.test.mjs` commit **9671185c**](https://github.com/gmoon-code/gmoon-code.github.io/commit/9671185cd2ac3265e25a85788ac706350f65514a) adds an original source-level test checking both new messages, the source's `site-theme.css` draft, its width properties, the Home theme link and independent Connection Studio stylesheet. Exact readback.
- [`.github/workflows/studio-author-content.yml` commit **312f7e92**](https://github.com/gmoon-code/gmoon-code.github.io/commit/312f7e9279a87b9878a5ed9899315b70160ec7b0) now reruns the existing Node regression when `studio/studio-plus.js` changes. Source-matched [run **41781877109**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41781877109) completed **success**, including the new test.
- [`scripts/audit-studio-guidance-public-parity.py` commit **1353964e**](https://github.com/gmoon-code/gmoon-code.github.io/commit/1353964ecebfffe32a61c6c50f4a4b7b9d4c4c74) expanded the public exact-byte check to four specific resources, `studio/index.html`, `studio/studio.js`, `studio/studio-plus.js`, and `studio/studio-chrome.js`.
- [`.github/workflows/studio-guidance-public-parity.yml` commit **f76f2852**](https://github.com/gmoon-code/gmoon-code.github.io/commit/f76f2852d88722b887169a51680d3400aaecbfc5) adds the Plus module to the workflow's path trigger. The source-matched [public-delivery check **41781930513**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41781930513) completed **success**, requiring **4/4 exact original-versus-delivered HTTP source bytes** at its checked source revision.

These tests establish the amended words, their connection to existing source CSS, and static public delivery at the test time. They are **not evidence** of actual authenticated owner publication, physical-device layout quality, every screen-reader experience or the appearance of every configured style on every website route.

## Editorial closeout and remaining boundaries

The source-reviewed Website Studio owner help now accurately distinguishes its session-local draft status, browser-recovery conditions, GitHub authorization checks, Studio-listed menu/header/footer reach, loss of tailored Contact/CV footer copy in a shared-footer publication, and the subset of pages affected by `site-theme.css`. **No further known unsupported wording statement in these reviewed areas requires a new source change.** This closes the **currently identified Website Studio supplementary-copy issues at the tested source tier**, without claiming that all possible JavaScript state branches or authenticated site operations have been exercised.

The historical editorial coverage of the 19 main academic and legacy pages remains intact. The author's supplied final action-research and scoping manuscripts remain **sufficient sources for the website's descriptions**, with no requests for background student or ethics records. Separately, the site's 53 Research references remain **46 F / 6 A / 1 M / 0 P**; seven original external texts are not fully accessible. This limitation does not justify rewriting the already well-qualified academic paragraphs.

**Next checkpoint C-RV29eh | Residual source-access and publication verification disposition.** Check actual repository/source change before resuming, then either address a genuinely new academic content discrepancy or reconcile the remaining third-party limited-original tiers and production authenticated/physical-device test boundaries. Do not repeat completed per-page or supplementary-copy work as a substitute for new evidence. If no such source is available, explicitly close **available current-source editorial writing coverage** and report the remaining verification limits without manufacturing revisions. Overall audit is still **In progress** at the broader scholarly and functional verification tier.
