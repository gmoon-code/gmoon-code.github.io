# Testing the experimental portfolio layout builder

This guide covers the draft branch `feature/fluid-layout-builder-20261021`. **The prototype is not merged or deployed to the public GitHub Pages site.** Do not upload any exported `*.review.html` files as replacements for live pages.

## Option 1. Inspect GitHub Actions visual reviews

Open draft [pull request #2](https://github.com/gmoon-code/gmoon-code.github.io/pull/2) and select **Checks**. Open a successful **Fluid layout lab browser tests** run and download the artifact named `fluid-layout-visual-review`. It contains five screenshots.

- `builder-desktop.png` and `builder-mobile.png` show the editor canvas.
- `website-applied-desktop.png` and `website-applied-mobile.png` show transferable edits inside the existing page design.
- `website-freeform-mobile.png` shows the experimental layout proposal.

The artifact expires after seven days. It also includes `compatible-sections.json`, a machine-readable audit of which of the eight portfolio pages contain groups eligible for the current responsive-grid workflow. The screenshots are snapshots of the draft code, not a live hosted preview.

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

Click **Review transferable edits in main editor** after changing imported text, supported styling, or selecting a verified responsive group. The main editor checks the source again, protects any existing local draft, and asks for confirmation. Changes transfer into `editor.html` locally.

Supported changes include imported plain text, font size, foreground/background colours, text alignment, maximum element width, and spacing above/below an element. Text edits within elements that contain links or inline formatting are intentionally blocked in the prototype. Use the main editor for those rich-text changes.

**Find and arrange groups quickly.** After importing a page, choose **Find compatible sections** in the responsive group panel. A dropdown lists only source-verified complete groups of two to twelve text blocks. Choose a group and click **Arrange selected section** for two desktop columns and a mobile stack. **Stack both layouts** provides a single-column alternative. Undo restores the previous arrangement. The builder highlights the group's blocks, checks collisions with other canvas blocks, and checks the source again before transfer.

The text-only compatibility report originally identified **31 sibling-text sections across six pages**. Home and CV need a separate arrangement mechanism for nested content. They now support a **card and CV row mode** that can arrange complete article, portrait, and CV-row containers without flattening or altering their HTML. The current GitHub Actions artifact reports both text groups and card/row groups across all eight pages.

**Edit Home and CV arrangements.** Choose **Find card and CV row groups**, select a compatible parent with two to twelve intact cards or rows, and choose **Equal columns**, **First card wider (8 / 4)**, **Second card wider (4 / 8)**, **Three equal columns**, **Single column**, or **Custom two-column split**. The custom slider sets the first card to 2–10 grid columns while preserving a 12-column total. Click **Arrange cards in desktop columns**. The source HTML in each child is preserved byte-for-byte by the editor's source verification, including links, emphasis, portrait images, and CV labels. Mobile remains stacked in document order. Inspect this arrangement through **Preview inside website → Publishable edits**. The standalone canvas does not flatten card markup into plain text.

**Responsive sibling groups** are supported for a narrow, verifiable case. Import the page, select a heading or paragraph, then click **Use selected sibling group**. The builder checks that all direct children of its parent are imported text blocks, that the original text still matches, and that neither desktop nor mobile blocks overlap. If approved, the group's desktop/mobile coordinates can transfer as generated CSS Grid rules. Review these rules in the main editor before exporting or proposing anything. The original elements and their reading order are not replaced. Press **Clear responsive group** to remove the group from your builder draft.

**Multiple sections on the same page.** Add one validated responsive group, choose another independent compatible section, and apply its arrangement. Up to six groups can coexist. Use **Selected group for editing** to switch between groups, and **Clear responsive group** to remove the currently selected one. Saved browser drafts, JSON export/import, undo/redo, and the Publishable edits preview retain all groups. Source verification rejects duplicate or nested groups, and the main editor transfers the combined CSS only if every group remains valid.

**Add a paragraph, heading, or link.** Select an imported heading (h2–h4) or paragraph, then choose **Add paragraph**, **Add heading**, or **Add link**. Enter the new content in the prompts. A link also requires an internal .html destination or a full HTTPS address without a username or password. The new block appears on the canvas and in **Publishable edits** inside the original website. You can edit its text on the canvas, adjust a new heading between H2 and H3, or update the destination of a new link in the property panel. **Delete** removes a staged addition; undo can restore it. The main editor verifies the anchor against the source again and includes the insertion in the reviewed local draft and exported HTML. This mode supports one addition per anchor and ten per page. Existing inline links, images, lists, and headings remain in place. Insertions into a responsive layout group are intentionally blocked to protect the group's structure. HTML typed into the paragraph becomes literal text, not live markup. Export requires the original anchor's markup to be uniquely located and fails closed if it cannot.

Freeform block x/y coordinates outside an approved sibling group, changes to image sources, and additions/deletions of blocks cannot pass through this transfer. Keep a JSON copy to preserve those proposals.

The main editor can export reviewed HTML. Its optional **Create draft pull request** feature requires separately configured private publisher API and GitHub OAuth settings. The public `editor-publisher-config.js` currently has empty connection values. Local review cannot activate GitHub publication.

## Automated checks

The [fluid-layout test workflow](../.github/workflows/fluid-layout-tests.yml) runs Chromium browser tests. The repository also checks the existing publisher integration, site editor, and cross-site links. Passing tests are required before considering this experimental branch for merging.

## Release checklist

Review the actual content and headings on each site page, check readability in light and dark colour themes, inspect internal links, compare original and proposed mobile layouts, verify keyboard operation, and confirm that no source pages or publisher endpoints are changed unexpectedly. Full freeform publishing requires a separate structural layout pipeline and further accessibility review.
