# C-RV29cn | Actual A4 print output for the public Osmosis worksheet and academic CV

**Date:** 3 November 2026. **Continued from:** [C-RV29cm](PUBLIC_ENLARGED_TEXT_INTERACTIONS_C-RV29cm_2026-11-03.md). **Result:** Both public HTML pages produced **valid, legible two-page A4 PDFs** in actual Linux Chromium print media. Programmatic text extraction, print-only control visibility checks and independent page-image rendering found no lost source headings, teacher-only notes disclosure, print controls, gross clipping or page transition defect in the inspected outputs. No public website source change was warranted.

## Real production verification and retained evidence

Created `scripts/audit-public-print-documents.py` with workflow `.github/workflows/audit-public-print-documents.yml`. It opens **`https://gmoon-code.github.io/teaching-osmosis-practice.html`** and **`https://gmoon-code.github.io/cv.html`** in headless Playwright Chromium, switches the actual browser to **print media** and generates each PDF using Chromium's `page.pdf()` method with A4 page format, print backgrounds and author-specified CSS page size.

It then opens each generated PDF using **pypdf**, checks page counts, extracts text from *each printed page*, tests the presence of meaningful source headings and content, and checks whether print-hidden controls or teacher-only source material were included. This is independent actual Chromium PDF output, **not a screenshot of screen media** or a claim that every printer produces identical output.

The [GitHub Actions run 41635135248](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41635135248), source commit `1496a91e8f21945b00bc3dddda7a613a320bb6e3`, job `125914303789`, **passed 2/2**, with **zero script-detected failures** and both rendered PDFs retained in [artifact 13229732534](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41635135248/artifacts/13229732534).

## Osmosis student activity

The original public page is an **illustrative dataset**, not a record of measurements actually collected with students. The printed first page includes the title, student activity introduction, **Name / Date** write-in lines, **three sucrose conditions (0, 10 and 20 g per 100 mL)**, initial/final masses and percentage-change formula. All explanatory language remains cautious about observation versus inferred water movement.

The generated PDF has **two A4 pages**. The four inquiry questions remain readable and the preserved `break-inside:avoid` treatment keeps each question text together.

| Printed page | Worksheet elements actually present |
| --- | --- |
| **1** | Data table and student questions **1** (describe measured changes) and **2** (propose mechanism), with handwriting space |
| **2** | Questions **3** (measurement versus inference) and **4** (improve investigation), with handwriting space |

The teacher-note section, including the answers **+8%, −4%, −13%**, is **not included in the student-print PDF**. The print action button, top navigation, breadcrumb and website footer are hidden from print media. These are intentional and confirmed computed-style choices, not omitted scientific questions.

The extracted PDF text contained all four question prompts and all three measured final masses **10.8 g, 9.6 g, 8.7 g**. The actual 2-page PDF was rendered to images at **140 dpi** using the PDF skill renderer, and both printed pages were visually inspected. Lines, table columns, answer spaces and the page break appeared intact and without gross clipping.

## Academic CV

The CV print CSS specifies **A4 with 13 mm top/bottom and 16 mm side margins**, black-and-white print text and distinct section-heading break controls. The PDF output has **two full pages**. It includes the professional identity, both education entries, current research items including the preprint and action research manuscript, current and previous teaching experience, mentorship, extracurricular advising, languages/technical skills and licensure/development items.

- **Page 1** begins with name/contact details and contains Education, Research Interests, Research and the first Professional Experience entry.
- **Page 2** begins with the intended **“Professional Experience, continued”** heading and includes the prior teaching role, mentorship, extracurricular advising, skills and selected professional development.

The `Print / Save as PDF` control, site header/footer and skip-link are absent from the actual printed PDF. The generated PDF was independently rendered into two page images at **140 dpi** and all pages were inspected side by side. Neither an orphaned section heading nor an obvious clipped section or blank page was observed. This is a bounded **visual print check**, not a claim that every individual glyph has been reviewed at maximum resolution.

## Version integrity and limitations

Fetched `teaching-osmosis-practice.html`, `cv.html`, the shared stylesheet and the print probe script at the **exact successful test commit** and at current GitHub main. All **four source blob pairs were byte-identical**. The PDF outputs only contain public website material; no private research originals were used.

A successful print run cannot establish PDF/UA tagging, screen-reader semantics within the generated PDFs, every physical printer's page margins, personally selected OS print settings, or future source changes. It does, however, extend the content audit to the **actual printable versions** promised by those public page controls. No HTML, CSS, manuscript statistics, scholarly citation or author writing was altered.

## Exact next stage

**C-RV29co | Close bounded publication-format checks and reassess remaining independent evidence triggers.** The current HTML route and print representations have passing live-source test evidence, but original student-answer facsimiles, dated transcription history, historical school/participant permissions and final August 20-study S2B/S2C records remain blocked. Check for newly changed author pages or genuinely new primary files before any further rewriting. Continue avoiding source-tier promotion without actual original material and treat native browser zoom, physical-device accessibility and signed editor production publishing as separate verification domains.
