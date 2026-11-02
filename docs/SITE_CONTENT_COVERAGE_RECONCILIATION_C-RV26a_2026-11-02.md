# Stage C-RV26a | Actual site content coverage versus renewed audit registers

**Date:** 2 November 2026. Continued after [C-RV25e](TEACHING_PROPOSALS_SCIENCE_MATH_AUDIT_C-RV25e_2026-11-02.md), as required by the master prompt. Reconciled the current site's `sitemap.xml`, original [19-route renewed editorial register](CONTENT_ONLY_COMPREHENSIVE_AUDIT_2026-10-29.md), [supplementary content and app coverage ledger](CONTENT_AUDIT_SUPPLEMENTARY_COVERAGE_2026-11-01.md), previous C-ED and C-CS reports, and the **actual GitHub source files**. These counts include route identity and source status; they do **not** assert that the full text of every file was freshly re-read in this stage.

## Root public or legacy academic pages

The original register lists **19** distinct top-level HTML files. All **19 were fetched successfully from the current default branch** and their blob SHA and presence checked. The **16-entry** sitemap lists exactly the subset expected for ordinary public discovery, with `/ ` mapping to `index.html`. The three root files omitted from that sitemap are `teaching-osmosis-practice.html` (individually reviewed in C-TO1, currently **noindex**), `about.html` (old redirect to Contact, **noindex**) and `404.html` (error page, **noindex**). No new sitemap addition is indicated merely by their existence.

**Important distinction:** The descriptions below reproduce the *historical editorial status* from the 29 October full audit register, with later checks summarized beneath the table. They are **not** a new claim of complete primary-record or deployed-browser verification at today's source SHA.

| Page | Listed in sitemap? | Prior editorial status and main unresolved boundary | Current GitHub source SHA |
| --- | --- | --- | --- |
| [`index.html`](../index.html) | Yes | Editorially verified; factual source corroboration incomplete; Stage C-H1 below; do not mark Fully verified | `bbc4cac2ddc7ce3b719b59d31529228f3cb6ba46` |
| [`research.html`](../research.html) | Yes | Editorially verified; scientific and bibliographic evidence partly externally corroborated; full verification remains open; C-R1 through C-R7 completed and documented; NSF manuscript link and primary research-record checks outstanding | `9437512368d44a590b3d986f82bb8e6d6eea61ad` |
| [`research-action.html`](../research-action.html) | Yes | Editorially verified; empirical/ethics primary records unverified; A4 print issue unresolved; Stages C-A1a–C-A1e; 7-page print export has a 37-word final sheet | `249729c4f080addec2b3cae0926c349463b8b3f8` |
| [`research-scoping.html`](../research-scoping.html) | Yes | Editorially verified; corpus/source and OSF live-DOI verification incomplete; C-S1 through C-S4; page-wide source content and automated visitor checks passed | `cf0eaaa192876264d47f57ea9b30ffec36e84ebb` |
| [`projects.html`](../projects.html) | Yes | Editorially verified; project claims cross-page checked, live deployments not independently tested; Stage C-P1; no unjustified rewrite | `f3f90cd7c64bf780bd486e42b3544a9b94adf348` |
| [`research-methods-studio.html`](../research-methods-studio.html) | Yes | Editorially verified; synthetic data checked; live deployment/security not independently verified; C-P2a–C-P2d; current-head visitor, link, accessibility audits passed | `911924f5f3b22a3106984cf1b96e716fe1732b9d` |
| [`story-method.html`](../story-method.html) | Yes | Editorially verified; source release and exact Unit 1 challenge corroborated, live site unverified; C-P3a–C-P3d complete, no unnecessary prose edits | `222b4d47fff418f9231dca7e3151bdf2011db7b5` |
| [`teaching.html`](../teaching.html) | Yes | Editorially verified; original classroom records/employment and deployed parity unverified; C-T1a–C-T1d; one justified edit, visitor/link/accessibility checks passed | `d9f114c115d0e5b7951335c795cd148b04e25afa` |
| [`teaching-ap-biology.html`](../teaching-ap-biology.html) | Yes | Editorially verified; PSII science and bibliography externally corroborated, student source records open; C-TB1a–C-TB1d; one correction; visitor/link/citation QA passed | `a28fe352109ad12508f0ad481e6aba32455d5739` |
| [`teaching-ap-chemistry.html`](../teaching-ap-chemistry.html) | Yes | Editorially verified; computed Qp and source references checked, live deployment unverified; C-TC1a–C-TC1d; 2 bounded inference edits, visitor/link/citation checks passed | `d22115cd633357695967af5d499bd0065cb73c84` |
| [`teaching-ap-evolution.html`](../teaching-ap-evolution.html) | Yes | Editorially verified; clinical and scholarly sources checked; constructed calculations verified; deployment unverified; C-TE1a–C-TE1d complete, three bounded prose corrections | `40de860091218b308283707ed40949110241c9a6` |
| [`teaching-osmosis-practice.html`](../teaching-osmosis-practice.html) | No, intentional/noindex or legacy | Editorially verified; numerical and osmosis claims independently checked; deployment unverified; C-TO1a–C-TO1d complete, three teacher-note passages refined | `fd64ebb9384b4102b35c8997ea857b20d080ce25` |
| [`writing-biological-classification.html`](../writing-biological-classification.html) | Yes | Editorially verified; scholarly and bibliographic claims externally corroborated, full primary texts not re-read; C-W1a–C-W1e complete; four targeted prose corrections | `af0e27d2da0fdaf3994d980231637e5a988d0d58` |
| [`interests.html`](../interests.html) | Yes | Editorially verified; external bibliographic/series references corroborated; personal claims unverified; C-I1a–C-I1d, no unjustified rewrite | `9b1590f1da0d222d55139d93d3c06b4911af3fb3` |
| [`pungmul.html`](../pungmul.html) | Yes | Editorially verified; historical sources corroborated; personal/photo provenance unverified; C-PU1a–C-PU1d, no content changes | `8caa993edac9304e6d1c9829b3084680b4ede135` |
| [`cv.html`](../cv.html) | Yes | Editorially verified against 29 October résumé; credential primary records and preferred public email unresolved; C-CV1a–C-CV1d; eight bounded corrections | `601707af9ca4fb7d4746c6d1d2525bdf3f081a74` |
| [`contact.html`](../contact.html) | Yes | Editorially verified; preferred contact address unresolved; C-CN1a–C-CN1c; no prose revision, author-reported bio | `ac42543da2d79999e1eb93bff6759e6095022b56` |
| [`about.html`](../about.html) | No, intentional/noindex or legacy | Editorially verified at source level; C-AB1a; redirect and fallback copy checked | `a39c0469eeadc8c104c884d812b1b4be4db68db1` |
| [`404.html`](../404.html) | No, intentional/noindex or legacy | Editorially verified at source level; C-NF1a; recovery message and navigation checked | `361512d3e77f05f36d2701d1201561b039469df8` |

## Authored tools and other discoverable surfaces outside the 16-site sitemap

The supplementary ledger explains why the sitemap is not a complete list of every user-facing instructional or authoring surface. The following separately confirmed files are present as of the current fetch, with their prior source-only audit scope. Noindex here is an observed property of their source, not proof of a deployed HTTP header.

| Additional page | Current source SHA | Existing content-audit status | Site-indexing intent |
| --- | --- | --- | --- |
| `connection-studio/index.html` | `485dbe8c8a5994139fee5b0884889ad4e3479942` | C-CS1–2 lesson bank and writing examples editorially reviewed; browser/effectiveness unchecked | indexable |
| `studio/index.html` | `fd5884daee0c4ac53339f77b0ff6c1be89267364` | C-ED1 limited author-facing access/publish text reviewed; remaining help not exhaustively covered | noindex |
| `editors.html` | `0da76d7a477e996ba3341b599512a61dd50d1d75` | C-ED2 selected editor access/publishing statements checked, not entire long-running workflow | noindex |
| `editor.html` | `2b6533e6d1523941aa29eef5ad7a889f4d93b246` | C-ED2 source guidance checks; not complete functional verification | noindex |
| `editor-v2.html` | `5e72db6272e4abbbf55ebff72070c3a28b05e0a2` | C-ED2–5 bounded instructional claims edited; six existing failing editor-browser cases separately open | noindex |
| `fluid-layout-lab.html` | `a5986f9dea7c5e3d630011b87b70f9a980880266` | C-ED6 noindex/lab status checked; comprehensive current user-facing example text not fully audited | noindex |

The previously documented `editor-v2-previews/` source area **cannot be safely represented as the particular file `editor-v2-previews/index.html`**: a lookup for that assumed path returned 404. This does not establish that all preview files are absent, since the area may contain generated documents or differently named routes. Similarly, publisher source/administrative documentation and unlinked expandable help still require file-by-file inventory. Do not treat these unknown paths as confirmed omissions or invent deployment URLs.

## Reconciliation against later targeted source audits

- The full renewed content-only register already reviewed the text of **all 19** root pages at its earlier checkpoints, including the less prominent osmosis page and recovery/legacy routes. It explicitly did **not** mark all factual claims, student records, private credentials, bibliographic full text, or published bytes completely verified.
- Since the renewed register, C-RV1–25e improved source-based corroboration for scoping/action research, 53 citations in Research (all now at **at least an individually documented source tier**, with 17 substantial-text, 35 publisher abstract/method or chapter-record and one bibliography-only source), teaching and curriculum calculations, source-to-project claims, original DOI status, credential terminology and links. The old register's unresolved **OSF DOI registration** statement is **superseded** by C-RV5's successful Crossref record check, but the final 20-study coded chart itself still lacks original independent provenance. The old register's Massachusetts grade-band discrepancy was corrected in C-RV6. Neither older stale note should be treated as an unresolved *public wording* error today.
- The separate Connection Studio content bank has C-CS1–2 source/editorial coverage and successful Node content regression. Website Studio and editor guidance have **bounded** C-ED1–5 review, with unresolved detailed text and **six existing Editor V2 browser failures**. `fluid-layout-lab.html` remains a noindex workbench; its full content was not recertified just because noindex status was checked. `studio/pages.json` is a 16-item editing manifest, not the public website's complete page inventory; its gaps are intentionally still awaiting source-specific review.
- No root page was newly found missing, and no current available evidence justified rewriting a scholarly or teaching paragraph simply for coverage optics.

## Outstanding verification tiers, kept separate

1. **Primary research records:** original 28-student responses, consent/assent/permissions and independent rater materials; August scoping preprint's final 20-study study-level evidence roster and S2C mapping.
2. **External scholarship:** some original book chapters remain verified only at an abstract/publisher-descriptive tier; exact provenance of certain personal credentials cannot be inferred from school descriptions; the author's preferred public contact address was not resolved here.
3. **Public delivery:** GitHub source fetch and successful deployment workflow do not prove fetched visitor-visible byte/text parity.
4. **Additional instructional/tool routes:** author-facing studio/editor help and auxiliary publisher/preview resources require more exhaustive content-only source checks. The six known Editor V2 browser failures are functional tracks, not proof a particular instruction sentence is false.

## Exact next checkpoint

**Stage C-RV26b | Supplementary author-facing instructional content, scoped by prior edits.** Read the **remaining unabbreviated prose and help text in `studio/index.html` and `editor-v2.html`** that earlier C-ED1–5 reports did not explicitly cover. Reconcile instructions about source, local drafts, publishing, images, authorization, cross-page edits and previews against accompanying source scripts and available auth restrictions. Focus strictly on factual claims, internal consistency, repetition and the author's editorial style. Implement only supported content changes; for functionality not checkable without authenticated browser use, record the limitation instead of asserting success. Next inventory `publisher/` and other helper routes by supported paths, without guessing the missing `editor-v2-previews/index.html`.

All prior source-verified scholarly and classroom content and style decisions remain preserved. **Overall content audit: In progress.**
