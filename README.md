# Ye Eun Moon Academic Website

Academic portfolio hosted with GitHub Pages at https://gmoon-code.github.io/

The site is intentionally multi-page. Research, teaching, curriculum/resource design, and the web CV each have separate pages so the site adds depth beyond the application CV.

## Visual system

The site follows the established Moon Notes design family used in the Research Methods Studio and The Story Method:

- Times New Roman throughout
- warm white page and white paper surfaces
- black ink with muted gray secondary text
- thin gray rules
- very small corner radii
- no shadows or decorative gradients
- restrained black/white controls
- Yellow → Green → Turquoise → Pink highlighter organization

## Main pages

- `index.html`
- `research.html`
- `projects.html`
- `teaching.html`
- `about.html`
- `cv.html`

Research and project overview pages link to dedicated subpages for individual work.


## Website editing and review
**Editor workflow.** Text can be edited directly on the canvas using F2 (Escape cancels, Ctrl/Cmd+Enter commits). Layout drafts autosave in browser storage. The in-context preview offers **Original**, **Proposal**, and **Publishable edits** views, and the browser workflow archives screenshots for desktop/mobile review.

For manual testing, setup steps, screenshots and publishing limitations, see [the fluid layout testing guide](docs/fluid-layout-testing.md).


The portfolio's existing `editor.html` can edit supported page content and export reviewable HTML. Its authenticated GitHub proposal option requires a separately deployed private publisher. Public connection settings in `editor-publisher-config.js` are intentionally blank until that publisher is configured. Never commit OAuth secrets or tokens to the public website.

The experimental `fluid-layout-lab.html` can import portfolio page content into a grid, move and resize blocks for desktop and mobile, and preview proposals inside the surrounding website navigation and footer. It can also compare the original page with the proposed layout and export JSON or standalone HTML review files.

**Verified handoff to the main editor** supports changes to imported plain text and these explicitly adjusted properties: font size, text colour, background colour, text alignment, maximum width, and spacing above/below an element. The destination editor rechecks the live source, refuses invalid CSS and conflicting browser drafts, and keeps the changes local until review. Existing inline links and emphasis are preserved for style-only edits.

**Home cards and CV rows.** Use **Find card and CV row groups** to locate complete nested cards, portrait-and-text groups, and CV row collections. Choose an existing group and select single-column, equal-column, 8/4, 4/8, three-column, or custom 2–10/12 desktop splits using the width slider. Mobile layouts stay in source order. These groups transfer as scoped CSS while retaining their original linked text, images, and markup. Every container's original HTML is rechecked before preview or transfer, so changes to images and links are detected.

**Constrained responsive text groups.** After importing a page, select a heading or paragraph and choose **Use selected sibling group**. If the selected parent contains only two to twelve fully mapped, neighbouring text elements, the shared validator can translate their desktop and mobile grid positions into scoped CSS. The receiving editor independently verifies all source elements, rejects overlaps or unsafe selectors, previews the result, and includes the generated CSS in its reviewable HTML and draft PR proposal. Original HTML, links, and DOM reading order stay intact.

**Multiple independent sections.** Up to six non-overlapping, non-nested responsive groups can be combined on the same page. The **Selected group for editing** picker switches between them without discarding the others, and **Clear responsive group** removes only the selected group. Browser drafts, undo/redo and exported JSON retain all groups. The main editor reviews one combined stylesheet and the private publisher independently checks every group before creating a proposed change.

**Source-anchored content creation.** The builder can stage up to ten new plain-text paragraphs, H2/H3 headings, or links, one after a selected imported paragraph or heading. The main editor rechecks the anchor's original source text, stores the addition in a local draft, supports undo/reset, and escapes text and link destinations in exported HTML. Links are limited to local .html destinations or HTTPS URLs without embedded credentials. Added blocks can be edited or removed before transferring. The main editor's change-review dialog also offers **Edit added content** and **Remove addition**, with undo available after each change. Insertions within approved responsive groups, new images and arbitrary HTML blocks are deliberately excluded. The exporter currently requires an exact unique source-element markup match for an addition and blocks ambiguous cases.

**Not yet publishable through the handoff** are unrestricted freeform positions outside a verified text or card group, newly added or removed blocks, and layout-level image changes. Visual review files are prototypes and must never replace a live page without a separate structural, accessibility, and content review.

The project runs browser tests and publishing-preflight checks for the experimental builder before changes are proposed for merging. The experimental builder is developed on a separate draft pull request; its existence does not imply that it is deployed to GitHub Pages.
