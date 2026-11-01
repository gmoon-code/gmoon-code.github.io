# Stage C-RV17 | Public sitemap, canonical references and navigation content

Date **2 November 2026**. Continued from [C-RV16](PUBLIC_SOURCE_METADATA_AUDIT_C-RV16_2026-11-02.md).

## Actual source coverage

Fetched the live **repository sources** of `sitemap.xml`, `robots.txt`, `studio/navigation.json`, the 16 public pages listed in the sitemap, plus `projects.html`, `research-methods-studio.html` and `connection-studio/index.html`. Compared public navigation labels and destinations against the canonical route, with an explicit distinction between indexable academic pages and a separate public writing-trainer application.

The sitemap contains **16 unique URLs**, exactly matching the 16 self-canonical academic pages inventoried in C-RV16: Home (canonical site root), Contact, CV, Interests, Projects, Pungmul, Research, Scoping Review, Classroom Action Research, Research Methods Studio, Story Method, Teaching, AP Biology teaching case, AP Chemistry, AP Evolution and independent classification essay. All sixteen route source documents fetched from the repository.

The published primary navigation on **all 16 listed academic pages** contains the same **seven items in the same order and with the same labels**: Home, Research, Projects, Teaching, Interests, Contact and CV. These align with the corrected owner-facing Studio navigation from C-RV14. All 16 sitemap URLs match the page's own canonical URL, and none of the listed pages declares `noindex`. Their in-page fragment destinations resolved on source inspection.

The website's `robots.txt` allows crawling and links to the same sitemap. This is a crawl instruction, not proof of search-engine indexing.

## Two apparent errors rejected after closer source review

A naive ID-count regex flagged repeated UUID-like identifiers on `index.html` and `contact.html`, but the hits occurred in generated CSS selectors and non-element metadata. Rechecked actual HTML element tags after excluding `<style>` and `<script>`; **neither page has duplicate real element IDs**. No text or HTML change is justified by the naive scan.

The standalone `connection-studio/index.html` has no canonical and no `noindex`, yet it is not in the 16-item sitemap and is not promoted from the main Projects page or Research Methods Studio overview. The app is a separately accessible tool, and a source-only audit cannot infer whether the author intends broad public indexing. **No sitemap entry or canonical was added without confirmed publication intent.** This remains a discovered owner-controlled decision, not a demonstrated scientific-content defect.

## Existing native audit and live-page boundary

The earlier [public linkgraph report](PUBLIC_LINKGRAPH_LATEST_RESULTS.json) documented 19 ordinary/legacy pages, **554 links**, **93 asset references**, and zero reported problems or advisories on head commit `bd6c5dee` in [native run 41358594528](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41358594528). That earlier result remains valid for its tested commit only; it is not a claim that post-stage current source has been rerun in a native browser.

A [GitHub Pages deployment](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41361065859) succeeded for the C-RV15 ledger commit, establishing a deployment workflow outcome. Direct web requests to the public `cv.html`, `research-scoping.html`, and `contact.html` addresses were inaccessible through the available web retrieval tool. The failure was a tool-access limitation; it does not prove public-page downtime, nor does build success establish byte-level parity of deployed content.

## Editorial decision

No public narrative, reference title or link text was changed. The 16 sitemap destinations and seven navigation labels are internally consistent and correctly distinguish existing academic sections. Changing either to manufacture audit activity would risk introducing a genuine route inconsistency.

## Exact next checkpoint

**Stage C-RV18 | Project-page tool descriptions, owner-facing source listings and externally deployed destinations.** Re-check `projects.html`, `research-methods-studio.html` and `story-method.html` against actual linked application repositories, especially completed versus proposed educational workflows and claims of saved data or active deployment. Inspect the public Connection Studio status and determine only what source evidence supports. Check owner-facing authoring summaries for stale programme names. Correct only verifiable content inaccuracies, execute source/CI regression where relevant and update the master ledger. Keep actual live visitor parity, private empirical/consent records, preferred public email and known Editor V2 browser failures as separate unresolved tracks.

**Status:** C-RV17 static public sitemap and navigation source consistency confirmed for all sixteen pages; no warranted edits; public served-byte parity and author indexing preference unverified. Comprehensive audit remains **In progress**.
