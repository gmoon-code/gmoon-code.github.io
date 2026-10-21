# Testing the experimental portfolio layout builder

This guide covers the draft branch `feature/fluid-layout-builder-20261021`. **The prototype is not merged or deployed to the public GitHub Pages site.** Do not upload any exported `*.review.html` files as replacements for live pages.

## Option 1. Inspect GitHub Actions visual reviews

Open draft [pull request #2](https://github.com/gmoon-code/gmoon-code.github.io/pull/2) and select **Checks**. Open a successful **Fluid layout lab browser tests** run and download the artifact named `fluid-layout-visual-review`. It contains five screenshots.

- `builder-desktop.png` and `builder-mobile.png` show the editor canvas.
- `website-applied-desktop.png` and `website-applied-mobile.png` show transferable edits inside the existing page design.
- `website-freeform-mobile.png` shows the experimental layout proposal.

The artifact expires after seven days. The screenshots are snapshots of the draft code, not a live hosted preview.

## Option 2. Test interactively without publishing

With Git and Python installed, use a separate local copy of the repository.

```bash
git clone https://github.com/gmoon-code/gmoon-code.github.io.git
cd gmoon-code.github.io
git fetch origin feature/fluid-layout-builder-20261021
git switch -c review-fluid-builder origin/feature/fluid-layout-builder-20261021
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/fluid-layout-lab.html`. On Windows, the command may be `py -m http.server 8765 --bind 127.0.0.1`.

You can now import any of the eight listed portfolio pages, select content on the canvas, edit text directly with **F2**, or use the properties on the right. **Escape** cancels in-canvas editing, and **Ctrl+Enter** (or **Cmd+Enter**) commits it. Dragging and resizing affects the experimental layout. The builder saves edits automatically in this browser. **Export JSON** provides a backup that can be imported again.

Use **Preview inside website** to compare three presentations.

- **Original** preserves the selected page's existing content and design.
- **Proposal** shows the independent desktop/mobile grid proposal within the original site shell.
- **Publishable edits** applies supported text and styling edits to a review copy of the existing page structure. It preserves surrounding links, navigation, lists, and other content. It never publishes changes.

Switch between **Desktop** and **Mobile** to examine responsiveness. The review file exports are downloaded to your computer only.

## Text and layout changes that can move to the main editor

Click **Transfer verified text to editor** after changing imported text or supported styling. The main editor checks the source again, protects any existing local draft, and asks for confirmation. Changes transfer into `editor.html` locally.

Supported changes include imported plain text, font size, foreground/background colours, text alignment, maximum element width, and spacing above/below an element. Text edits within elements that contain links or inline formatting are intentionally blocked in the prototype. Use the main editor for those rich-text changes.

Freeform block x/y coordinates, canvas resizing, changes to image sources, and additions/deletions of blocks cannot pass through this transfer. Keep a JSON copy to preserve those proposals.

The main editor can export reviewed HTML. Its optional **Create draft pull request** feature requires separately configured private publisher API and GitHub OAuth settings. The public `editor-publisher-config.js` currently has empty connection values. Local review cannot activate GitHub publication.

## Automated checks

The [fluid-layout test workflow](../.github/workflows/fluid-layout-tests.yml) runs Chromium browser tests. The repository also checks the existing publisher integration, site editor, and cross-site links. Passing tests are required before considering this experimental branch for merging.

## Release checklist

Review the actual content and headings on each site page, check readability in light and dark colour themes, inspect internal links, compare original and proposed mobile layouts, verify keyboard operation, and confirm that no source pages or publisher endpoints are changed unexpectedly. Full freeform publishing requires a separate structural layout pipeline and further accessibility review.
