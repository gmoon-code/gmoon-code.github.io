# Stage C-RV13 | Full HTML route inventory, audit coverage and remaining evidence

Date **2 November 2026**. Continued after [C-RV12](TEACHING_SUITE_COVERAGE_AUDIT_C-RV12_2026-11-02.md).

## Repository inventory methodology

Queried the **current complete Git tree** for `gmoon-code/gmoon-code.github.io`. The repository contains **26 HTML files**, with **23** at the root and **three** nested public/tool routes. Parsed the original [comprehensive renewed content audit](CONTENT_ONLY_COMPREHENSIVE_AUDIT_2026-10-29.md) as a source of **19** root public/legacy routes that had been reviewed paragraph by paragraph. Computed the set difference to obtain the **seven** extra editor, source-preview and writing-tool routes. The original audited osmosis teaching page is one of the 19 and must not be restarted simply because it appears less prominent.

A file appearing in an audit inventory is not proof of independent full-source research verification. The source editorial tiers below remain separate from private raw study records, current publisher full texts, browser tests and actual source deployment parity.

## Main 19 ordinary and legacy HTML pages

| Route | Audited scope | Existing substantive limits |
| --- | --- | --- |
| `index.html` | Editorially reviewed in main 19-route ledger | Editorially verified; factual source corroboration incomplete |
| `research.html` | Editorially reviewed in main 19-route ledger | Editorially verified; scientific and bibliographic evidence partly externally corroborated; full verification remains open |
| `research-action.html` | Editorially reviewed in main 19-route ledger | Editorially verified; empirical/ethics primary records unverified; A4 print issue unresolved |
| `research-scoping.html` | Editorially reviewed in main 19-route ledger | Editorially verified; corpus/source and OSF live-DOI verification incomplete |
| `projects.html` | Editorially reviewed in main 19-route ledger | Editorially verified; project claims cross-page checked, live deployments not independently tested |
| `research-methods-studio.html` | Editorially reviewed in main 19-route ledger | Editorially verified; synthetic data checked; live deployment/security not independently verified |
| `story-method.html` | Editorially reviewed in main 19-route ledger | Editorially verified; source release and exact Unit 1 challenge corroborated, live site unverified |
| `teaching.html` | Editorially reviewed in main 19-route ledger | Editorially verified; original classroom records/employment and deployed parity unverified |
| `teaching-ap-biology.html` | Editorially reviewed in main 19-route ledger | Editorially verified; PSII science and bibliography externally corroborated, student source records open |
| `teaching-ap-chemistry.html` | Editorially reviewed in main 19-route ledger | Editorially verified; computed Qp and source references checked, live deployment unverified |
| `teaching-ap-evolution.html` | Editorially reviewed in main 19-route ledger | Editorially verified; clinical and scholarly sources checked; constructed calculations verified; deployment unverified |
| `teaching-osmosis-practice.html` | Editorially reviewed in main 19-route ledger | Editorially verified; numerical and osmosis claims independently checked; deployment unverified |
| `writing-biological-classification.html` | Editorially reviewed in main 19-route ledger | Editorially verified; scholarly and bibliographic claims externally corroborated, full primary texts not re-read |
| `interests.html` | Editorially reviewed in main 19-route ledger | Editorially verified; external bibliographic/series references corroborated; personal claims unverified |
| `pungmul.html` | Editorially reviewed in main 19-route ledger | Editorially verified; historical sources corroborated; personal/photo provenance unverified |
| `cv.html` | Editorially reviewed in main 19-route ledger | Editorially verified against 29 October résumé; credential primary records and preferred public email unresolved |
| `contact.html` | Editorially reviewed in main 19-route ledger | Editorially verified; preferred contact address unresolved |
| `about.html` | Editorially reviewed in main 19-route ledger | Editorially verified at source level |
| `404.html` | Editorially reviewed in main 19-route ledger | Editorially verified at source level |

The main page records include H1 Research, Teaching, CV, Interests, Pungmul, project details and less prominent `teaching-osmosis-practice.html`, `404.html` and `about.html`. The C-RV1–12 primary-publisher audit provides further independent verification of selected scoping, action, classification, curriculum, photo and professional sources, and C-RV4g contains the precise 53-reference source-access tiers for the Research overview.

## Seven additional nested and editor routes

| Route | Renewed content findings | Limits still open |
| --- | --- | --- |
| `connection-studio/index.html` | Instructional source reviewed C-CS1–2; native Node content-bank regression passed | Browser delivery and independently measured educational effectiveness outstanding |
| `editor-v2-previews/source-index.html` | Historical Home-page preview retained, noindex added C-ED6 | Archived fixture, not current published Home; direct browser/SEO indexing unverified |
| `editor-v2.html` | Content claims/grouping/local state reviewed C-ED2–5 | Six distinct browser regression test cases failed previously; separate debugging required |
| `editor.html` | Direct publishing, image limitations and review language checked C-ED2 | Publishing and full editor/browser actions outstanding |
| `editors.html` | Editor directory and author-facing publishing roles checked C-ED2 | Functionality/authorization and live deployment unverified |
| `fluid-layout-lab.html` | Experimental unpublished lab wording and noindex source checked C-ED6 | Intended experimental functionality/browser actions pending |
| `studio/index.html` | User access/token and publishing prose checked C-ED1 | Authenticated author actions, complete saved-state persistence and browser parity not verified |

This route reconciliation does **not** imply seven supplementary tools have all passed complete behaviour/UX checks. It provides an honest map of reader-facing and author-facing written material already checked, with the limits described in the corresponding C-CS and C-ED ledgers.

## New inconsistency found in author-facing source configuration

The current public Home and other root pages visibly label **Contact** as the navigation destination, and `about.html` is an explicit redirect to `contact.html`. Website Studio's current `studio/navigation.json` and `studio/pages.json`, however, still list **About** as a visible Main route instead of Contact. Its `studio/studio.js` source also retains `about.html` in the hard-coded `BASE_PAGES` array and uses that redirecting page as the default template for creating a new page. These are not mere cosmetic differences: choosing a redirecting HTML page as a source template can carry incorrect redirect/canonical metadata into newly published pages. Studio's current `pages.json` contains **15** entries; a previous supplementary ledger had noted **16**, which is superseded by this exact new inventory.

This is a **confirmed source-data discrepancy**, but it requires a separate compatibility-safe implementation check before editing. The route and template data are untouched within C-RV13.

## Overall verification qualifications

The primary user-provided 20-study corpus, 28-student inquiry responses, independent rater decisions, permission/assent records and some individual credential records remain inaccessible. A successful native DOI metadata audit confirms preprint registration, **not** all underlying scholarly claims or corpus decisions. Public email preference differs between the current website and newest author-supplied résumé; it is not appropriate to choose a personal address without the author. Earlier Editor V2 automated browser tests failed on several interactions; they remain unresolved independently of this prose audit. Successful Pages builds are not proof of full browser/data parity.

## Exact next checkpoint

**Stage C-RV14 | Website Studio About/Contact source manifest and safe creation template.** Trace Studio's navigation and pages manifests through runtime page creation and publishing logic. Resolve the stale About route in editor-visible labels and base-page lists against the current public Contact page. Prevent newly created pages inheriting the old About redirect/canonical URL, without changing the public redirect itself or disturbing 19 reviewed pages. Verify actual source and duplicate/new-page paths, add bounded regression assertions, and save the next ledger. Then return to other metadata/primary research and browser-parity evidence.

**Status:** Route inventory and audit coverage verified: 26 total, 19 main audited, seven supplementary scoped; no production page edit in C-RV13. Whole-site factual and browser audit remains **In progress**.
