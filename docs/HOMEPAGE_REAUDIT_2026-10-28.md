# Fresh website re-audit, starting at Home

Date: 28 October 2026. Scope: reader-facing academic site. This checkpoint supplements, and does not replace, `docs/EDITORIAL_PAGE_AUDIT.md`. Prior findings remain historical evidence only until checked against current code and live rendering.

## Audit status definitions

- **Not reviewed**: no new-stage inspection.
- **In progress**: actively being checked.
- **Reviewed with issues**: inspected, with an identified defect or pending verification.
- **Corrected but unverified**: changed but not yet rechecked at the required level.
- **Source verified**: correctness established from current repository source, not runtime.
- **Verified**: the specific claimed behaviour was directly tested, with a clearly stated scope.
- **Blocked**: unavailable environment or evidence prevents a required check.

## Public-route inventory and re-audit queue

Fifteen canonical public routes appear in the current `sitemap.xml`: `/` (`index.html`), `contact.html`, `cv.html`, `interests.html`, `projects.html`, `research-action.html`, `research-methods-studio.html`, `research-scoping.html`, `research.html`, `story-method.html`, `teaching-ap-biology.html`, `teaching-ap-chemistry.html`, `teaching-ap-evolution.html`, `teaching.html`, and `writing-biological-classification.html`.

Also listed by the existing project register, and not silently excluded because absent from the sitemap: `teaching-osmosis-practice.html`, `pungmul.html`, `about.html`, `404.html`, `editor-v2.html`, `editor.html`, `editors.html`, and `fluid-layout-lab.html`. Public site content takes priority; editorial review of the editors' controls is secondary to their effects on the visitor-facing site. The linked Story Method and Research Methods Studio applications require separate dependency checks.

Re-audit status: `index.html` **In progress**. All other routes **Not reviewed in this new pass**, despite historical checks in the main register. Navigation/shared components receive an independent global pass.

## Stage H1. Homepage source, wording, metadata, and internal links

**Starting source:** `index.html` blob `3ee3149606bba27c1afd0798e41d6511245408de`; `docs/EDITORIAL_PAGE_AUDIT.md` consulted, blob `2b97040eacb190af085615cf3b4995ad922440d5`.

**Inspected:** metadata, main navigation and footer, hero introductory prose and CTAs, Research and teaching cards, `From the research records` passage and S20 aside, Learning tools cards, Outside school content, heading hierarchy, local links and fragments, photo alternative text and source image representation. Also read `moon-free-responsive.js` to establish runtime reflow intent and its breakpoint. Checked current `sitemap.xml`, `robots.txt`, and the `404.html` source.

**Source-verified findings:**
- One H1 and hierarchical H2/H3/H4 levels. All listed homepage anchors and destination IDs are present in current repository sources. All ten distinct internally linked HTML destination files exist. The header, footer and skip link have usable semantic labels in markup.
- The homepage preserves the distinction between observed action research, an initial scoping-review corpus of 20 studies, existing teaching, proposed curriculum sequences, and the learning tools. The S20 comparison is consistent with the de-identified example described in `research-action.html`. These are **cross-page source checks**, not an independent verification of student data or scoping-review ledger.
- The original homepage meta description led with anti-racist, anti-colonial, and queer-inclusive interests while not clearly describing the teaching and classroom research visitors actually encounter first. Corrected the description to: `Ye Eun Moon teaches secondary biology and chemistry in South Korea. Her work considers student explanations, multilingual learning, and justice-oriented science education.`
- Production commit `3b6ccf694339c5593c4ddab598e6727de411f991` changed **only that exact description string**. Re-fetch proved all other HTML bytes unchanged; new `index.html` blob `717ad125d49a617bb3285fd17f60e014f7f3d4c4`. This is **source verified**, not yet a live SEO crawl.
- Combined GitHub commit status reported success for `academic-editor/browser-resize`, but that alone is **not** evidence of a visual inspection or live deployment acceptance.

**Issues and incomplete checks:**
- **Medium, accessibility, desktop source order.** At widths above 1140px, the hero introduction resides in a positioned `.moon-free-layer` following the hero section in the DOM, so its paragraph comes after the research/explore links in unmodified source reading order. The shared responsive script moves the paragraph before the links on smaller screens. A desktop source-order fix must preserve the absolute-positioned visual layout and both 1140/1141px breakpoint cases. Not edited without fresh visual/browser regression tests.
- **Medium, maintainability/performance risk.** Homepage HTML is approximately 411KB and contains four base64 image references plus multiple injected style blocks. Two photographs have both data-URI `src` and desktop background-image representations for the special cropping technique. Evaluate resource transfer and LCP; preserve image framing and editing metadata until a tested simplification is available. This is a risk, **not** a measured performance failure.
- **Low, metadata.** Canonical `/`, title, language, viewport, and description exist. Social-preview metadata, robots behaviour, external link response and actual search-result appearance have not been tested.
- **Verification blocked in this execution:** direct public-site fetch and browser screenshots were unavailable. Prior GitHub Actions captures are historical and cannot substitute for a fresh visual examination. No new claims of dark-mode, mobile browser, keyboard, print, screen-reader, or physical-device verification.
- **Other pending:** exact visual spacing and photo cropping at 320/375/701/768/1025/1140/1141/1440px; dark appearance; 404 from nested routes; focus order, operative navigation links, real ORCID and mailto interaction; full-page screenshot; image decoded paint bounds. Existing older GitHub Actions results in the main register may help but must be attached to precise revisions.

**Content judgment at this stage:** Introductory narrative is concrete, restrained and suitable for its purpose. Research, teaching, learning-tools and outside-school sections have distinct functions. No substantive prose rewrite was justified merely to reduce length or repeat key scientific terms. Further visual review could expose spacing or hierarchy issues that source inspection cannot.

**Continuation point:** Homepage stage H2. First establish a browser-rendered desktop and phone baseline against the current commit; then implement and regress-test the desktop introduction source-order fix. Complete hero image/text/CTA pixel-level geometry and keyboard reading order, then inspect `Research and teaching` cards and `From the research records` as their own visual/content stage. Maintain stage-by-stage logs and do not mark the homepage fully verified until every outstanding mode has been examined.

## Stage H2. Introduction and portrait, responsive baseline and source-order repair

**Current visual evidence:** Downloaded archive `12792944468` from prior passing Chromium run `40635895128`, with full-page and 900px viewport screenshots at 375/701/768/1024/1025/1100/1140/1141/1440px and a JSON geometry report. Screenshot evidence reflects earlier visual code; Stage H1's only interim `index.html` modification was meta-description text. These are **historical visual-baseline captures**, not proof of the new structural revision.

**Baseline observation:** At 375/701/1025px the introduction flows before its links, followed by a bounded portrait, without visible text/photo overlap in the inspected captures. At 1440px the hero shows a large gap between its prose and CTAs, while the portrait continues lower in the opposite column. The baseline DOM report shows at 1440px: intro bounds x160–811, y259–621; CTA bounds y612–650; portrait x843–1249, y209–608; next section y715. The empty part of the intro's 362px reserved footprint contributes to the perceived gap. Treat the spacing as a design concern to weigh against deliberate portrait/button alignment, not as an automatically justified adjustment.

**Confirmed desktop source-order defect:** In original source, the hero controls preceded the sole introductory paragraph within the DOM. A width-dependent script repositioned the paragraph inside the hero only at <=1140px. Desktop keyboard/link order therefore moved to CTAs before the paragraph; an unfavourable assistive reading order can result.

**Targeted production changes, pending fresh browser visual verification:**
- Commit `6a1a25b6524b0197d5f37c8d41444085735a5eb3` relocated the *same single* intro paragraph into the `.hero-copy` before the CTAs and inserted a desktop CSS rule to retain its original absolute coordinates and typographic overrides. The positioning layer remains for any other free-positioned elements.
- Commit `1f07764174c71e6cffcbd75ec36eea12aaeb6713` changed only the runtime reflow handling to preserve this semantic source order at desktop visitor widths, while allowing the existing mobile repositioning and editor-mode source behaviour.
- Commit `b1cf47ddbf9e2aac0425bf271a11e1657ee6f650` strengthened `scripts/audit-home-route.py` to assert that the intro precedes its controls in actual Chromium DOM order at all 12 tested widths.
- Commit `b4b98b0f54bf78dc27482b3dbf80a18a14c41f24` arranged for the existing screenshot artifact to include the exact inspected public HTML/CSS/JS, enabling reproducible local Chromium analysis without reliance on old screenshots.

**Source verification:** Each write was followed by a GitHub re-fetch confirming exact intended text. There remains exactly one introduction paragraph in `index.html`, with its node now before the `.controls` in source. CSS/layout runtime, photo bounding boxes, precise painted-image edges, mobile and desktop screenshot equivalence, and actual keyboard navigation after the change are **not yet verified**. The current source alteration must remain **Corrected but unverified** until the updated Chromium workflow completes and the resulting screenshots/report have been inspected.

**Exact next action:** Recover the latest passing `Focused Home and nested 404 browser audit` run for commit at or beyond `b4b98b0`; inspect its 12-width JSON bounds and 375/701/1025/1140/1141/1440 screenshots for shifted text, duplicate intro, portrait overlap and section transitions. If there is a regression, repair immediately and repeat. Once layout is stable, test desktop keyboard/assistive reading order, then assess whether the reserved desktop blank space should be reduced. Continue next through Research and teaching and the Research spotlight. Do not claim final approval of the hero until runtime evidence exists.

**Additional QA instrumentation:** The focused browser script now saves viewport and full-page images at all twelve tested widths (320/375/700/701/768/1024/1025/1100/1140/1141/1200/1440) in commit `2c1aad21be8a7dd5bce6951af44bbdab8ed483e7`. Workflow commit `49c321b79b33b5d5fa911bce89b1e789fa3420c0` posts an explicit commit status and run link after its Chromium test, so later inspection can locate the correct screenshot ZIP. Neither instrumentation commit itself is a passing browser test. As of this checkpoint, the new commit status was not yet returned by the available GitHub status endpoint; do not infer a pass or a failure.
