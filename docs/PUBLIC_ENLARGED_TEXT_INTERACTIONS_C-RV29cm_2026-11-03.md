# C-RV29cm | Live enlarged-text disclosures and keyboard interactions

**Date:** 3 November 2026. **Continued from:** [C-RV29cl](PUBLIC_TEXT_ENLARGEMENT_STRESS_C-RV29cl_2026-11-03.md). **Outcome:** **12 of 12 real public Chromium page-width cases passed**, with **zero probe failures**, while scholarly details were open and visible body text was artificially doubled in size. Skip-link focus, Home navigation and mobile instructional-table keyboard access also passed. This is still a **simulated CSS text-size stress test**, not native browser zoom or screen-reader certification.

## Method and actual production run

Created `scripts/audit-public-text-interactions.py` and `.github/workflows/audit-public-text-interactions.yml`. The script reuses the earlier live public academic text-enlargement probe's CSS sizing and DOM metrics. It opens **four relevant `main details` panels before scaling visible text** to ensure their revealed body paragraphs are enlarged too, then tests close/reopen interaction and post-expansion reading bounds. Two other pages have scientific tables that require intentional keyboard-accessible horizontal scrolling. All pages are served directly from the real `https://gmoon-code.github.io` origin.

Successful [GitHub Actions run 41634062813](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41634062813), source revision `b1ca7d796c916c057c6308fa283eed7eb5e1f535`, job `125910644434`, reported **12 total / 12 pass / 0 failure**. Retained JSON metrics and eight cropped viewport screenshots at [artifact 13229846652](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41634062813/artifacts/13229846652).

## Page- and interaction-level results

| Actual academic route | Widths | Enlarged-text interaction evidence |
| --- | --- | --- |
| `research-scoping.html` | 390, 1280 | “Sources mentioned on this page” opened before text scaling, closed and reopened after scaling; source-list text remained within tested page bounds |
| `research-methods-studio.html` | 390, 1280 | “Guidance releases, validation, and recovery” panel opened, closed and reopened with doubled body text |
| `teaching-osmosis-practice.html` | 390, 1280 | Teacher explanation/follow-up disclosure opened, closed and reopened, with the revealed numerical teaching notes inspected |
| `story-method.html` | 390, 1280 | Release-checking disclosure opened, closed and reopened while the enlarged body remained available |
| `teaching-ap-chemistry.html` | 390, 1280 | Both labelled curricular tables remained keyboard-focusable; at 390 each container measured **780 scrollWidth / 340 clientWidth**, with **ArrowRight 0→40 px** and a visible sideways-scroll instruction |
| `teaching-ap-evolution.html` | 390, 1280 | Both proposed/hypothetical tables showed the same accessible named scrolling behaviour at 390 |

On **all twelve cases**, the `a.skip-link` keyboard Enter path produced `#main` with **main element actually focused**, and focusing the actual Home navigation anchor followed by pressing Enter reached `/index.html`. This verifies selected keyboard **activation**, not a comprehensive fresh-Tab focus order.

On desktop at **1280 CSS px**, the four instructional tables had **1120 scrollWidth / 1120 clientWidth** and therefore did **not** require horizontal scrolling. Their mobile-only sideways-scrolling hints were correctly hidden. The test does not misclassify that difference as inaccessible content.

## Visual and scope findings

Inspected the retained eight 390-px viewport screenshots in a contact sheet. They show actual opened scholarly/teacher/release panels and horizontally scrollable scientific columns after selected keyboard operations. The instructional table viewport intentionally reveals only a subset of columns with the labelled region offering access to the remainder. No gross text overlap or obscured disclosure summary was apparent in the sampled screenshots; the automated scaled document width also stayed within each viewport.

**No site fixes were justified.** Some very long headings already show midword wrapping in the separate C-RV29cl synthetic-size screenshots. A partial screenshot and numerical DOM bounds cannot rule out every potential glyph-level collision or all other browser zoom modes.

The test deliberately does **not** use personal credentials, edit any student progress, publish a draft, change a file in the site, read confidential participant records, or claim a screen-reader audit. Each of **eight exact source blobs** (the six HTML pages plus both text-enlargement/test scripts) at the tested run revision was re-fetched and matched the current default branch exactly (**8/8**).

## Next exact checkpoint

**C-RV29cn | Print/readability proof for the Osmosis teaching worksheet and CV.** The academic site's printable materials contain a purposefully styled worksheet and a CV print option. Independently inspect their **real public** Chromium print-media layout and actual output pagination without publishing changes. Treat the print document as a separate reading representation. Verify page breaks, source/citation visibility, printable questions and any print-only controls. Keep native browser zoom, assistive technology and original research-record authenticity separately unresolved.
