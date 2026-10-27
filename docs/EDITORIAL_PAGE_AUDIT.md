# Website editorial and visual audit

Updated 27 October 2026. This is an internal progress register for the academic website, not a published portfolio page.

## Audit standard

Review **every** public page and supporting interactive page. Examine substantive claims against primary sources or the underlying research record, scientific explanations and arithmetic, authorship and image licences, chronology, differences between observed and proposed activities, repetition across and within pages, sentence-level transitions, Canadian English and the author's writing preferences, navigation, semantic HTML and accessibility, spacing and typography, print layouts, and responsive behaviour.

A content pass is **not** equivalent to final visual approval. Automated browser checks do not substitute for manual review of screenshots, keyboard navigation, and page flow. Do not arbitrarily shorten paragraphs. Retain a paragraph when its reasoning requires that length.

## Page-by-page register

| Page | Editorial status | Remaining verification |
| --- | --- | --- |
| `index.html` | Revised in preceding conversation; filename-style photo alt text fixed `fa0be6f`; full line-by-line sign-off pending | Responsive layout, all content and repetition across linked pages |
| `research.html` | Prior full editorial passes; two missing nested section closures repaired `4c5f652`, restoring Research Interests and Related Writing to intended hierarchy | Desktop/phone layout review after DOM repair and cross-page prose verification |
| `research-action.html` | Crosschecked against original manuscript and the teaching case; malformed table and duplicated figure fixed, commit `6467157` | Final rendered desktop/mobile and diagram flow review |
| `research-scoping.html` | Checked against source manuscripts, selection ledger and Pierson/Kane publications; evidence and layout revisions `880c3f5`, `b267a1b` | Confirm deployment, inspect at desktop/phone, verify OSF DOI availability |
| `projects.html` | Content and image-source pass completed, commit `0db43f0` | Full manual layout and thumbnail review at desktop and phone widths |
| `teaching.html` | Content pass completed, commits `91b001d`, `8784ed8`, `cbb6fdc` | Final manual visual check at desktop and phone widths |
| `teaching-ap-chemistry.html` | Content and equilibrium calculation pass completed, commits `81ffbab`, `40a2476` | Final manual visual and responsive check |
| `teaching-ap-biology.html` | Science, empirical claim, prose and references pass completed, commits `bde0b87`, `8d1af09`, `cff539b` | Final manual figure and responsive check |
| `teaching-ap-evolution.html` | Science, cohort source, selection arithmetic, narrative and references pass completed, commits `421909e`, `6486278`, `ab2e94f` | Final manual figure and responsive check |
| `teaching-osmosis-practice.html` | Worksheet scientific and print-stylesheet pass completed, commit `d04f88c` | Printed-page preview and small-screen review |
| `story-method.html` | Content, source-record, scientific-example, and writing pass completed, commit `a1b5086` | Full live-preview interaction and visual inspection at desktop/phone sizes |
| `research-methods-studio.html` | Checked against synthetic source CSV, JSON and release README; content and statistical interpretation pass, commit `2865b41` | Live-preview, export, backup and responsive interaction audit outstanding |
| `writing-biological-classification.html` | Independently reviewed XYY systematic-review conclusion; improved evidence and classroom authority argument, commit `cc9460d` | Final independent visual inspection and cross-page prose repetition review |
| `interests.html` | Revised in preceding conversation; inaccessible photo filename alt fixed `ea80850`; final sign-off pending | Every text/image element and responsive layout |
| `pungmul.html` | History and image rights addressed previously; ARIA fix `209f965`, photo alt fix `8184b09` | Entire long-form and media layout, history source audit |
| `contact.html` | Revised in preceding conversation; photo alt fixed `667ed11`; final sign-off pending | Wording, contact destinations, all screen sizes |
| `cv.html` | Dedicated date/tense/claims and layout pass, commit `2a53919`; credential names and affiliations retained rather than guessed | Final printed A4 check and credential/document verification |
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
- The accessibility audit passed on the Research DOM fix (`4c5f652`), as did the research-figure and external-resource audits. The responsive-browser job remained in progress when last inspected.
- Root-level HTML link and fragment checks found no unresolved references to other root-level `.html` pages. Links into separately deployed project repositories should be tested independently.
- The apparent duplicate `<main>` in `fluid-layout-lab.html` is an HTML snippet inside the JavaScript export builder, not a second live document landmark.
- The editor's PowerPoint-like crop, resize and live-object tests still have genuine failures. Treat them as separate unresolved product-quality work, not as evidence that the research prose fails.
- CSS has received targeted spacing changes; final human visual judgment is still outstanding for the edited pages.

## Next content pass

Continue with full `interests.html`, `pungmul.html`, and `contact.html` passes, then the homepage and research hub. Keep technical editor QA separate and retain the outstanding visual checks until verified. Return to prior partial revisions for full verification. Do not mark a page fully finished merely because a prior commit polished part of it.
