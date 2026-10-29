# Cross-page public website link and metadata audit | 29 October 2026

## Scope and why this check was needed

The GitHub repository now has independently recorded visitor audits of each of the 19 public-facing HTML routes. Those include Home; Research hub, biological classification essay, scoping review and action research; Projects and its two project detail pages; Teaching and its four content detail/resource pages; Interests and Pungmul; Contact; CV; and the 404 and legacy About utility routes. The site-editor and development-tool entry points were explicitly outside this **public visitor-facing source navigation** scope.

The audit was prompted by the need to identify errors spanning more than one previously verified page. Previous responsive, keyboard, print and manuscript checks remained complete. Stage U1 (both utility routes) and CV1 had already been completed in their actual audit files before this continuation; they were verified against their successful historic CI evidence rather than restarted. An initially created redundant utility test and workflow were deleted to preserve the intended single verified U1 implementation.

## Exact-source cross-page implementation

- Added `scripts/audit-public-linkgraph.py` and `.github/workflows/audit-public-linkgraph.yml`, run against the checked-out repository rather than guessed URLs or page titles.
- Scans exactly **19** public HTML files with an HTML parser. For every internal `a[href]`, it resolves relative links against their source page and checks the target file; for fragments, it opens the actual destination and checks the exact target ID. The test also checks internal primary-navigation order and active-page `aria-current`, one main and one H1, duplicate IDs, title, description and expected canonical metadata, local stylesheet/script/image resources, present image alternative-text attributes, accessible link text/aria-label or linked image alt, and new-tab rel advisories.
- The homepage correctly declares the site-root canonical `https://gmoon-code.github.io/`. The printable `teaching-osmosis-practice.html` activity is deliberately noindexed without a canonical. The legacy About URL has its deliberate Contact canonical and meta-refresh; 404 is noindexed without a canonical. These decisions were already vetted and are explicitly treated as intended, not 'missing SEO' defects.
- Applications at `/memory-palace-u1-8/` and `/research-methods/` are separate GitHub Pages project deployments, not missing files in the academic website's source repository. This checker does not mistake those cross-repository live app URLs for local files. Their current HTTP availability remains a separate check.
- Excludes off-site HTTP URLs, mailto and other special schemes from the local-file existence assertion; it does not falsely claim that those URLs have been checked live. Dynamically generated application links and source references inside JavaScript and CSS `url(...)` rules are outside this static HTML graph's coverage.

## Verification and actual findings

- First CI runner was blocked by a test-only mixed-record counting `KeyError: 'kind'`. A subsequent diagnostic pass revealed two further *test-model* errors, resolving fragment-only links like `#main` to the repository directory rather than their containing page, and treating separate published app directories as files missing from this repository. These were corrected in the test. No visitor-facing defect was inferred from the faulty intermediate reports.
- Final verified workflow **[40845056548](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40845056548)**, exact source/test commit `1daf142d023febcf42bc316ac81f6f551d8be667`, returned **success**, with artifact `12884357004`. Repeatable compact report is available at `docs/PUBLIC_LINKGRAPH_LATEST_RESULTS.json`.
- **19** HTML pages, **548** total anchor references and **86** linked local asset references examined. **385** internal links with existing local destinations passed. **163** remaining external or special link references were counted but not asserted reachable, so 548 is *not* a count of independently verified live HTTP endpoints. No confirmed local target failures, broken fragments, missing linked files, duplicate IDs, absent text names, heading count errors, canonical discrepancies or shared-navigation order/current marker inconsistencies remained. No advisories remained.
- This is static source-level consistency. The earlier detailed browser checks separately cover the individual page layouts and most interactive behaviour. No further production HTML or CSS change was justified by these findings.

## Remaining independent site-level work

- Re-run the repository's existing `scripts/external_resource_audit.py` as a fresh, bounded check of outbound HTTP destinations and remote images. Treat rate limits/403, bot blocking, failures to resolve and timeouts as *unverified*, not proven 404s; confirm actual 404/410 with GET where safe. Give special attention to separate app deployment links, publisher identifiers and other high-value visitor exits. Preserve prior publisher audits and do not rework research prose solely for a transient network error.
- Existing browser, axe and screenshot workflows offer further optional regression coverage if shared assets or layout scripts change. Screen-reader spoken-output testing, Firefox/Safari, physical touch and long-term uptime remain separately qualified.

**Stage S1 complete. Exact next bounded continuation is a current outbound-link and embedded-remote-image availability check, Stage S2.** Do not restart completed page-by-page, utility-route, CV or editor audits without a specific regression.
