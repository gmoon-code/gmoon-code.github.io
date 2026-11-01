# Stage C-RV16 | All 26 current HTML routes, titles, descriptions, canonical sources and indexing status

Date **2 November 2026**. Continued from [C-RV15](WEBSITE_STUDIO_DUPLICATION_CONTENT_AUDIT_C-RV15_2026-11-02.md).

## Scope and parsing care

Inspected actual current source metadata for all **26 HTML routes**, in two batches against the current GitHub source, including the head of the archived preview, standalone writing trainer, all four root editor/experiment pages and 19 main pages. Recorded browser titles, description meta, canonical href, robots meta, HTTP-equivalent refresh and presence of main content. Checked user-facing descriptions for accurate source status and canonical placement.

The experimental `fluid-layout-lab.html` has a deliberately minimal document without an explicit `<head>` wrapper. An initial simplistic head-only extractor incorrectly returned no title or robots metadata; inspecting the literal start of its source established `<title>Fluid layout lab | Ye Eun Moon</title>` and `<meta name="robots" content="noindex,nofollow">`. The metadata audit must not claim these are absent. Its unusual parser shape remains an implementation topic, not a factual claim about missing content.

## Metadata groups and findings

| Route group | Routes | Evidence/description status |
| --- | --- | --- |
| Ordinary indexable public homepage and academic pages | `index.html`, `contact.html`, `cv.html`, `interests.html`, `projects.html`, `pungmul.html`, `research.html`, `research-action.html`, `research-scoping.html`, `research-methods-studio.html`, `story-method.html`, `teaching.html`, `teaching-ap-biology.html`, `teaching-ap-chemistry.html`, `teaching-ap-evolution.html`, `writing-biological-classification.html` | All sixteen have page-specific titles, descriptive metadata and canonical links to their corresponding public paths (Home uses canonical site root). Descriptions distinguish proposed instructional content from actual research and do not advertise accepted publications. |
| Intentionally non-indexed legacy/practice resources | `about.html`, `404.html`, `teaching-osmosis-practice.html` | `about.html` is explicitly a noindex redirect whose canonical points to Contact; `404.html` has noindex and a recovery title; the illustrative osmosis sheet has noindex/follow and no canonical. These are deliberate role-specific choices, not omissions requiring forced indexing. |
| Authoring/experimental helper routes | `studio/index.html`, `editor.html`, `editor-v2.html`, `editors.html`, `fluid-layout-lab.html` | All five have a meaningful title and noindex policy; lack of canonical is appropriate for excluded internal tools. Studio explicitly identifies owner-only editing; Fluid Layout Lab is unpublished. The separate editor browser failures remain open. |
| Archived source preview | `editor-v2-previews/source-index.html` | Already marked noindex/nofollow in C-ED6; retains historical Home source text and a Home canonical for provenance, but should not be mistaken for current public Home. |
| Public stand-alone writing trainer | `connection-studio/index.html` | Has a descriptive title and meta description identifying an offline interactive sentence/paragraph trainer. No robots directive or canonical tag. The content was audited in C-CS1–2 and native content tests passed. A canonical could be added if public indexing/discoverability is an explicit priority, but **intent was not established**, so no source change was justified by absence alone. |

Across these routes, **16** self-canonical ordinary public pages plus **two** non-self canonical redirect/archived sources were found. **Nine** intentionally noindexed routes (three legacy/print + five editor/experiment + one archived preview) are distinct from **17** nominally indexable HTML routes, one being Connection Studio. The actual live search-engine index state was **not observed**; robots directives and canonicals are instructions/preferences, not proof of indexing outcomes.

## Cross-page integrity and research status

The main scoping review meta accurately identifies an ERIC-bounded 20-study preprint, with Crossref corroboration in C-RV5/9. The action research meta describes a classroom inquiry, without implying journal publication or a general measured learning gain. Teaching case metadata reflects proposed instructional work and appropriately specific mechanisms. The CV meta identifies qualifications/professional responsibilities without presenting external programme existence as proof of a personal credential. These factual source boundaries remain consistent with C-RV1–15.

## Editorial decision

**No public metadata revision was justified** in this scoped inspection. The current titles and descriptions were meaningfully differentiated, the intentional non-indexing status was coherent, and adding metadata to every page by rule would conflate public content and author-only tools. The historical Home preview's noindex correction and Studio Contact/new-page canonical correction were already completed and must not be repeated.

## Exact next checkpoint

**Stage C-RV17 | Public link and discoverability provenance.** Compare the current `sitemap.xml`, `robots.txt`, main navigation, canonical URLs and published internal links against the **17 nominally indexable routes**, taking care not to publish editor-only pages or archived previews. Determine whether Connection Studio is intentionally a publicly discoverable resource before treating its sitemap absence as a defect. Check any remaining mismatched section names or absolute links and implement only source-grounded editorial metadata corrections. Browser-served-site parity and actual search index status remain separate unverified steps. Preserve all earlier page-level research edits and the original private research-record limitations.

**Status:** C-RV16 complete at static source and metadata-description level for all 26 routes; no unwarranted edits. Full site factual/raw-document/browser verification remains **In progress**.
