# Stage C-RV17 | Sitemap, main navigation and canonical link source reconciliation

Date **2 November 2026**. Continued from [C-RV16](PUBLIC_SOURCE_METADATA_AUDIT_C-RV16_2026-11-02.md).

## Direct source reviewed

Read the current `sitemap.xml` (blob `a053a32afe577c644c267ac7a66ba34d09f19a08`), `robots.txt`, `index.html`, `projects.html`, and `connection-studio/index.html`. Parsed the **16** public URLs in the sitemap. Retrieved and compared each of the **16 exact corresponding HTML sources** against its sitemap entry, canonical `<link>`, robots indexing policy, visible Contact navigation and absence of an outdated About destination. This was real repository source inspection, not an inference from an older audit report.

## Verified public sitemap and main navigation

- All **16 of 16** sitemap URLs resolve to **16 existing repository source files**, with Home represented as the site root canonical `https://gmoon-code.github.io/`.
- **16/16** have exactly the expected self-canonical URL.
- **16/16** do **not** include `noindex`, preserving normal public discovery intent.
- **16/16** contain the published `contact.html` navigation destination and do not use the old `about.html` navigation link.
- `robots.txt` provides `Allow: /` and references the same sitemap URL. Thus the documented indexed public pages are coherent at the source level.
- The old About route, the 404 recovery page and the illustrative osmosis worksheet remain separately flagged `noindex`, as detailed in C-RV16. Those pages should not be inserted merely to inflate route counts.

## Connection Studio discoverability

The standalone `connection-studio/index.html` is reachable by its repository path, has its own nonempty descriptive metadata and no noindex restriction, but it has **no explicit canonical** and is absent from `sitemap.xml`. Neither the current public Home nor Projects page links to this trainer. This is a real **discoverability-policy question**, not proof of a broken link or a user request to advertise the tool. The separate Connection Studio teaching content was editorially audited in C-CS1–2 and its native Node content bank tests passed.

Do not add it automatically to the sitemap or promote it through the academic Home without clear evidence that it is meant to be a public, indexed resource. Similarly, do not hide it as though it contained private material solely because it was absent from the current navigation.

## Editorial decision and limits

**No justified public text or sitemap modification** was established. The audited URLs and canonical labels already agree and the legacy routes are consistently excluded. These checks concern **source text and website discoverability declarations**, not independent proof that GitHub Pages served exactly those bytes, that Google indexed every allowed page, or that no browser redirects or caches interfere with the live visitor path.

## Exact next checkpoint

**Stage C-RV18 | Remaining page-level original-source uncertainty and application content.** Reconcile the source-level completion statuses from the comprehensive 19-page audit, the seven supplemental tool routes and C-RV1–17 against still-unverified primary claims, linked external research and personal evidence. Identify specific genuinely unaudited writing surfaces, research attachments, or retained editorial risks rather than repeating completed source checks. The preferred public contact email and Connection Studio public-indexing decision require author intent if changes are contemplated. Preserve the recorded unresolved Editor V2 browser test failures separately.

**Status:** C-RV17 verified 16/16 public sitemap/canonical and navigation source targets, no correction warranted. Overall site factual and browser verification remains **In progress**.
