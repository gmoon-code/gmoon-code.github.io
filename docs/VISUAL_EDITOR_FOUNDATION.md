# Visual editor foundation

## Scope

The portfolio editor at `editor.html` is a **local-first visual editing prototype**. It is intentionally not linked from the site's public navigation.

Features currently implemented

- browse all 17 static portfolio pages
- select headings, paragraphs, list items, captions, links, images, and table cells
- edit text directly in a script-disabled page preview
- edit simple text in the inspector
- edit image paths and alt text
- edit link destinations and new-tab behaviour
- switch between desktop, tablet, and mobile widths
- preview light and dark themes
- save local drafts (browser storage, not GitHub)
- undo the most recent edit and revert individual elements
- export edited HTML files for review

The editor never asks for or stores GitHub credentials. It cannot publish, edit repository files, or change the public site without a subsequent authenticated step.

## Usage

1. Open `editor.html` from the same GitHub Pages origin as the portfolio.
2. Select a page, then click the element you want to change in the preview.
3. Edit its text on the page or update the link/image properties in the inspector.
4. Use Export edited HTML and review the downloaded file.
5. Replace the original file only through an authenticated, reviewed GitHub workflow.

The export process patches only uniquely located source blocks. If a block cannot be matched without ambiguity, exporting is stopped instead of risking an unrelated edit. The draft is retained in the browser.

## Security and trust

The preview is an iframe sandboxed without `allow-scripts`. Original page scripts, forms, embedded frames, and objects are excluded from the editing preview.

The editor is served as a public static file, not an access-controlled backend. Anyone can open it, but no one can publish through it. Neither a GitHub access token nor a Cloudflare secret should be embedded in the editor, committed to the repository, or retained in local storage. A private publishing feature requires a server-side authentication and authorization boundary.

The editor's browser storage is for draft content only. It is not suitable for secret or sensitive unpublished information.

## Current limitations

- This release edits existing elements. Full structural rearrangement, page creation, component insertion, media uploads, theme-variable editing, and authenticated publication are not yet provided.
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

## Next secure publication milestone

Build a private publisher using an authenticated GitHub App or a server-side OAuth exchange. Restrict it to allowlisted repositories and paths, show the proposed diff, and create a reviewable pull request before any live deployment. Do not add a public page that accepts or persists a long-lived personal access token.
