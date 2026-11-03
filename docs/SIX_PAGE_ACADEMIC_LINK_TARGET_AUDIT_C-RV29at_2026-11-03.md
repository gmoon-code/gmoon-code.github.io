# C-RV29at | Academic cross-page links, fragment targets and referenced static-file presence

**Date:** 3 November 2026. **Continues from:** [C-RV29as](RESEARCH_ACTION_CROSSPAGE_RECONCILIATION_C-RV29as_2026-11-03.md). **Status:** All local links and fragment targets inspected in the six then-current pages point to existing repository resources or valid document anchor IDs. Research-specific link labels were reviewed against actual target headings. **No source change required.** Browser-delivered availability and externally hosted material remain outside this source-level verification.

## Documents and current blob baselines

This verification used the full current GitHub default-branch UTF-8 sources:

| Source | SHA |
| --- | --- |
| `research-action.html` | `80277bba0aa0ad715be87865e5a30e609b419147` |
| `research.html` | `f083527f1cc0f8d60587133333b15ccc0d994237` |
| `index.html` | `bbc4cac2ddc7ce3b719b59d31529228f3cb6ba46` |
| `cv.html` | `601707af9ca4fb7d4746c6d1d2525bdf3f081a74` |
| `projects.html` | `f3f90cd7c64bf780bd486e42b3544a9b94adf348` |
| `teaching-ap-biology.html` | `a28fe352109ad12508f0ad481e6aba32455d5739` |

No race with a known concurrent revision was observed during this check, and current stage made no writes to any of these pages.

## What was actually verified

Parsed all `href` attributes in the six HTML sources and separated relative local paths, same-document hash links, cross-document fragment links, absolute project/deployment links, canonical/self-site links and third-party academic links.

- Found **97 local relative href occurrences**, resolving to **20 distinct relative resource paths**. These include HTML page routes, stylesheets and three referenced WebP figure/screenshots. All **20/20 paths** were fetched successfully through the user's connected GitHub repository at the listed paths, with a returned actual blob SHA. Used base64 binary probe for WebP assets instead of pretending they were UTF-8.
- Found **88 same-document hash-link occurrences** across these six pages (Action Research 6; Research 62; Home 3; CV 2; Projects 2; AP Biology teaching 13). Every referenced fragment was present in its own source as an exact existing ID, **88/88**. This is source-level anchor integrity, not a statement about JavaScript scrolling.
- Found **6 cross-document fragment occurrences**, and fetched their actual target documents to verify **6/6 unique matching target IDs**, with no missing or duplicate target ID for any of the six links:
  - Action Research `teaching-ap-biology.html#bio-mechanism` targets the inhibition/pathway section.
  - Action Research `teaching-ap-biology.html#bio-sequence` targets **Proposed follow-up teaching sequence**, which is explicitly future design and not historical classroom delivery.
  - Research `research-scoping.html#case-study` targets the review's included-case discussion.
  - Research `research-action.html#paired-evidence` targets the action-study paired-response analysis.
  - Home `research.html#curriculum-decisions` targets the Research hub's disciplinary/curricular decision discussion.
  - AP Biology teaching `research-action.html#paired-evidence` targets the paired evidence analysis.
- Re-examined page-context link labels from the research cards, CV entry, homepage paired case, scoping source example, and pedagogical project cards. Their cited destinations have appropriate content rather than redirecting to an unrelated general landing page. The CV's **“Research overview and evidence”** label links directly to the relevant detailed action-study page, a reasonable contextual choice.
- Repository-local paths also correctly include `contact.html`, `interests.html`, `writing-biological-classification.html`, `story-method.html`, `research-methods-studio.html`, `research-scoping.html`, `teaching.html`, four stylesheets, the research figure and two project interface images. All are **present in the Git source**, not evidence that their delivered bytes were independently observed.

## External and first-party absolute URLs

The six pages contain **82 `https://` href occurrences**. Among them are **8 URLs** under `gmoon-code.github.io`, covering the six current page canonical URLs plus two separate published learning-app entry points, `/memory-palace-u1-8/?unit=unit-1` and `/research-methods/`. The remaining **74 URLs** point to external domains, including DOI and PubMed references, ORCID, university and image-licence sources.

The presence, well-formed link syntax, and contextual label of those URLs in source code were inspected. **Do not treat these 82 links as all live-tested.** In particular, the two separate first-party applications and third-party destinations were **not** accessed in a rendered browser in this stage. The 53-reference Research overview has earlier independent literature/source coverage in its own audit ledger; this route check does not purport to redo that scholarly warrant inspection or upgrade previously restricted full texts.

## Scientific and editorial interpretation

No scholarly content label sends the reader to a plainly wrong section or appears to change the epistemic status of evidence. The Action Research page's invitation to explore the teaching sequence lands on the **clearly labelled proposed** section, as intended. Research's S20 case leads to the paired-response section, while the review's separate included-case reference leads to the scoping case study. Separating these routes preserves the boundary between reported classroom records, an initial ERIC-based literature synthesis and prospective instructional design.

**Decision:** No public code or prose edit. Preserve all previously verified wording and citations. This report verifies **static target existence and fragment semantics**, **not** successful public CDN delivery, dynamic browser navigation, content freshness of separate project applications, external DOI resolution on 3 November 2026, protected source text access or approval from ethics authorities. Do not represent it as a deployed browser audit.

## Exact next checkpoint

**C-RV29au | Current 26-route audit map and genuinely remaining content coverage.** Read the living 26-route content inventory, latest current reports and main site navigation/manifest. Reconcile every public academic route with an evidence tier and the newest audit stage. Identify the **next truly unaudited or recently modified visitor-facing content**, avoiding repetition of sections already checked in C-RV29ai/as/at. Prioritize factual accuracy and the author's restrained scholarly voice, and separate **source-level editorial completeness** from **source provenance**, source-restricted articles, final-August scoping matrix, permission/consent and browser parity. If no novel content route exists, state that explicitly and focus instead on high-value verifiable unresolved discrepancies. Do not fabricate a new audit task to create activity or promote the website to Fully verified without its blockers being resolved.
