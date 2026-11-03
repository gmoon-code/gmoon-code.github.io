# C-RV29bv | Public Pungmul, Research Methods Studio and genuine 404 reader evidence

**Date** 3 November 2026. **Continued from** C-RV29bu. **Scope** `pungmul.html`, `research-methods-studio.html` and `404.html`, and a deliberately missing nested public URL. Independent deployed-browser testing, original HTML source comparison, selected screenshot inspection and explicit verification limits were used.

## Real public HTTPS and Chromium verification

The source-only probe `scripts/audit-public-research-reader.py` checked each current repository `main` text against independently requested GitHub Pages HTML. For each route it visited **390 px** and **1280 px** viewport variants in headless Linux Chromium, checked primary structure, stylesheets, in-page anchors, reader text bounds, on-page imagery and the skip-link action. It separately clicked Interests → Pungmul and Projects → Research Methods Studio links.

An earlier complete browser run [41611815088](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611815088) had **3/3** source-text checks, **6/6** browser page-width cases and **2/2** live hub links passed. A subsequent, independently successful [run 41611872141](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611872141), job `125835509489`, repeated those passes and added an actual missing-nested-route check.

The decisive nested test requested `https://gmoon-code.github.io/missing/c-rv29bv-unmatched-reader-route`. Chromium received **HTTP 404**, read main heading **“Page not found”**, found a Home recovery link, clicked it and arrived at `https://gmoon-code.github.io/`. Opening `404.html` directly returns **HTTP 200**, as expected for a valid static document. The two outcomes are separately recorded rather than conflated.

Artifact [13218668554](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41611872141/artifacts/13218668554) retains `report.json` and six full-page screenshots.

## Pungmul imagery and Research Methods Studio

The live Pungmul page contained **five separately loaded images** with authentic local asset paths and distinct natural sizes

- `pungmul-rehearsal-studio.webp`, 1280 × 720
- `pungmul-ensemble-stage-photo.webp`, 1400 × 1050
- `pungmul-outdoor-autumn.webp`, 1100 × 619
- `pungmul-portrait-janggu.webp`, 1400 × 929
- `pungmul-gong-jump.webp`, 1400 × 1037

All five loaded and were visibly present at both tested widths. They were intentionally different frames, not duplicated placeholders. The downloaded screenshots were inspected in top, middle and bottom regions for **Pungmul**, **Research Methods Studio** and the **404** document at each viewport. The layout visibly uses rounded Pungmul image corners and a stacked reading flow on mobile. No gross overlap, missing image or clipped heading was identified in those sampled regions. This is **bounded visual spot-checking**, not an exhaustive pixel-level design review.

The Research Methods Studio page delivered its one local illustration, `research-methods-data-lab.webp`, at natural **1280 × 800** dimensions and opened the disclosure **“Guidance releases, validation, and recovery”** in both responsive browser runs. Its account of methodological decisions remains on the authored academic website; the separate Research Methods Studio application, any saved user data, and its full runtime were **not** exercised by these reader tests. Similarly, no external application state was altered.

The 404 page's direct document rendered the expected short recovery message. Its real error response and Home recovery were checked independently, as above.

## Exact source integrity

Re-fetched the three HTML sources and test script at the successful run's tested commit `a11b90e6` and at current default-branch HEAD. All **four exact Git blob SHA pairs** matched

| File | Git blob |
| --- | --- |
| `pungmul.html` | `8caa993edac9304e6d1c9829b3084680b4ede135` |
| `research-methods-studio.html` | `d77c8d4eb1222cb57f3cf88b41eebde09d4e6c03` |
| `404.html` | `361512d3e77f05f36d2701d1201561b039469df8` |
| `scripts/audit-public-research-reader.py` | `cd36d1a0c2a5919f4fdfafcbc59fcd8f7c77e5fe` |

**No academic source text, media, style or application code was changed.**

## Limits

The latest stages C-RV29bs, C-RV29bt, C-RV29bu and C-RV29bv now cover **17 distinct academic content routes plus the custom 404 page** through actual production-browser text/layout checks. Those verified page samples do not demonstrate rendered-browser parity for all remaining supplementary editor/studio routes, physical mobile devices, browser zoom, WCAG conformance, human screen-reader speech or comprehensive external app workflows.

The 53-entry Research bibliography source-tier register, original student-response facsimiles, dated school authorization/consent/assent records and final 20-row August scoping matrix have separate unresolved evidentiary limits. Browser passes cannot validate those claims.

## Exact next checkpoint

**C-RV29bw | Remaining supplementary editor and Studio routes.** Compare remaining public pages and app entry points against the prior 26-route repository inventory. Exclude redirect-only legacy paths from full academic-copy verification when appropriate, but check their actual public navigation, document statuses and reader visibility. Distinguish private-authoring workflow verification from read-only visitor accessibility. Identify any stale status statements in the master audit checkpoint before editing documentation.
