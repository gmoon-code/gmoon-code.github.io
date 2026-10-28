# Website editorial and visual audit

Updated 28 October 2026. This is an internal progress register for the academic website, not a published portfolio page.

## Audit standard

Review **every** public page and supporting interactive page. Examine substantive claims against primary sources or the underlying research record, scientific explanations and arithmetic, authorship and image licences, chronology, differences between observed and proposed activities, repetition across and within pages, sentence-level transitions, Canadian English and the author's writing preferences, navigation, semantic HTML and accessibility, spacing and typography, print layouts, and responsive behaviour.

A content pass is **not** equivalent to final visual approval. Automated browser checks do not substitute for manual review of screenshots, keyboard navigation, and page flow. Do not arbitrarily shorten paragraphs. Retain a paragraph when its reasoning requires that length.

## Page-by-page register

| Page | Editorial status | Remaining verification |
| --- | --- | --- |
| `index.html` | Phone overlap fixed by source-node mobile flow `ca7bea1`, `cc65b78`; retrieved 320px screenshot verifies unobscured heading/text/portrait and desktop screenshot is pixel-identical to the prior version; lower image and content gutters refined `53f8862` | Recheck latest mobile screenshot after gutter adjustment and run collision regression |
| `research.html` | Previous editorial passes; nested section structure repaired `4c5f652`; phone horizontal reading inset corrected `647d657` after screenshot review | Verify revised phone screenshots and check desktop unaffected |
| `research-action.html` | Crosschecked against original manuscript and the teaching case; malformed table and duplicated figure fixed, commit `6467157` | Final rendered desktop/mobile and diagram flow review |
| `research-scoping.html` | Checked against source manuscripts, selection ledger and Pierson/Kane publications; evidence and layout revisions `880c3f5`, `b267a1b` | Confirm deployment, inspect at desktop/phone, verify OSF DOI availability |
| `projects.html` | Content and published-application screenshots checked at desktop/tablet/phone; verified 10px caption gap after `ec63c794` and no image overflow | Final editorial sign-off and linked-app behaviour |
| `teaching.html` | Completed content audit; new phone gutter adjustment via shared CSS `3d06822` after screenshot review | Recheck small-screen screenshots and final source consistency |
| `teaching-ap-chemistry.html` | Content/calculations audited; shared mobile text inset `3d06822` | Recheck equations, figure and tables at phone widths |
| `teaching-ap-biology.html` | Science/evidence audit completed; title and body were flush to phone border, horizontal gutter added in `3d06822` | Recheck full page, visual figure flow and mobile screenshot |
| `teaching-ap-evolution.html` | Scientific and quantitative review completed; shared mobile text inset `3d06822` | Recheck figures, tables and paragraphs in fresh screenshots |
| `teaching-osmosis-practice.html` | Worksheet scientific and print-stylesheet pass completed, commit `d04f88c` | Printed-page preview and small-screen review |
| `story-method.html` | Content/source pass `a1b5086`; application screenshot and live-preview open/close audited at three viewport widths; figure caption spacing repaired `ec63c794` | Full downstream application UX and complete page typography review |
| `research-methods-studio.html` | Synthetic CSV and JSON audited `2865b41`; example figure and live-preview controls checked at three widths; figure caption spacing repaired `ec63c794` | Test full application export/backup/chat boundaries and remaining long-page reading flow |
| `writing-biological-classification.html` | Independently reviewed XYY systematic-review conclusion; improved evidence and classroom authority argument, commit `cc9460d` | Final independent visual inspection and cross-page prose repetition review |
| `interests.html` | Previous editorial/image checks; mobile screenshot exposed pungmul photographs overlapping prose. Repositioned original image nodes into in-flow mobile gallery `eff3d04` | Check new phone screenshots for no overlaps and preserve desktop composition |
| `pungmul.html` | UNESCO, National Folk Museum and Park source claims rechecked on 28 October; revised introductory voice, performance description, instrument-section heading and explanation, 1978 samulnori detail, and wording of Park's criticism in `389b571`; image data preserved | Review current desktop and mobile screenshots after prose changes, especially fixed-height desktop sections; one photograph may retain screenshot-viewer chrome and needs comparison with an original file |
| `contact.html` | Reviewed contact invitation and short personal introduction; removed duplicate footer invitation and clarified nationality-neutral metadata in `3546e50`; email links and embedded photo preserved | Verify live email targets and photo placement on desktop, tablet and phone; independent rendered-page sign-off |
| `cv.html` | Coursework/degree timeline reconciled `63f1c32`; A4 print rendered and visually reviewed in two pages with a continuation heading `91476c55`, `2b5d56a8`; no clipped text or orphan headings | Formal award confirmation when available; final independent phone layout check |
| `about.html` | Reviewed meta-refresh legacy route to Contact; no content change warranted | Check redirect in rendered browser |
| `404.html` | Copy, semantic markup and links reviewed; no content change warranted | Browser routing and small-screen check |
| `editor-v2.html` | Separate product QA in progress across prior conversations | PowerPoint-style editing interactions, resize/crop, geometry, publishing, keyboard/mobile |
| `editor.html` | Pending legacy editor review | Navigation, status and compatibility |
| `editors.html` | Corrected primary academic editor destination to Editor V2 and publication description `d61206b` | Check links and live authentication workflow |
| `fluid-layout-lab.html` | Pending technical QA | Responsive layout, controls and editor behaviour |

## Evidence of checks and limitations

- The action-research page reports a 28-student class and ten selected original/reconstruction pairs. Keep these numbers and their interpretation aligned with the Teaching pages. Do not equate response differences with causal evidence of learning.
- The 2005 Williams and colleagues cohort reports approximately 50%, 75% and 90% protective estimates against different malaria outcomes; it does not give the hypothetical fitness values used in the teaching model.
- The illustrative HbS selection model is internally consistent, with a weighted contribution of 0.776, next-generation HbS allele frequency approximately 0.2165, and Hardy–Weinberg zygote frequencies approximately 0.6139, 0.3392 and 0.0469.
- The osmosis illustrative percentage changes are +8%, −4%, and −13%. It cannot locate an exact isotonic concentration from the stated three samples.
- A source-level image-alt triage scanned all 23 root HTML pages. Filename-like alt text was replaced on Home (2 images), Interests, Pungmul and Contact; image bytes and geometry were preserved. An empty alt in `fluid-layout-lab.html` was found in a JavaScript template string, so it needs runtime rather than regex assessment.
- Source-level HTML checks and GitHub Actions accessibility/external-resource audits have passed for earlier revision commits. Some screenshot and artifact-upload jobs have failed at the publishing-artifact stage even when their browser checks succeeded. Inspect each job before treating a workflow failure as a content failure.
- An academic-editor resize regression currently fails because the test waits for a `profile-portrait` image filename removed from the Homepage markup when its images were embedded through the visual editor. Its failure occurs before image resizing is tested, so it cannot establish whether resizing works. The test and editor must be examined separately.
- Editor V2's image-library accessible names were revised in commit `b2bc88c` after a reported `label-content-name-mismatch` on two buttons. The regression run still requires confirmation.
- A fresh structural count across all 23 HTML source pages detected two missing `</section>` elements in `research.html`, corrected in commit `4c5f652`. All checked ordinary pages now have balanced section, division, figure, list, and table tags. This is source-level evidence, not visual verification.
- The root HTML source scan found no unresolved in-page fragment IDs or remaining filename-style photo descriptions in ordinary markup. Generated content needs runtime inspection.
- Comparison of paragraph text on eleven key pages found only one repeated 14-word factual sequence, the published Williams et al. malaria protection percentages in the Teaching and Classification essay pages. Reference-list repetitions are expected and intentionally retained. A spot-check of substantive research/teaching paragraphs found no em dashes or colons in ordinary prose.
- The accessibility audit passed on the Research DOM fix (`4c5f652`), as did the research-figure and external-resource audits. The responsive-browser job remained in progress when last inspected.
- Root-level HTML link and fragment checks found no unresolved references to other root-level `.html` pages. Links into separately deployed project repositories should be tested independently.
- The apparent duplicate `<main>` in `fluid-layout-lab.html` is an HTML snippet inside the JavaScript export builder, not a second live document landmark.
- The editor's PowerPoint-like crop, resize and live-object tests still have genuine failures. Treat them as separate unresolved product-quality work, not as evidence that the research prose fails.
- Actual full-page screenshots were retrieved from GitHub Actions for 320px and 375px phone widths (plus desktop captures). A pronounced Homepage overlap, Research text flush against the page frame, and CV text flush against its frame were observed and targeted. The new pages must be reviewed in newly rendered screenshots before visual sign-off.
- The existing responsive audit omitted Contact and Pungmul. Both, plus 404 screenshot coverage, were added to `scripts/responsive_smoke.py` in commit `357b4aa`. The new workflow should be checked for results.
- The audit now tests mobile intersections between free-positioned photographs and readable text on Home and Interests, commit `26ffc4a`. Ordinary viewport-width checks had missed these image/text collisions. Treat the fix as provisional until the run confirms it.
- A retrieved responsive screenshot at 320px confirmed the formerly overlapping Homepage hero now reads correctly; its 1440px capture was pixel-identical to the previous desktop screenshot (bounding-box of pixel differences was empty). A subsequent phone-only improvement constrained the lower ensemble photo within the frame and added gutters, so final screenshot sign-off is still pending.
- The three visual-audit GitHub Actions workflows had an evidence-publishing rebase failure (`fatal: empty ident name`) despite successful browser capture. Explicit Git identity configuration was added before commit and rebase in `f8a019e`, `4d9fdb8`, `c218440`. Re-run results are needed before marking publication fixed.
- Desktop and phone browser audit showed a generic external-link icon creating a 35px gap under project figure images. Scoped CSS reduced it to 10px across the linked application screenshots (`ec63c794`) while preserving accessible image-only links; a new regression guard (`3b258a2`) fails when the gap exceeds 18px. The research published figure received the same image-link fix in `9cb3e6a`.
- A dedicated real-browser A4 CV audit produces the printed PDF, image of each page, font/landmark checks, and text-boundary geometry. An initial three-page capture exposed orphaned headings and large trailing white space. Print-only adjustments and a continuation heading now produce two readable pages without content clipping; latest run for `2b5d56a` passed.
- CSS has received targeted spacing changes; final human visual judgment is still outstanding for the edited pages.

- On 28 October, Pungmul's historical passages were checked against UNESCO's nongak record, the National Folk Museum's account of the February 1978 debut of samulnori, and Park's 2014 study of movement performances. Targeted revisions were committed without changing any of the five embedded image sources, image geometry metadata, section closures or reference links. Contact's footer and metadata revisions likewise preserved its photograph and two primary mailto links. Both pages still need fresh rendered desktop and phone approval.

## Next content pass

Next, review `interests.html` in full, including the relationship of its Pungmul overview to the separate historical page and its fixed desktop text geometry. Then return to the Homepage and Research hub. Recheck `pungmul.html` and `contact.html` against fresh rendered screenshots and the completed responsive test results before calling their layout finished. Keep technical editor QA separate and retain outstanding verification until it is evidenced.
