# C-RV29ew | Distinguishing the editable GitHub source from the actual published website

**Date:** 5 November 2026.  
**Continued from:** [C-RV29ev](EDITOR_V2_AUTHENTICATED_PUBLISHER_READINESS_C-RV29ev_2026-11-05.md).  
**Trigger:** The author observed that Editor V2's "Live website" view did not look like the actually published site, and questioned whether the editor was reliable.

## The concrete semantic and technical mismatch

The old **Live website** label was misleading. In `editor-v2.js`, `loadLivePage()` calls `fetchGithubPageSource()` for the current GitHub `main` HTML and assigns those bytes to the same-origin source editor's `iframe.srcdoc`. It **does not navigate the iframe to the deployed URL**. It uses simulated desktop/tablet/phone widths of **1160, 768 and 390 CSS pixels**, scaled to fit the centre workspace. The direct public page can have a different viewport width, URL context, script execution state, browser environment or temporarily lag behind the GitHub source while Pages deploys.

Consequently, source hash parity, all source-only editing tests passing and exact HTTPS file byte parity **do not prove that every actual visitor screenshot is visually identical to the editing iframe**. Earlier [C-RV29el](EDITOR_V2_HOME_CONTACT_SCRIPTED_PARITY_C-RV29el_2026-11-04.md) verified specific script-reparented Home and Contact photographs at matched viewport widths, but not the visual equality of all 17 complete pages. The author's reported visible difference remains valid evidence that required clearer presentation and a direct public comparison.

## Corrective implementation

On [PR #14](https://github.com/gmoon-code/gmoon-code.github.io/pull/14), merged as [commit `69e621f`](https://github.com/gmoon-code/gmoon-code.github.io/commit/69e621f73438a38738c6232b803a599ab6052181), added a **View actual published site** button inside Editor V2 and explicitly relabelled the source editing workspace **Edit GitHub source / GitHub source editor**.

The new read-only dialog loads the current page through its **actual same-origin public page URL** in an iframe's `src` property, not through an independently assembled `srcdoc`. It uses the same selected simulated width as the source editor (desktop 1160, tablet 768, phone 390 pixels), supplies a link to open the full visitor page in a separate browser tab, and explains that local draft edits are not shown in this public URL view.

The dialog also fetches the deployed HTML without caching and compares those raw bytes with the currently loaded, verified GitHub source HTML. It explicitly reports source/public equality or divergence; if the check fails, it does not fabricate a parity result. **HTML byte equality is not pixel-perfect screenshot equality.**

The original source editor is not reconfigured to edit deployed HTML, because doing so could break its source revision and concurrent-edit protection. Existing local drafts, undo/redo, Verified live preview (what would be submitted), publishing safeguards, image editing and publication authentication code are preserved. The distinction among GitHub source editing, real public deployment, and proposed publication output is now visible in the interface.

## Verification evidence

Two new real-page Playwright tests verify the public URL iframe, phone-width viewport, no `srcdoc`, no GitHub REST write, exact-HTML status, external link, and successful return to the source editor. The second test deliberately makes the deployed Contact HTML different from current GitHub `main`, checks the mismatch warning and ensures that an unsaved source text edit remains intact. [Cross-engine run 41930929104](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41930929104) passed **105/105 in Chromium, Firefox and WebKit (315 checks)** on the intermediate implementation.

Two additional diagnostics compare the first 18 representative Home and Contact DOM elements (including headings, text, images, figures and the main content) between direct public-page rendering and the source iframe at **the exact same 1160-pixel width**. The tests compare relative element geometry within a 6-pixel tolerance, CSS font size and display state. They passed in all three browser engines, as did the published-site preview tests, in [final pre-merge run 41931396502](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41931396502), **107/107 cases per browser, 321/321 total**. This sampled controlled-width result does not extend automatically to every page and breakpoint. It does support the need to compare at equal viewport sizes.

The final PR altered only `editor-v2.html`, `editor-v2.js`, `editor-v2.css` and the source-faithful current-website test file. It changed no academic page HTML, public content, original website photograph or other authored material.

## Production delivery and remaining limits

**Final public-delivery evidence:** The first [byte-verification run 41931940884](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41931940884) attempt failed **19/22** while Pages still served the previous versions of editor-v2.js, editor-v2.html and editor-v2.css. A later [GitHub Pages deployment 41932239049](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41932239049) completed successfully, and **attempt 2 of the same public-byte run passed 22/22 exact HTTPS byte comparisons in its first round**, with no failed resources. The v68 actual public page preview is therefore confirmed present in the published editor. Source-faithful three-engine tests verify the UI behaviour, but a separate post-byte deployed browser smoke remains an additional runtime check.

The published-site iframe reflects whatever the browser receives at the selected public URL and chosen **simulated** viewport width; it is not a guarantee that all CSS, scripts, dynamic resources or user browser/OS conditions look identical outside the iframe. This is a read-only visitor reference, **not a live editable view**. The GitHub-source editor remains source-derived and could legitimately look different from a direct browser visit at a wider resolution or before the Pages deployment catches up.

The historical same-origin script and direct GitHub token exposure remains an unresolved security boundary. A deployed page loaded as a same-origin iframe is not a separate secure owner-publishing origin. No owner token, actual live publication, physical smartphone/tablet test, or comprehensive screenshot pixel-diff of all 17 pages was performed.

**Next checkpoint C-RV29ex:** Examine a specific remaining layout discrepancy, if the author provides the page and affected section, comparing the deployed visitor page with the GitHub source editor at the same viewport width and browser environment. Test full-picture and font rendering as needed without silently changing underlying styles. A physical device and final owner-authenticated publication remain outside the verified tier.
