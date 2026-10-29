# Comprehensive academic website content audit

Started 29 October 2026. This is the **content-only, renewed page-by-page register** requested on 29 October, beginning at Home. It supplements, and does not erase, `docs/EDITORIAL_PAGE_AUDIT.md`, the 28 October Home audit, and the 29 October public visitor/release closeout. Those reports document earlier work; their historical completion does not count as coverage in this renewed sentence-level content pass.

## Scope, standards, and status definitions

Check all reader-facing text, including metadata, headings, links, alt text, disclosures, footnotes, examples, captions, scholarship, and claims. For each section evaluate evidence, analytical scope, clarity, sentence-to-sentence relationships, paragraph development, Canadian English, repeated ideas and terminology, and cross-page consistency. Preserve the author's restrained, reflective voice. Never add em dashes, prose colons, corrective contrasts, source-led filler, mechanical transitions, or rule-of-three rhetoric merely for polish. Maximize justified improvement, not changed word count.

Status terms: **Not reviewed in renewed pass**, **In progress**, **Reviewed with issues**, **Corrected but unverified**, **Editorially verified**, **Factually verified**, **Fully verified**, and **Blocked**. A section may be editorially verified while some claims remain cross-page-checked rather than independently verified from primary records. Full verification requires independent evidence for all factual claims and all other applicable checks.

## Public top-level inventory and renewed-pass coverage

The 19 public/legacy HTML files below were enumerated from the current repository root on 29 October 2026. Internal tools, application subroutes and other files require a later inventory as the audit moves beyond these pages.

| Route or file | Renewed content-pass status | Continuation note |
| --- | --- | --- |
| `index.html` | **Editorially verified; factual source corroboration incomplete** | Stage C-H1 below; do not mark Fully verified |
| `research.html` | **In progress; opening and project bridge editorially source-verified** | Stage C-R1 below; next Research interests |
| `research-action.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `research-scoping.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `projects.html` | Not reviewed in renewed pass | Project listings and labels |
| `research-methods-studio.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `story-method.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `teaching.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `teaching-ap-biology.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `teaching-ap-chemistry.html` | Not reviewed in renewed pass | Full content review pending |
| `teaching-ap-evolution.html` | Not reviewed in renewed pass | Full content review pending |
| `teaching-osmosis-practice.html` | Not reviewed in renewed pass | Supplementary teaching material |
| `writing-biological-classification.html` | Not reviewed in renewed pass | Independent essay, scholarly sources |
| `interests.html` | Not reviewed in renewed pass | Prior page consulted *only* to cross-check Home |
| `pungmul.html` | Not reviewed in renewed pass | Supplementary personal/cultural content |
| `cv.html` | Not reviewed in renewed pass | Credentials, positions, dates, manuscript statuses |
| `contact.html` | Not reviewed in renewed pass | All substantive contact language |
| `about.html` | Not reviewed in renewed pass | Redirect and fallback copy |
| `404.html` | Not reviewed in renewed pass | Error-page copy |

Additional independent content inventories pending: the `studio/` and `connection-studio/` web applications, related `editor*` and `publisher/` routes if user-facing, downloadable/supporting documents, interactive expanded content and additional discoverable paths. Their prior visitor-oriented QA is documented elsewhere and is not claimed here as renewed editorial verification.

## Stage C-H1 | Home, complete sentence-level content review

**Reviewed source.** `index.html` on `main`, original blob `1223f30728a2210f5f7f01c4bd4d1bef5404dc38`. Cross-checked current page sources `research-action.html`, `research-scoping.html`, `research-methods-studio.html`, `story-method.html`, `teaching.html`, `teaching-ap-biology.html`, and `interests.html`. Consulted existing Home audit and cumulative editorial register to preserve earlier choices. GitHub Pages itself was not directly accessible from the web tool at the time of this content pass; the reviewed artifact is repository source.

**Full Home content inventory and disposition.**

| Exact area | Check and disposition |
| --- | --- |
| Browser title, description, canonical URL | Read; restrained identification of profession and interests. Kept. External search-index appearance unverified. |
| Skip link, brand, primary navigation, heading hierarchy | Read every label. Kept. One H1 present. |
| Hero greeting, teaching description, inquiry interest and justice-oriented motivation | Read all five prose sentences and the greeting. The arc from teaching to explanatory evidence and participation questions is defensible as a statement of interest, not an experimental conclusion. Retained original voice and rhythm. |
| Hero two calls to action | Read and retained. Distinct destinations for Research and on-page work. |
| Research and teaching heading and Research card | Checked initial ERIC-bounded corpus of 20 studies against the scoping project page; checked action-research comparison against empirical study page. Retained as accurate cross-page summary, with no unwarranted learning-effect claim. |
| Teaching card | Clarified AP course names and recast designed proposals as future conditional work. Changed, then re-fetched and checked in source. |
| Research spotlight heading, ten-pair paragraph and two destination links | Checked the ten-pair analysis and four recorded patterns (5 extended pathways, 2 non-repeated contradictions, 2 omitted earlier relations, 1 undeveloped in both) against `research-action.html`. Explicit prompt/feedback confounding retained. Detailed underlying individual records have not been independently re-audited in this pass. |
| S20 case heading and four-sentence passage | Checked against the de-identified S20 account in `research-action.html`. It distinguishes previously expressed relations from later omissions. The last sentence appropriately concerns what a reader would miss from one record; no claim of changed knowledge. Kept. |
| Learning tools title, Research Methods Studio card and link | Confirmed that the radish-salinity exercise is a **constructed exemplar** rather than an actual experiment. Replaced “worked synthetic experiment” with “worked example with synthetic data”; changed “helps” to a description of available functionality. Re-fetched and source-checked. |
| The Story Method card and link | Compared with released journey, recall and application description. The site claims available practice, not measured effectiveness. Kept. |
| Outside school, photo description and interest link | Checked the queer pungmul account, photographs and book/show reflections against `interests.html`. Replaced potentially ambiguous “shared some performances” with an exact description of photographs and reflections. Retained the personal opening sentence. |
| Portrait photo alt, ensemble photo alt | Read both descriptions and retained. Source has two image tags with descriptive alt text. |
| Footer invitation, mail link, ORCID, top link and supporting labels | Read and retained. ORCID link format and mailto exist in source, but no fresh external-endpoint test was possible. |

**Changes implemented.** Three paragraph replacements in `index.html`, production commit `217db8245ccc67bab995819ca95d8a0a15d23a95`. Changes were confined to the Teaching card, Research Methods Studio card, and Outside school paragraph. Every other Home text segment was deliberately preserved. Replacement texts:

1. Teaching: “I teach AP Biology and AP Chemistry and supervise independent student research. I also develop curriculum proposals that begin with a scientific problem and consider how students’ questions might shape what the class investigates next.”
2. Studio: “This workspace lets students revisit research questions, methods, and evidence as their projects develop. The project page uses a worked example with synthetic data to examine choices about experimental design and analysis.”
3. Outside school: “I play pungmul with a queer ensemble and enjoy spending time with poetry, fantasy, science fiction, and stories told together. The Interests page includes photographs from our performances and reflections on a few favourite books and shows.”

**Source verification.** Re-fetched `index.html` after the commit, confirmed new blob `bbc4cac2ddc7ce3b719b59d31529228f3cb6ba46`, all three new phrases and removal of the misleading synthetic-experiment phrase. Checked preservation of 20-study and ten-pair counts, one H1, 21 anchor tags and ten distinct locally linked HTML destination filenames. The reader-text scan found no em dash. One initial audit assertion incorrectly expected two occurrences of the exact hero phrase; it occurs once (metadata says “teaches” rather than “I teach”), so that assertion was a **test expectation error**, not a page defect. It is not included as a failing website check.

**Editorial judgment.** Remaining sentences have varied and meaningful progression without forced transition words. Research overview, specific action-research example, learning-tool design descriptions and personal interests have distinct functions; their purposeful topic overlap is retained. Hero motivation remains reflective rather than presented as verified empirical causation. Avoid repeating existing design-accessibility work. No supported reason to rewrite other Home prose merely for variety.

**Accuracy and verification limitations.** Homepage quantitative statements agree with the current cross-linked research pages, but this pass did not re-examine raw student responses, original scoping extraction records, independent institutional records or the personal photographs' provenance. These claims are **cross-page corroborated**, not independently factually verified. Full live deployment confirmation, screenshot reflow after wording changes, real screen-reader narration, actual native browser zoom, and external ORCID/URL response checks are still outside this stage. The October 29 published-site closeout predates this Home text revision and does not certify its deployment.

**Stage status.** Home **Editorially verified at repository-source level**, with factual-primary-record and current-deployment checks pending. Prior site-wide visual/accessibility verification preserved as historical evidence, not falsely re-run.

## Stage C-H1 automated regression follow-up

The targeted Home workflow triggered by the content commit `217db8245ccc67bab995819ca95d8a0a15d23a95` initially failed in run [40880601733](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40880601733). Its log showed **15/15 responsive widths, keyboard checks, all six print/forced-colour media cases and nested 404 passed**. The A4 checker labelled the Teaching and Research Methods Studio cards as split because it searched for the two **old paragraph openings**, which had just been editorially revised. No measured layout issue was reported by that run. This was an obsolete test assertion, not established page content damage.

Updated only the two text expectations in `scripts/audit-home-route.py` to the new, exact paragraph openings, commit `b38e4d59f50351f2e870c93299cfa271a4e7357f`. The script was re-fetched and both changed expectations confirmed. Focused Home Chromium workflow [40881070247](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40881070247) **completed successfully** on that commit and published `audit/home-route-visual = success`. This rerun covers the new homepage text and confirms its source-level and automated browser/print checks. It does not replace manual visual inspection or primary-data verification.

## Stage C-R1 | Research overview opening and empirical-project bridge

**Coverage.** Current `research.html` source blob `c81ca936c7422144680f0e8fd09fd345b9a90e23`, reviewed the page H1, the food-web illustration and complete opening statement, the “Research projects” heading, both project-card titles/descriptions, and both paragraphs connecting the scoping-review account of Luis with the action-research account of S20. The succeeding “Research interests” section was read for transition context only; its own full audit is still pending.

**Factual checks.** The 20-study ERIC-bounded corpus agrees with `research-scoping.html`. The action-research statements of one class of 28, two feedback-cycle adjustments and ten selected reconstruction pairs agree with `research-action.html`. The primary 2021 Pierson, Clark and Brady article, *Science Education* 105(4), 776–813, DOI `10.1002/sce.21622`, independently confirms the example of Luis's bilingual explanation distinguishing fish feeding from breathing, followed by a shorter English translation that does not retain the distinction. The food-web opening is visibly hypothetical and makes no claim that this particular classroom episode occurred. Independent re-analysis of the author's original student response sheets and scoping extraction workbook was **not** part of this stage.

**Sentence and cohesion findings.** The paragraph beginning “This example has drawn my attention” restated the teaching-decision question already established in the preceding paragraph and repeated the Home hero's “drawn me” rhetorical pattern. Beginning instead with teachers' curricular decisions carries the actual concept forward. “Different tasks and language conditions shaped these records” risked implying a demonstrated causal mechanism. Replaced it with a statement that the records arose under differing conditions. The final sentence “That uncertainty has drawn me to scholarship” repeated the same movement toward an interest, while the following Research interests section already develops the scholarship. Removing it lets the uncertainty remain explicit without formulaic closure.

**Production change.** Three precise text replacements committed to `research.html` as `d51253ed384b840b0eaee663511d386b62e157f1`. They remove the unnecessary opening sentence, qualify the cross-case comparison and close the bridge paragraph on the actual gap in available evidence. No quantitative finding, bibliography, heading, illustration or link was changed.

**Post-change source verification.** Re-fetch verified blob `103605ea16e74ee4a82390b429b0ec678737c4b2`, all new text, retention of the 20/28 counts and both project examples, and absence of the targeted old phrases. This is **editorial source verification**. No new Research-page browser/print run or full independent fact audit is claimed. The primary Pierson article was checked externally, but the classroom-record example remains source-correlated, not independently re-analysed.

**Stage status.** Research opening and project bridge **Editorially verified**, with the noted primary-record qualification. Entire `research.html` remains **In progress**.

## Exact next continuation point

**Stage C-R2, `research.html`, begin at “Research interests”, especially the section overview and “Classroom authority and epistemic agency”.** Review each subsequent paragraph and in-text citation against its cited source, examine theoretical precision, repeat patterns and transition mechanisms, then proceed through the remaining subsections, bibliography and figure material. Preserve the now source-verified C-R1 introduction, factual qualifications and unchanged full Home review. Audit further pages in the inventory only after each preceding stage has an evidence-backed handoff.
