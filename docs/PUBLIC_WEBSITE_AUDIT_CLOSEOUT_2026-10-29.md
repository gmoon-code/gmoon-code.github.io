# Academic website comprehensive audit | Automated public-site closeout | 29 October 2026

## Completion statement

**The automated public portfolio website audit is complete for the explicitly bounded surface: 19 HTML routes on `gmoon-code.github.io`, comprising 18 directly readable pages and the legacy About redirect.** The source and deployed pages agree byte for byte in the final independent release check. All scheduled stage-specific testing for this surface has passed at its recorded source revision. This closeout is **not** a declaration of full WCAG certification or completion of real hardware/assistive-technology tests. Individually deployed applications linked from the portfolio were checked for external reachability and parent iframe control behaviour, but their internal application functionality is not part of this 19-route portfolio closeout.

Final evidence is `docs/PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json`, the full `s8-final-public-release-evidence` workflow artifact **12899226828**, and the successful [S8 GitHub Actions run 40878439734](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40878439734). The audited exact checkout source was `3e4f789f0bf6a99390240f1124f5750429abd7d9`. Later **documentation/report-only commits do not alter the public-facing source**, and the S8 runner explicitly compared the previous source audit reports to the current visitor-facing files.

## Final release reconciliation

- **19/19 publicly deployed HTML routes exactly matched repository files byte for byte**: `index.html`, `research.html`, `research-action.html`, `research-scoping.html`, `writing-biological-classification.html`, `projects.html`, `story-method.html`, `research-methods-studio.html`, `teaching.html`, `teaching-ap-biology.html`, `teaching-ap-chemistry.html`, `teaching-ap-evolution.html`, `teaching-osmosis-practice.html`, `interests.html`, `pungmul.html`, `contact.html`, `cv.html`, `404.html`, and `about.html`.
- **5/5 core shared public assets matched exactly**: `styles-20261013.css`, `site-theme.css`, `appearance.css`, `appearance.js`, and `site-previews.js`. Each live file returned HTTP 200. Full local-vs-live SHA-256 comparisons are preserved in `s8-release-output/source-deployment-detail.json` in the workflow artifact.
- The independent live nested missing route `/missing/s8-release-reconciliation-3e4f789f0bf6` returned **HTTP 404**, with the intended **Page not found** and **Return home** copy. The separately completed U1 browser test had already confirmed that `about.html` uses a valid automatic HTML meta-refresh to `contact.html`, and that the alternate Contact link works when refresh is suppressed in a controlled test.
- No differences or request failures occurred in the 24 deployed source/asset comparisons. The final S8 workflow returned code 0 and was marked success.
- **Source-drift safeguards:** `git diff` between each successful cross-stage run's source SHA and the S8 checkout found **no subsequent edits to any of the 19 public HTML files or five shared assets**. Therefore the previously verified S1–S7 results remain applicable to the publicly released source.

## Completed stage and page coverage

| Audit area | Exact evidence | Final status |
|---|---|---|
| Individual public visitor route reviews | `docs/EDITORIAL_PAGE_AUDIT.md` and route-specific editorial/visual audit reports | All 19 HTML routes included; previous route-specific issues resolved or qualified in their reports |
| Internal links and bundled assets, S1 | `docs/PUBLIC_LINKGRAPH_LATEST_RESULTS.json`, run **40872270732** | 19 pages, 548 anchors, 385 internal destinations, 163 external/special, 86 bundled-asset references; **zero reported internal link problems** |
| External references and standalone application destinations, S2 | `docs/EXTERNAL_RESOURCES_LATEST_RESULTS.json`, run **40872270701** | 113 distinct external destinations; **71 reachable and 42 inconclusive**. The three separate-site application destinations responded successfully. No unverified external link is silently counted as reachable or as broken |
| Scholarly bibliographic metadata, S3 | `docs/RESEARCH_METADATA_LATEST_RESULTS.json`, run **40872270669** | 59 unique DOIs and 67 citation occurrences; 65 full bibliography entries consistent, 2 narrative/inline citations outside full-entry matching; **zero unresolved scholarly metadata cases in the recorded report** |
| Public reflow and automated axe, S4 | `docs/ACCESSIBILITY_REFLOW_LATEST_RESULTS.json`, run **40872270878** | 18 readable pages × 320/640/1280 CSS widths, 54 passing reflow cases, with automated light/dark scans; **zero test failures** |
| Cross-browser keyboard focus and forced-colour simulation, S5 | `docs/PUBLIC_BROWSER_ENGINES_LATEST_RESULTS.json`, run **40872270839** | Chromium, Firefox and WebKit; 108/108 regular cases, 18/18 selected forced-colour cases; **zero test failures** |
| User text spacing/enlargement and combined stress, S6/S6b | `docs/PUBLIC_TYPOGRAPHY_LATEST_RESULTS.json`, run **40872270816** | **111/111 passing**, including 92 independent text-preference cases and 19 extra combined stress cases. Narrow Action Research bar-chart overflow resolved without concealing scientific data |
| Public semantics and live interaction states, S7 | `docs/PUBLIC_INTERACTIONS_LATEST_RESULTS.json`, run **40875089499** | 18 page scans; 18 appearance-select tests; 4 expanded-disclosure checks; 2 opt-in preview control checks; 2 print-button checks; **zero failed cases and zero detected axe violations** |
| Final actual deployment and source provenance, S8 | `docs/PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json`, run **40878439734** | **19/19 live HTML files and 5/5 assets identical to repository source**, no drift from the audited public source, custom nested 404 confirmed |

Separate detailed Research, Teaching, Projects, Interests, Pungmul, Contact, CV, Home, and utility route reports document their individual academic-editorial, proofing, dark-mode, responsive, keyboard and A4 print checks. The master `docs/EDITORIAL_PAGE_AUDIT.md` preserves the audit history and exact continuation decisions. No previous completed stage is reopened merely to obtain a later timestamp.

## Material qualifications and unverified scope

### External publisher access is inconclusive, not a confirmed website defect

The latest S2 scan examined **113 distinct external destinations**. **71 were reachable**. **42 could not be verified from the testing network**, comprising **41 scholarly identifier links** and **one Wiley publisher article page**. The recorded samples include publisher HTTP 403 responses after DOI redirects. A 403 from a publisher against a headless audit is not evidence that the DOI is wrong; bibliographic metadata was independently checked in S3. Nevertheless, **the real landing pages of those 42 external destinations remain unconfirmed**. Avoid phrases like “every external link works.” A later ordinary-browser check of these publisher destinations would improve evidence.

### Physical/device and accessibility-manual limits

The tests did **not** operate native browser chrome Ctrl+plus zoom or a real user stylesheet and cannot replicate physical iOS Safari, macOS Safari, Windows high-contrast colours, Android TalkBack, macOS VoiceOver, NVDA or JAWS spoken output, dynamic OS font scaling, or touch-screen gesture/keyboard behaviour. Responsive CSS viewport and Playwright user-style simulations are relevant reproducible evidence but **do not certify physical-device functionality or WCAG 2.2 conformance**. Reader interaction inside the two separately deployed student applications was not audited as part of the parent portfolio site.

### Previously stale utility machine record

`docs/UTILITY_ROUTES_LATEST_RESULTS.json` is a **legacy result from failed early run 40844468852**, whose tested script was absent. Do not cite its `exit_code=2` as the latest route outcome. The source-of-truth utility audit `docs/UTILITY_ROUTES_VISITOR_REAUDIT_2026-10-29.md` instead documents [successful run **40825886279**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40825886279). The CI job's success was also independently rechecked during S8. The earlier machine record remains intact as historical evidence rather than silently overwritten. S8's independently successful live 404 probe and exact-match `about.html`/404 source files supplement that prior review.

### Time and change boundaries

The repository and live-host comparison reflects a particular release state on **29 October 2026**. Any future visitor-facing edit to HTML/CSS/JS must re-run the relevant current-source tests and live deployment comparison. A source update after this report does not inherit this sign-off automatically. GitHub Actions workflow files and audit reports can change without changing the released visitor surface, but their changes should still be reviewed if they affect CI reliability or result integrity.

## Final release outcome and future continuation

**Automated public-website visitor audit: COMPLETE WITH DOCUMENTED QUALIFICATIONS.**

At final S8 verification, **no confirmed outstanding internal-link, scholarly metadata, accessible control, page geometry, cross-engine keyboard/forced-colour, text-preference, or deployed-source mismatch was recorded on the 19-route public portfolio surface**. The remaining 42 publisher-link checks are **inconclusive**, not cleared or called broken. Manual physical-device/assistive-technology tests and separate app internal audits are outside the completed automated scope.

The next continuation, if requested, should be a **separate manual accessibility testing checklist and genuine-device validation**, or a **focused publisher-link ordinary-browser verification**, not another restart of the 19-page editorial audit. Retain all evidence and the audit ledger, and reopen a stage only for an actual regression, source change, or newly reported visitor-facing defect.
