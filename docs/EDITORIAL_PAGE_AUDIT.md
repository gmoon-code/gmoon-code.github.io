# Website editorial and visual audit

Updated 27 October 2026. This is an internal progress register for the academic website, not a published portfolio page.

## Audit standard

Review **every** public page and supporting interactive page. Examine substantive claims against primary sources or the underlying research record, scientific explanations and arithmetic, authorship and image licences, chronology, differences between observed and proposed activities, repetition across and within pages, sentence-level transitions, Canadian English and the author's writing preferences, navigation, semantic HTML and accessibility, spacing and typography, print layouts, and responsive behaviour.

A content pass is **not** equivalent to final visual approval. Automated browser checks do not substitute for manual review of screenshots, keyboard navigation, and page flow. Do not arbitrarily shorten paragraphs. Retain a paragraph when its reasoning requires that length.

## Page-by-page register

| Page | Editorial status | Remaining verification |
| --- | --- | --- |
| `index.html` | Revised in preceding conversation; filename-style photo alt text fixed `fa0be6f`; full line-by-line sign-off pending | Responsive layout, all content and repetition across linked pages |
| `research.html` | Multiple documented editorial passes in preceding conversation | Source and visual recheck after subsequent changes |
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
| `cv.html` | Pending dedicated pass | All claims, dates, alignment with current applications |
| `about.html` | Pending purpose/redirect check | Destination, metadata and navigation |
| `404.html` | Pending | Copy, navigation, accessibility |
| `editor-v2.html` | Separate product QA in progress across prior conversations | PowerPoint-style editing interactions, resize/crop, geometry, publishing, keyboard/mobile |
| `editor.html` | Pending legacy editor review | Navigation, status and compatibility |
| `editors.html` | Pending editor landing review | Navigation, clarity and permissions |
| `fluid-layout-lab.html` | Pending technical QA | Responsive layout, controls and editor behaviour |

## Evidence of checks and limitations

- The action-research page reports a 28-student class and ten selected original/reconstruction pairs. Keep these numbers and their interpretation aligned with the Teaching pages. Do not equate response differences with causal evidence of learning.
- The 2005 Williams and colleagues cohort reports approximately 50%, 75% and 90% protective estimates against different malaria outcomes; it does not give the hypothetical fitness values used in the teaching model.
- The illustrative HbS selection model is internally consistent, with a weighted contribution of 0.776, next-generation HbS allele frequency approximately 0.2165, and Hardy–Weinberg zygote frequencies approximately 0.6139, 0.3392 and 0.0469.
- The osmosis illustrative percentage changes are +8%, −4%, and −13%. It cannot locate an exact isotonic concentration from the stated three samples.
- A source-level image-alt triage scanned all 23 root HTML pages. Filename-like alt text was replaced on Home (2 images), Interests, Pungmul and Contact; image bytes and geometry were preserved. An empty alt in `fluid-layout-lab.html` was found in a JavaScript template string, so it needs runtime rather than regex assessment.
- Source-level HTML checks and GitHub Actions accessibility/external-resource audits have passed for earlier revision commits. Some screenshot and artifact-upload jobs have failed at the publishing-artifact stage even when their browser checks succeeded. Inspect each job before treating a workflow failure as a content failure.
- An academic-editor resize regression currently fails because the test waits for a `profile-portrait` image filename removed from the Homepage markup when its images were embedded through the visual editor. Its failure occurs before image resizing is tested, so it cannot establish whether resizing works. The test and editor must be examined separately.
- CSS has received targeted spacing changes; final human visual judgment is still outstanding for the edited pages.

## Next content pass

Continue with `cv.html`, then independent line-by-line reviews of the remaining pending pages, then the remaining public pages, followed by separate editor QA. Return to prior partial revisions for full verification. Do not mark a page fully finished merely because a prior commit polished part of it.
