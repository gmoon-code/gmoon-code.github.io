# Academic Website Editor 2

A replacement visual editor developed separately from the existing academic website and original `editor.html`. The existing live pages remain the source of truth until the replacement editor has passed migration and publishing tests.

## Open

- Editor application at `/editor-v2.html`
- Original application at `/editor.html`
- Free-canvas staging previews at `/editor-v2-previews/{page}.html`
- Original-layout staging previews at `/editor-v2-previews/source-{page}.html`

## Two distinct editing workflows

**Live website** is the default viewing mode. A same-origin iframe renders the existing page's real HTML, CSS, scripts, images and responsive breakpoints at a browser viewport of 1160 × 900, 768 × 1024, or 390 × 844 pixels. Zoom scales the presentation without changing the iframe viewport. Focus page removes the editor's sidebars to make more space. Navigation to known academic pages updates the editor page picker, while external links open separately.

Live mode supports selecting a heading, paragraph or image and saving source-anchored text or image edits into a separate per-page local draft. These edits are replayed onto a copy of the original HTML. Staging export keeps existing CSS, navigation and semantic content; relative asset references become absolute site paths while same-page anchors such as `#references` remain local. The live page and current production files remain unchanged.

Live mode is gaining **non-reflowing, device-specific positioning**. Selected text blocks and images can be moved and scaled visually through corner and edge handles. Text scaling preserves the original line wrapping and visually scales the characters; it does not yet provide true editable reflowing text-box dimensions. Each desktop, tablet, and phone rule is stored separately, and source-layout exports include the corresponding media-query CSS. These transforms preserve neighbouring document flow but may cause visual overlap when moving objects large distances. They do not yet support unconstrained, reflow-safe resizing of rich text containers or complete replacement of the existing page grid. All live-layout changes are staging-only until reviewed.

**Free design canvas** is a separate PowerPoint-style workspace with independent objects. Conversion from the live page is explicitly labelled a simplified reconstruction. It is useful for experimenting with free placement, object size and colour but cannot currently migrate every existing layout feature faithfully. A live element may be copied into it without detaching that element from the original website.

Switching modes never overwrites saved work in the other mode. Both paths only publish to separately named staging pages.

## Architectural decision

The new editor stores **one independent scene model per page**. Text, images and shapes each have explicit numeric coordinates, dimensions, layer order and editable properties. Rendering reads the model. Dragging and resizing update the model and do not reparent original HTML elements, insert invisible layout holders or use website-specific layout overrides.

Each scene is `{version:2,page,width,height,nextId,objects}`. Objects have `id,type,name,x,y,w,h,z`, content and style properties. Object IDs and geometries are validated when restoring JSON or local drafts.

## Features already implemented

- A separate three-panel editor with toolbar, page picker, layers panel and inspector
- Direct move and eight-handle resize, including image aspect-ratio constraints
- Precise position and dimensions via inspector inputs and keyboard arrows
- Independent stacking order, multi-selection for moving, duplicate, lock, show/hide and delete
- Inline text edits, typography, colours, shape background and image insertion/replacement
- Per-page browser-local draft persistence, Undo/Redo, import/export JSON backups
- Read-only measurement-based import from existing site pages, without modifying their source files
- Safe imported inline hyperlinks, emphasis and heading semantics
- Coloured section panels imported as independently positioned editable backdrops
- Image library from each imported source page, file drops, and direct image replacement
- Rectangle, ellipse and line shapes, along with fit-to-content text boxes
- Side-by-side comparison of the original website and independent canvas
- Responsive standalone HTML preview and export
- Optional GitHub API publication **only into the staging subdirectory**, requiring a short-lived token entered by the user
- Automated Chromium tests in `.github/workflows/academic-editor-v2.yml`

## Deliberate limitations

The **free-canvas importer** is an approximate conversion, not a lossless migration. It extracts positioned text, images and simple colour panels while retaining selected inline formatting and heading levels. It does **not yet** faithfully reproduce complex nested grids, animation, interactive widgets, every decorative background, all original accessibility relationships or fully authored responsive layouts. Mobile free-canvas export is a basic reading-order stack.

The **live-page editing path** displays the original HTML/CSS faithfully and supports source-anchored text and image replacement. Some pages with JavaScript tied to the original URL may need additional staging validation. Saved edits are checked against the original source when exported, and are blocked when the source no longer matches the stored edit. Staging should be visually reviewed at all supported viewport sizes.

Do not direct-publish this new scene over `index.html`, `research.html` or other live source pages until the migration importer, fidelity comparison, accessibility and full responsive editing are completed and tested. This limitation is intentional.

## Next engineering milestones

1. Add visual screenshot-difference testing and detailed fidelity comparisons for each academic page.
2. Improve import fidelity for nested section layouts, rich text, links, backgrounds, images and accessible semantics.
3. Build dedicated desktop, tablet and mobile design canvases with independently editable responsive layouts.
4. Add persistent object grouping, layer reordering, rulers, optional snapping and alignment guides.
5. Support robust asset upload and draft persistence for larger collections of images.
6. Review complete page migrations for layout, keyboard navigation, responsiveness and performance.
7. After user-reviewed migration and passing regression tests, introduce a guarded transition from staging preview to existing live pages.

## Publishing

The editor uses the browser's GitHub API request with an explicitly supplied fine-grained personal access token. The token is not stored in localStorage or the scene JSON. Generated standalone HTML contains no editor code, token or GitHub API connection. A staging publish may overwrite the corresponding staging preview, but cannot overwrite an existing live page.

## Testing

Use the repository's `academic-editor-v2.yml` workflow to run `tests/academic-editor-v2.spec.cjs` under Chromium. The workflow posts a commit status named `academic-editor-v2/chromium` and provides a failure artifact when applicable.
