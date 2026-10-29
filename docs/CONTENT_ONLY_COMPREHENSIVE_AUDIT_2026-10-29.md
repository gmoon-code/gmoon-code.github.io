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
| `research.html` | Not reviewed in renewed pass | **Next**: headings, introduction, interests, all scholarly sections, claims and citations |
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

## Exact next continuation point

**Stage C-R1, `research.html`, start at browser title/description, H1 and introductory paragraphs, then follow every section in source order.** Inventory every heading, body sentence, figure caption, citation, reference, expandable passage and link label. Check the source-to-claim relationship against linked publications and independent scholarly sources where possible; preserve its separate intellectual purpose relative to the study-detail pages. Compare recurring concepts and transitions against the Home copy just verified. Work in bounded subsections and record new source blob, exact edits, commit IDs and verified post-edit text here. Do not mark `research.html` verified based on old editorial/visitor reports.
