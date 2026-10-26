# Academic Website Editor 2

A replacement visual editor developed separately from the existing academic website and original `editor.html`. The existing live pages remain the source of truth until the replacement editor has passed migration and publishing tests.

## Open

- Editor application at `/editor-v2.html`
- Original application at `/editor.html`
- Staging previews, when a user explicitly publishes with a GitHub token, at `/editor-v2-previews/{page}.html`

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
- Responsive standalone HTML preview and export
- Optional GitHub API publication **only into the staging subdirectory**, requiring a short-lived token entered by the user
- Automated Chromium tests in `.github/workflows/academic-editor-v2.yml`

## Deliberate limitations

The current import is a first-pass approximation, not a lossless migration. It currently extracts text and images with approximate computed sizes and desktop positions. It does **not yet** faithfully reproduce all original HTML structure, inline hyperlinks, decorative section backgrounds, complex grids, embedded widgets, footnotes, or semantic heading relationships. The generated mobile view is a basic reading-order stack; precise tablet and mobile page designs remain future work.

Do not direct-publish this new scene over `index.html`, `research.html` or other live source pages until the migration importer, fidelity comparison, accessibility and full responsive editing are completed and tested. This limitation is intentional.

## Next engineering milestones

1. Confirm all Chromium tests are passing and add visual screenshot-diff tests.
2. Extend the structured text model to preserve inline links, emphasis, paragraphs and accessibility.
3. Import existing site backgrounds, sections, groups and relative media sizes without flattening their semantics.
4. Add explicit desktop/tablet/mobile design canvases with editable responsive properties.
5. Add grouping, alignment/distribution guides, snapping, layers reordering and clear visual text editing.
6. Review a full representative page against its existing site for visual, responsive and semantic fidelity.
7. After a user-reviewed migration, introduce a guarded transition from staging preview to existing live pages.

## Publishing

The editor uses the browser's GitHub API request with an explicitly supplied fine-grained personal access token. The token is not stored in localStorage or the scene JSON. Generated standalone HTML contains no editor code, token or GitHub API connection. A staging publish may overwrite the corresponding staging preview, but cannot overwrite an existing live page.

## Testing

Use the repository's `academic-editor-v2.yml` workflow to run `tests/academic-editor-v2.spec.cjs` under Chromium. The workflow posts a commit status named `academic-editor-v2/chromium` and provides a failure artifact when applicable.
