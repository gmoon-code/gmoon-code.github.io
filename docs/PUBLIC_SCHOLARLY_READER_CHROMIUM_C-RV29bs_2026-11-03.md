# C-RV29bs | Live public-reader Chromium verification extended to three scholarly routes

**Date** 3 November 2026. **Continued from** C-RV29br. **Pages and source versions** `research-scoping.html` (`cf0eaaa192876264d47f57ea9b30ffec36e84ebb`), `writing-biological-classification.html` (`3dc0d45bfc2ac3257eb3e079bb28f36c107e3094`), and `teaching-ap-biology.html` (`a28fe352109ad12508f0ad481e6aba32455d5739`). Existing Research and Action Research pages were rechecked too.

## Read-only production verification method

Extended `scripts/audit-public-research-reader.py` to fetch **five** academically substantive, currently deployed HTTPS routes, compare normalized static `main` text from the repository with served HTML, then open the actual public origin through headless Playwright Chromium at **390 px** and **1280 px**. Checked visible headings, main landmarks and expected navigation, stylesheet attachment, whole-page horizontal overflow, selected reader text bounds, in-page anchor targets, source image natural dimensions, keyboard skip-link focus and local page scripts. On the Scoping Review page, opened the **one in-main `details` disclosure**, “Sources mentioned on this page,” in both viewport cases, and checked its open state. Separately clicked four true public hub links from Research or Teaching to their actual destinations.

The workflow is `.github/workflows/audit-public-research-reader.yml` and runs the current script without editing production HTML. A fresh [GitHub Actions run 41609393314](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41609393314) at source commit `f8b89fb7a69ac4332a7850818cf5ff490f7b0f85` **completed successfully**. Its decoded log records **5/5 public-source text matches**, **10/10 Chromium page/width checks without flagged errors**, **4/4 clicked public navigation routes**, and **zero failures**. The run uploaded [artifact 13218182216](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41609393314/artifacts/13218182216) containing the report JSON and all **ten** full-page screenshots.

## Page-specific observations

| Public route | Browser 390 / 1280 | Main text delivered | Asset and interaction evidence |
| --- | --- | --- | --- |
| Research overview | Pass / Pass | Source match | Figure `gonzalez-howard-2023-figure-1.webp` loaded at natural width **1087 px** |
| Classroom Action Research | Pass / Pass | Source match | In-page citations, anchors and headings passed the bounded checks |
| Scoping Review | Pass / Pass | Source match | **One** source-list `details` opened at both widths; source paragraphs and tables remained within tested page bounds |
| Biological Classification essay | Pass / Pass | Source match | Citation links, in-page references, page reading and headings passed |
| AP Biology teaching case | Pass / Pass | Source match | Wikimedia-hosted chloroplast electron micrograph loaded at natural width **680 px** on both viewports |

The successfully followed deployed links were Research → Classroom Action Research, Research → Scoping Review, Research → Biological Classification essay and Teaching → AP Biology.

## Additional bounded visual inspection of retained evidence

Downloaded the generated screenshots from the actual workflow artifact, extracted its JSON and PNG files and inspected representative **top, middle and bottom crops** of the three newly tested pages at **both mobile and desktop widths**. All six contact sheets visibly rendered the expected titles and sections with legible paragraphs and expected reading columns or stacked cards. No obvious gross overlapping text, cropped heading or missing image was observed in those **sampled regions**. This is a bounded visual spot-check rather than pixel-difference comparison, complete image-by-image exhaustive review or a review of every scroll position.

The source-bounds statement is strictly tied to the checker’s selected reader elements, which include headings and paragraph-like elements; it does not prove that every possible UI component avoids overlap. Full-page screenshot artifacts are retained for further examination. The run did not check physical devices, reduced-vision zoom, screen-reader speech, accessibility standards certification or arbitrary JavaScript interaction.

## Source-revision integrity

Fetched each of the five academic HTML blobs and the probe script from its **exact tested Git commit** and again from the current default branch. All **6/6 blob pairs matched exactly**, preserving the tested-source applicability after subsequent audit-document changes. No public website HTML, CSS, JavaScript, scientific claim, chart, attribution or citation was changed in this stage.

## Broader audit boundaries

Historic 19 academic pages plus seven supplementary routes have content-stage inventory records. This stage **does not** upgrade original research/ethics evidence or claim a site-wide rendered-browser audit. Signed school/participant authorization originals, authenticated student response facsimiles, separate rater adjudication documentation, the 20-row final August scoping matrix, restricted scholarship originals and direct physical-device/assistive-technology evaluation remain unresolved.

## Exact next stage

**C-RV29bt | Public teaching and projects reader verification.** Extend the real HTTPS browser check to `teaching-ap-chemistry.html`, `teaching-ap-evolution.html`, `teaching-osmosis-practice.html`, `projects.html` and `story-method.html` at 390/1280 px, including route-relevant in-page navigation, images, interactive elements and source parity. Keep any detected failures separate from genuinely unverified scholarly findings and retain the existing successful C-RV29bs run as historical independent evidence.
