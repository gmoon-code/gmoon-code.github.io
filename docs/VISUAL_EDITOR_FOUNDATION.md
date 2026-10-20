# Visual editor foundation

## Scope

The portfolio editor at `editor.html` is a **local-first visual editing prototype**. It is intentionally not linked from the site's public navigation.

Features currently implemented

- browse all 17 static portfolio pages
- select headings, paragraphs, list items, captions, links, images, and table cells
- edit text directly in a script-disabled page preview
- edit simple text in the inspector
- edit image paths, alt text, and constrained image width settings
- edit link destinations and new-tab behaviour
- adjust text alignment on individual content elements
- reorder eligible neighbouring top-level sections using drag-and-drop or accessible Up and Down controls
- browse a searchable library of images already used in the portfolio and replace the selected image without typing its path
- switch between desktop, tablet, and mobile widths
- preview light and dark themes
- save local drafts (browser storage, not GitHub)
- undo the most recent edit and revert individual elements
- review changed elements side by side, with an export-safety check
- export edited HTML files for review

The editor never asks for or stores GitHub credentials. It cannot publish, edit repository files, or change the public site without a subsequent authenticated step.

## Usage

1. Open `editor.html` from the same GitHub Pages origin as the portfolio.
2. Select a page, then click the element you want to change in the preview.
3. Edit its text on the page or update the link/image properties in the inspector.
4. Use Export edited HTML and review the downloaded file.
5. Replace the original file only through an authenticated, reviewed GitHub workflow.

The export process patches only uniquely located source blocks. If a block cannot be matched without ambiguity, exporting is stopped instead of risking an unrelated edit. The draft is retained in the browser.

## Browser regression coverage

The draft pull request includes a Chromium smoke test in `tests/editor-smoke.mjs`, run through `.github/workflows/editor-smoke.yml`. The test exercises editing and exporting text, link destinations, and image descriptions; draft reload and reset; before-and-after change review; responsive and dark previews; and loading all 17 portfolio pages. Screenshots are saved as build artifacts for human inspection. Passing these checks does not constitute a complete accessibility or visual regression audit, and it does not enable automated publishing.

## Security and trust

The preview is an iframe sandboxed without `allow-scripts`. Original page scripts, forms, embedded frames, and objects are excluded from the editing preview.

The editor is served as a public static file, not an access-controlled backend. Anyone can open it, but no one can publish through it. Neither a GitHub access token nor a Cloudflare secret should be embedded in the editor, committed to the repository, or retained in local storage. A private publishing feature requires a server-side authentication and authorization boundary.

The editor's browser storage is for draft content only. It is not suitable for secret or sensitive unpublished information.

## Section and media safety

**Section order**. The editor permits drag-and-drop and arrow-button moves only between consecutive top-level `<section>` siblings within `<main>`. Drag targets are visually marked, and keyboard and touch users retain the arrow controls. Other elements, including page navigation, form boundaries and anchored contents menus, are protected. Pages with an in-page contents menu intentionally disable reordering until that menu can be updated in the same reviewed change. Changes remain reversible, persist in local drafts, and are exported by conservatively swapping uniquely identified raw section ranges. When the source structure differs or non-section content interrupts a proposed group, the export is rejected.

**Existing image library**. The media chooser reads `<img>` references from the same 17 portfolio pages, shows thumbnails and alt descriptions, and limits selection to existing relative `assets/` image paths. It does not upload files, browse private local directories, or publish new assets. Authoring new media and its metadata requires a separate authenticated upload and review workflow.

Drag-only exports, local draft restore after a drag, repeated rearrangement, and combined structural and text changes are covered by the browser smoke test. Moving a section does not automatically revise design-sensitive section colours or page navigation. Review the proposed HTML and responsive appearance before approving any structural change.

## New image uploads

The editor can now stage a single **PNG, JPEG, or WebP image of up to 1.5 MB** for the selected image element. The editor checks its file signature, decodes it locally, checks dimensions, generates a unique \`assets/editor-…\` filename, and renders the selected image immediately from its browser object URL.

The private proposal service independently verifies the image extension, MIME type, file signature, size, SHA-256 checksum, absence of a pre-existing asset with the same filename, and exactly one new reference in the edited HTML. The resulting GitHub draft pull request includes **both the image and the edited page**. It cannot publish directly.

- The owner must update the image's alt description before exporting or proposing the change.
- The image bytes remain in memory, not in local-storage drafts. After a reload, the editor can restore the HTML but **the user must stage the image again** before exporting or publishing. Do not assume restored drafts contain the original upload bytes.
- If using manual HTML export, explicitly use **Download staged image** and retain the image under its generated filename in the \`assets/\` folder along with the HTML update.
- Only one new image is supported per review proposal. New image uploads and media publication are inactive until the private publisher has been configured and authorized.
- Existing image assets can still be selected through the searchable media library.

The Chromium browser suite tests local image staging, object-URL preview, exact binary download and HTML export. The private publisher suite tests image signature checks, checksums, binary+HTML draft PR creation, and rejection of orphaned image references.

## Current limitations

- This release edits existing elements and reorders eligible sibling sections. Page creation, arbitrary component insertion, full layout editing, and theme-variable editing are not yet provided. One new image can be staged for manual export or a draft PR, although live authenticated publication remains unconfigured.
- In the preview, page JavaScript is disabled. The editor is therefore intended for the portfolio's static HTML pages.
- Editing rich blocks with nested links is supported directly in the preview. The inspector's plain-text field becomes read-only for such blocks to avoid deleting formatting.
- If the underlying live page changes after a draft was saved, the draft is not automatically applied to the new source.
- A browser-rendered end-to-end visual/interaction regression pass is needed before the editor can be considered production-ready.

## Roadmap for the other two applications

### Research Methods Studio

Its v3 Admin Workspace already includes an authenticated Content Studio. The visual editor should become a view of that existing staged content model, reusing its publication validation, immutable releases, rollback, and private session checks. First add direct visual selection for the six existing guidance fields across the 18 stages. Later add schema-validated editing of lab instructions, field prompts, examples, and navigation. Do not use an arbitrary HTML overwrite of the student application.

### The Story Method

Its Units 1–8 and review content are governed by a frozen, QA-gated curriculum. A visual editor should display journeys, scenes, story text, memory objects, recall targets, review items, and Challenge Lab items with structured fields. The authoring model must preserve curriculum IDs and cross-references, validate science content and scene dependencies, and publish only after the existing repository tests pass. Existing student progress must remain compatible.

### Shared authoring experience

All three editors should ultimately share the three-panel layout, element selection, accessible property controls, responsive preview, draft history, and change review. They can have different content adapters and publishing pipelines. Cross-project access should require explicit authorization rather than relying on the GitHub Pages origin alone.

## Secure publisher implementation (not yet deployed)

The next publication milestone has now been implemented **in code** on this draft branch.

- `publisher/worker.mjs` is an independent, private Cloudflare Worker proposal service.
- `editor-publisher-config.js` contains deliberately empty public connection settings.
- The editor has disabled-by-default GitHub sign-in, an explicit change-summary field, and a review-only Create draft pull request action.
- The Worker verifies GitHub App user authorization for the allowlisted owner, protects its session with AES-GCM, expires sessions after 15 minutes, and restricts submissions to the 17 portfolio HTML files.
- It checks that the live `main` page has not changed, prevents editing executable dependencies, and creates a new branch and draft pull request. It cannot merge or publish directly to `main`.
- `tests/publisher-worker.test.mjs` tests authentication, tampering, cross-origin requests, owner verification, source conflicts and PR creation with mocked GitHub calls.

**Actual activation still requires owner action.** GitHub App registration, installation and private Worker deployment are not yet configured, and cannot be simulated by the test suite. Instructions are in `publisher/SETUP.md`.

The live portfolio website and the two learning applications are not affected by this development branch. Until the publishing service is configured, local drafts, review and HTML export remain available.

## Next editing capabilities

After the authenticated proposal flow has been tested against a real GitHub App, the portfolio editor should gain media upload/management, drag-and-drop structural sections, and style properties. Research Methods Studio should continue using its existing authenticated Content Studio and its specialized content validation. The Story Method needs a separate structured curriculum adapter and must continue passing its frozen-content QA gates.

