# Stage C-RV18 | Project-page application claims and source evidence

Date **2 November 2026**. Continued from [C-RV17](PUBLIC_DISCOVERY_CONTENT_AUDIT_C-RV17_2026-11-02.md) at its precise project-description/source parity checkpoint. Scope is **source-level factual and editorial reconciliation**, not authenticated application operation or live deployed-byte verification.

## Sources inspected

Main website source:
- `projects.html` (blob `f3f90cd7c64bf780bd486e42b3544a9b94adf348`)
- `research-methods-studio.html` (blob `911924f5f3b22a3106984cf1b96e716fe1732b9d`)
- `story-method.html` (page body, captions, explanatory notes, practice quotation, release and technical statements)
- `connection-studio/index.html`, `connection-studio/app.js`, `connection-studio/sw.js`, `connection-studio/manifest.webmanifest`
- `studio/pages.json`, `studio/navigation.json`, plus C-RV17 and C-RV13 coverage ledgers.

Related author-maintained original application sources:
- `gmoon-code/research-methods/README.md` (current v3.0.0 architecture and feature boundaries)
- `gmoon-code/research-methods/assets/curriculum.js`
- `gmoon-code/research-methods/assets/runtime-config.js`
- `gmoon-code/research-methods/assets/public-content-loader.js`
- `gmoon-code/research-methods/docs/V3_PRODUCTION_CUTOVER_CHECKLIST.md`
- `gmoon-code/research-methods/examples/radish-salinity/SYNTHETIC_SEED_LEVEL_DATA.csv`
- `gmoon-code/research-methods/examples/radish-salinity/SYNTHETIC_DISH_LEVEL_ANALYSIS_DATA.csv`
- `gmoon-code/research-methods/examples/radish-salinity/SYNTHETIC_ANALYSIS_OUTPUT.json`
- `gmoon-code/memory-palace-u1-8/README.md`
- `gmoon-code/memory-palace-u1-8/content/ap-biology/unit-1/journeys/Z1.json`
- `gmoon-code/memory-palace-u1-8/content/ap-biology/unit-1/application-lab.json`.

## Original synthetic radish records independently reconciled

Read all **90** seed rows and **18** dish rows, grouping seeds by `dish_id`. Checked, for **each of 18 dishes**, the presence of five seed rows, NaCl agreement between seed and dish, germinated counts, mean length of germinated seeds, and germination proportion. **Zero discrepancies**.

Independently aggregated the six dish means per level, retaining dishes as experimental assignment units rather than treating the 90 seeds as treatment replicates:

| NaCl | Dishes | Recomputed mean dish radicle length | Recomputed mean germination proportion | Public rounded values |
| --- | ---: | ---: | ---: | --- |
| 0 mM | 6 | 34.7000 mm | 1.0000 | 34.7 mm, 1.00 |
| 50 mM | 6 | 26.7833 mm | 0.9333 | 26.8 mm, 0.93 |
| 100 mM | 6 | 16.5667 mm | 0.7333 | 16.6 mm, 0.73 |

The independent results also agree with the author's stored synthetic analysis JSON within rounding. The results remain **constructed** teaching data, and the page expressly says no classroom experiment or student learning outcome is reported. The paragraph distinguishing germination over all seeds from length measured among germinated seeds is methodologically appropriate. No statistical/numerical correction warranted.

## Research Methods Studio description and application-source consistency

- The five explicit curriculum phases use stage groups **1–4, 5–8, 9–12, 13–15, 16–18**, matching the public page; all 18 stages are represented.
- README lists Literature Workspace, Methods Lab, Data and Statistics Lab, Scientific Writing Lab, Word-compatible `.doc` export and JSON backup/recovery, as described publicly.
- README and runtime configuration document the optional server-backed Research Chat endpoint and separate v3 public content endpoint. The page correctly distinguishes browser-local working notebooks from networked chat and dynamically published instructional guidance. Public technical prose qualifies these as implementation descriptions rather than an independent security/privacy certification.
- README documents six validated guidance fields per stage, complete-bundle fallback, signed administration and published content rollback, corresponding to the expandable technical details.
- The public page does not claim student learning effectiveness or independent privacy certification.

These checks corroborate current source architecture but **do not** demonstrate which remote backend response each visitor receives, authenticated login, or fully secure handling of sensitive information.

## Story Method original curriculum and release claims

- The current author-maintained README states **Units 1–8**, **58 journeys** and **448 scenes**, consistent with public project-page counts. These are content inventory claims, not measured learning.
- Unit 1 journey file `Z1.json` records `The Evidence Lockdown`, **nine** route locations and **nine** scenes. The public description's Observation Window, Hypothesis Doors and Control Benches match the first three route locations. The quoted first-scene line, “First we describe what we can actually see,” appears in original scene prose.
- The full public practice prompt about oxygen output of **12.0 to 15.0** versus **12.1 to 12.3** is identical to `U1-APP-10` in the original Unit 1 Challenge Lab. Recomputed changes are **3.0**, **0.2**, and difference-in-changes **2.8** in the specified units.
- The public text appropriately cautions that the constructed before/after averages alone do not demonstrate statistical precision or a mechanism. It does not promote the exercise to evidence of instructional efficacy.
- README documents the hint-assisted recall state, the static curriculum build check, two matching builds and QA-gated GitHub Pages deployment, supporting the public release description.

No change to the quotation, student prompt, counts or description was warranted. October 2026 screenshot captions have not been independently checked against saved original image capture metadata.

## Connection Studio and Website Studio source listings

The separate `connection-studio/index.html` uses language describing offline-friendly operation and private local progress. Its `app.js` reads/writes `localStorage`, offers export/import, and explicitly qualifies storage as browser-dependent. The HTML registers `sw.js` after page load, while `sw.js` lists the application assets and uses network-then-cache fallback for eligible GET requests. Those claims are coherent **at code level**; they have not been tested in a production browser with offline mode. It remains a separately indexable tool without sitemap promotion, an intentional-choice question from C-RV17.

`studio/pages.json` and `studio/navigation.json` use the expected public names **Projects**, **The Story Method**, **Research Methods Studio** and **Contact**. The omission of the independently accessible Connection Studio tool from the main Projects page is not by itself proof of a stale or incorrect page. No author-controlled indexing choice was inferred.

## Editorial findings and decisions

Reread the three project pages at paragraph/section level for transitions, sequence and qualifications. The introductory examples, project detail subsections and technical status notes serve different functions without inventing transfer, impact or experimental findings. Repeated terms such as *evidence* and *decisions* maintain meaningful continuity with the stated instructional emphasis. Rewording them solely for variety would reduce precision.

**Public prose corrections implemented: none.** This is a positive source-reconciliation result, not an assertion of error-free applications. No unsupported credentials, data, screenshots or citations were added. C-RV18 source checks are **Editorially verified within reviewed pages and Source corroborated within tested claims**, not fully independently verified.

## Deployment/browser boundary

Attempted direct retrieval of the public `projects.html`, Research Methods Studio and Story Method URLs on 2 November 2026. All returned *inaccessible via available web retrieval tool*. This is not evidence of page downtime. The application repositories and source pages were readable through the authenticated GitHub connector; public delivered bytes and interactive browser behaviour were **not** compared. Existing Editor V2 browser failures remain a separate, unresolved remediation track.

## Exact next checkpoint

**Stage C-RV19 | Targeted empirical/source-claim and external-dependency closure register.** Review the unresolved original 20-study scoping extraction and source-selection assertions, the action-research student-level/rater and ethics assertions, research writing provenance, public contact-email author preference, and externally accessed scholarly full texts. Distinguish what can be verified through public manuscripts/registries from material that requires confidential owner records. Do not infer private evidence exists or is absent from a public repository. Maintain live public-byte and Editor V2 browser remediation as separate blocked tracks.

**Overall status: In progress.** C-RV18 has an independently recomputed synthetic example and source-consistent project descriptions. No whole-site fully verified claim is justified.
