# C-RV29ex | Image move, resize, crop and publication-delivery verification

**Date** 5 November 2026  
**Continued from** [C-RV29ew](EDITOR_V2_ACTUAL_PUBLISHED_SITE_VIEW_C-RV29ew_2026-11-05.md)  
**User-reported scope** The author reported problems with image resizing, moving, cropping and publishing in Editor V2.

## What is and is not established

The existing source-faithful tests already exercised pointer resizing, moving frames, adjusting crop focal positions and trim edges, and constructing simulated GitHub publication HTML for actual Pungmul, Home and Contact page images. A prior 107/107 three-engine baseline does not reproduce every possible real device/user image problem. The user did not identify a specific affected page/photo, sequence of actions, selected editor mode or observed difference, so no precise individual UI failure is claimed resolved without that reproduction.

Two concrete usability/verification gaps were identified in current code.

1. Original-layout **image placement and cropping are device-specific**. The CSS/geometry model has distinct Desktop (1160px), Tablet (768px) and Phone (390px) rules. An adjustment made at one breakpoint does not automatically move/crop the image at other breakpoints. This is deliberate but was easy to misunderstand as a failed publication when viewing the site at a different width.
2. After a direct GitHub publishing PUT succeeded, the editor showed the commit and warned that Pages might be pending. It **did not check whether the actual public HTTPS page contained the exact reviewed published HTML**. Thus the user could not distinguish GitHub acceptance from Pages deployment lag or a later publication.

The **Free design canvas** remains staging-only, not a live academic-page publishing route. The working live route is **Edit GitHub source**, and its Verified live preview is the HTML intended for publication. No real owner-authenticated publication, physical-device review or independent pixel-perfect visual validation of every photo was completed.

## Implemented correction

[PR #16](https://github.com/gmoon-code/gmoon-code.github.io/pull/16), merged in [commit `40e710c`](https://github.com/gmoon-code/gmoon-code.github.io/commit/40e710c0913e020a5f105fa5153535c955933155), modifies only `editor-v2.js`, `editor-v2.css`, `editor-v2.html` and real-page Playwright tests.

- The **Free placement** and **Picture cropping & framing** instructions now explain that image resizing, moving and cropping changes only the currently selected Desktop/Tablet/Phone layout and that the other widths must be reviewed separately.
- After a successful direct live GitHub publication, a **Check public deployment** control fetches the exact public page URL with a cache-busting query and `cache:"no-store"`. It compares the served HTML text to the `publishedHtml` returned by the exact publication assembler. On a byte-for-byte match, it confirms that the website is serving the reviewed file. On mismatch, it clearly states the current public site differs because the deployment may be pending or another publication may have replaced it. On network error, delivery remains unverified. The check is read-only and performs no additional GitHub PUT.
- The browser draft remains intact. The original GitHub source, photo assets, styling rules, crop mathematics, pointer gesture implementation and publication assembler were not altered. The updated editor script and CSS are cache-busted as v70.

## Verification and test-boundary details

A new real Pungmul source-photo test exercises numerical width/placement changes, a trim-edge crop and zoom, a verified preview, synthetic GitHub REST commit, a public-URL deployment check while the old page is served, exact new-HTML delivery confirmation, a **second** photograph resize/crop publication, an exact second preview-to-commit comparison and visitor-side styling after the second commit.

The first attempt failed because the test intercepted only its local test-server URL while the editor correctly fetched the real production hostname. A subsequent attempted fixture routed a cache-busting local URL but still did not intercept the production host. Both were **test harness limitations**, not confirmed application bugs. The final synthetic mock intercepts `https://gmoon-code.github.io/pungmul.html` including query parameters, returns CORS headers in the test context, and updates the response contents to model Pages propagation. The corrected [run 41950591278](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41950591278) passed **120/120** tests separately in Chromium, Firefox and WebKit.

A second regression places the editor in a **1280px laptop browser window**, where the source iframe is scaled down to fit the workspace. It drags an actual Pungmul photo resize handle, moves the selected frame, and compares image geometry with the publication preview. The final [run 41950827206](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41950827206) passed **121/121 in each engine, 363/363 total**. The advanced editing, basic editor and accessibility PR checks also passed in their recorded runs.

All GitHub writes in the new photo test are mocked. The tests establish that the reviewed HTML agrees with the simulated GitHub submission and test visitor state; they do **not** prove the author's real authenticated publication sequence or that an unspecified individual image issue has disappeared.

## Production deployment and next step

The source change is merged. A GitHub Pages deployment and 22/22 public-byte audit must independently confirm that the new v70 editor files are served before claiming the deployment-check control is live. Post-deployment smoke can then add runtime evidence. Historical prior-editor delivery results do not automatically apply to this revision.

**Next checkpoint C-RV29ey** should reconcile the exact public editor delivery. For a still-visible user discrepancy, the fastest meaningful reproduction needs the page/photo, selected Desktop/Tablet/Phone width, the specific edit operation and whether the discrepancy occurs during dragging, in Verified live preview, after GitHub commit, or after Pages deployment. Do not modify academic page HTML, original photographs or previous user drafts merely to force a test.
