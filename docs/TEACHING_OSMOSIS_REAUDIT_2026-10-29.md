# Osmosis practice visitor-facing re-audit | 29 October 2026

Route: `teaching-osmosis-practice.html`. Stage T5 continues the T1 Teaching hub, T2 photosynthesis, T3 AP Chemistry and T4 Evolution page audits. This resource has `noindex, follow` set. No change to that indexing intent was made.

## T5.1 | Scientific and editorial audit

- Re-read the entire page, source, three-row table, four question prompts and the teacher notes. Three potato cylinders each start at 10.0 g, with 30-minute masses 10.8, 9.6 and 8.7 g after 0, 10 and 20 g of sucrose per 100 mL final solution. Independently calculated the mass changes as **+0.8, −0.4, −1.3 g** and percentages as **+8%, −4%, −13%**. The teacher notes state these correctly; a reproducible test now computes them, not by copying the expected prose.
- The scenario explicitly identifies data as hypothetical. It measures only whole-cylinder mass changes, not actual transmembrane water transport, intracellular pressure or a directly established isotonic point. The question progression is accurate and purposeful: observations/calculations, a water-potential mechanism, limits of what weighing establishes, and methodological refinements. No new learning-effect or conducted-laboratory claim appears.
- The teacher notes appropriately distinguish observed mass changes from osmotic interpretation and note limitations of blotting, potato source, dimensions, one replicate per concentration, 30-minute exposure and untested intermediate concentrations. No scientific rewrite warranted.
- The resource contains one H1, three H2s, a semantic captioned data table (three column headers, three row headers), four separately labelled question prompts with printable answer areas, and a native expandable teacher-notes `details/summary` element.
- Updated the stylesheet query to the verified visible-focus version in commit `2c730d81a242ef28088759f49bf8acfd8d7979f7`; the worksheet mathematics, wording and data were preserved.

## T5.2 | Browser and interaction verification

- Added `scripts/audit-teaching-osmosis-practice.py` and `.github/workflows/audit-teaching-osmosis-practice.yml` for automated exact-source verification with archived HTML/CSS, report.json, five width screenshots, dark 375px screenshot, printed A4 PDF and per-sheet PNGs.
- The first run `40814590760` exposed the familiar desktop footer-gap inconsistency: 100px at 320/375, 128px at 768, 143px at 1024, 158px at 1440. A resource-scoped CSS rule fixed this to **exactly 100px at all five tested widths**. The same print-only stylesheet now suppresses conspicuous magenta heading fills in favour of understated monochrome section headings, reducing printer ink without altering on-screen appearance. CSS committed `2c9f057800273fc1a3c2032c63ea9de047141288`.
- The first interaction harness reported two calls from a single print-button click. Replaced the minimal stub with instrumentation that counts both click events and actual invocations and records stack traces. On the next exact-source run there was **one click, one `window.print()` call**, directly from the button's inline click handler. This resolves the earlier transient test result without changing the functional button or suppressing the assertion.
- The final run `40814848277`, exact script commit `900de665aca0a19c606acd8d8ca2563c7bef87a5`, artifact `12871334927`, reported **success with nine checks and zero failures**: five responsive widths 320/375/768/1024/1440, arithmetic, interactions, dark mode and actual print A4.
- Actual browser checks find no horizontal document or worksheet table overflow; headings and table semantics remain correct, no broken local fragment links or unnamed navigation links. The first Tab focuses Skip to content, Enter reaches main, teacher notes expand, and Back to top returns to scroll position 0. In 375px dark mode the keyboard-focused brand retains high-contrast visible outline and table text is not lost.
- The live CSS prints Name and Date lines while removing navigation, footer, print controls and teacher notes. The four respective writing-space heights are 85, 140, 125 and 110px, as intended, and every task is present.

## T5.3 | Independently inspected A4 pages

- Downloaded the final artifact and opened both rendered PDF sheets. It is a **two-page A4 student handout** with the title, introductory scenario, name/date, complete data table, percentage-change formula and first question on page 1; the other three questions and their writing spaces on page 2. No section heading appears by itself and no answer area is detached from its question. The first page retains white space rather than splitting the second long answer prompt or shrinking font size.
- Printed section headings are monochrome and readable, with no harsh magenta blocks. The table header retains a pale tint and legible black text. Text extraction confirms every required prompt is present, print-only elements render, teacher-only text does not leak into the student PDF, and no text lies outside page boundaries.
- Evidence file is available at `https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40814848277` with downloadable artifact `12871334927` (subject to standard GitHub artifact retention).

## Scope, disposition, continuation

**T5 complete within tested academic, five-width responsive, keyboard/print-button/teacher disclosure, dark, and rendered A4 scopes.** These checks do not certify physical mobile gestures, native menu zoom at 200%, assistive-technology speech, third-party printer drivers or implemented student outcomes.

The five current Teaching routes are now audited through their page-specific stages. Next systematic visitor-facing page should be chosen from the remaining *uncompleted* audit ledger, starting with the Interests site section if it has not already received a verified final visual check. Preserve all completed P2/P3 and T1–T5 audit records.
