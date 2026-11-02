Academic portfolio hosted with GitHub Pages at https://gmoon-code.github.io/

## Main pages

- `index.html`
- `research.html`
- `projects.html`
- `teaching.html`
- `contact.html`
- `cv.html`

## Website editor release and rollback

Before publishing the three-editor hub, follow the [editor release candidate and rollback guide](docs/website-editors-release.md). It includes the exact required checks, release sequence, live-authentication review, confirmation of disabled unconfigured publishers, and recovery steps.

## Canvas-first editing controls

The academic editor can independently collapse the desktop Pages and Inspector panels, giving the page preview more space. These UI preferences persist in the browser without changing exported website HTML. On smaller screens, the existing navigation and inspector remain visible. The on-canvas **Details** control restores a collapsed inspector.

The on-canvas toolbar now offers **Copy** for eligible plain-text source paragraphs/headings and **Move up/down** for uniquely verified neighbouring original blocks. These call the same source-protected, Undo-able operations as the inspector. Boundaries and protected structured content remain restricted.

### Direct width controls

Select an original paragraph or heading, or a newly added text block, and choose **Size** from the on-page toolbar. The width slider previews changes directly on the page before release. Presets for full, 75% and 50% widths commit via existing source-safe style or added-block validators. **Cancel** or Escape discards the visual preview without changing a draft; Undo reverses committed edits. The inspector remains available for precise numeric layout controls, and unsupported image or complex layout changes retain their existing specialised safeguards.

### Resize existing content by dragging

Selected original text blocks now show a small corner resize handle. Dragging this handle adjusts the same source-safe percentage width setting as the on-page Size control, with a single Undo checkpoint per drag. The corner handle is mouse/touch-accessible; the Size range input and inspector remain the precise keyboard alternatives. Only the academic editor preview receives editor handles. Those controls are removed from reviewed HTML exports.
