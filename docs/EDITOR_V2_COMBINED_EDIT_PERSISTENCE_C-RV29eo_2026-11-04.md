# C-RV29eo | Editor V2 combined-edit persistence and public delivery

**Date:** 4 November 2026  
**Continued from:** [C-RV29en](EDITOR_V2_FIREFOX_IMAGE_EDITOR_FINAL_C-RV29en_2026-11-04.md).  
**Final tested release:** `e76cef65d3ff8999d4113cec07ab543310526243`.  
**Scope:** Complex existing-source edits, group persistence, local draft recovery, preview-to-mock-publication parity, and delivered JavaScript freshness. No authenticated write to the live website.

## Two reproducible source-code problems

The previous final current-site run passed 80/80 in each of the three engines, but it did not combine image-description editing with existing image formatting or saving text with persistent original-element grouping.

1. In `applyLiveImage()`, a new source-image edit record preserved responsive layout but omitted `imageCrop`, `pictureEffects`, `appearance`, and `groupId` from the existing patch. Changing the image description or source path after formatting could therefore clear saved presentation or grouping settings. Fixed by retaining these independently edited fields. The original image `src` remains unchanged when only the description changes.
2. In `saveLiveText()`, the replacement text patch preserved layout and typography but omitted `groupId`. A grouped original-page element could lose its group membership after its text was edited. Fixed by retaining the group's existing identifier, including an explicit null override when already present.

**Code fix:** [commit `79d9ace33d3c24508913fe0f54c077dbb98630fe`](https://github.com/gmoon-code/gmoon-code.github.io/commit/79d9ace33d3c24508913fe0f54c077dbb98630fe).

## Independent source-faithful browser regressions

Added two tests to `tests/editor-v2-current-website.spec.cjs`, [commit `4d01d0d90733bcf27ef58ab66c9cca623723de31`](https://github.com/gmoon-code/gmoon-code.github.io/commit/4d01d0d90733bcf27ef58ab66c9cca623723de31).

- **Pungmul**: Select an original photo from the real source file, crop it to a rounded mask, rotate it 30 degrees, then change its alternative-text description. Assert that the `src`, original crop and rotation metadata, layout, local-storage draft, reloaded rendering, and source-verified preview are retained. Simulate a GitHub Contents PUT and assert **exact HTML equality** between the preview and submitted content. No authenticated write occurs.
- **Contact**: Select two separate original paragraphs, group them, directly edit one paragraph's text, and confirm the group identifier remains on both saved patches. Reload the editor, check the edited text, reselect the group, and verify the preview. No publication request occurs.

At the fix-and-tests revision, [run 41812323454](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812323454) completed **82/82** in each of Chromium, Firefox and WebKit.

## Final source and delivered release verification

To prevent previously cached fixed-version JavaScript from masking the fix for returning visitors, the production `editor-v2.html` reference was advanced to `editor-v2.js?v=20261104-editor-v2-combined-edit-v56`, [commit `e76cef65d3ff8999d4113cec07ab543310526243`](https://github.com/gmoon-code/gmoon-code.github.io/commit/e76cef65d3ff8999d4113cec07ab543310526243).

At this final release revision:

- [Current website three-browser run 41812555860](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555860): **Chromium 82/82, Firefox 82/82, WebKit 82/82, total 246/246 passed**. GitHub logs explicitly show both newly added test cases passing in each engine.
- [Browser regressions 41812555913](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555913), [advanced interactions 41812555956](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555956), [source-parity interactions 41812555733](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555733), [academic editor checks 41812555801](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555801), and [focused Firefox photo tests 41812555900](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555900): all completed **successfully**.
- [Public HTTPS byte audit 41812555743](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555743): **22/22** exact GitHub source-to-delivered public file byte matches. The initial seven rounds recorded **21/22**, with the updated `editor-v2.html` not yet deployed; round eight confirmed **22/22**.
- [Deployed HTTPS browser smoke run 41812555791](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41812555791): all three engine jobs completed successfully.

This stage changed Editor V2 JavaScript, its HTML cache identifier, and tests only. The original academic page content, research descriptions and picture assets were not edited.

## Assurance boundary and next checkpoint

**C-RV29eo passes at the documented automated browser and public file-delivery tier.** It corrects two uncovered interactions without asserting perfect operation in all environments. A real authenticated owner-initiated GitHub publication, its post-deployment edit verification, physical-device testing and the known same-origin/PAT security boundary remain unverified or unresolved. Do not request a personal access token in chat; any owner-directed live publication must be deliberate, limited in scope and reversible.

**Next checkpoint C-RV29ep:** Continue only with concrete gaps not covered by this completed stage, particularly malformed or stale stored drafts and safe recovery/error feedback. Prioritize a verifiable negative-case regression before altering product behaviour. Preserve the final 246/246 cross-browser pass as historical evidence for its exact revision; changes afterward require their own checks.
