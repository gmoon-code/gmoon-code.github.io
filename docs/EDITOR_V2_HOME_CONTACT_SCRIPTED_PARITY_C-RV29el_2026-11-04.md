# C-RV29el | Home and Contact script-dependent photograph parity

**Date:** 4 November 2026  
**Continued from:** [C-RV29ek](EDITOR_V2_TOKEN_ISOLATION_C-RV29ek_2026-11-04.md)  
**Tested revision:** `0fa97976a798263b9c937a090ef3e5629cbfc6a0`  
**Scope:** Real repository HTML rendered through three browser engines, with actual first-party responsive scripts in the direct visitor page, Editor V2 source frame and publication preview. Neither public page nor the editor application was changed.

## Verified source-specific layout mechanism

- `index.html` includes `moon-free-responsive.js`. Below its `1140px` breakpoint, the existing Home photographs move out of their added-image layer and into `.home-intro` and `.home-outside-grid`. On desktop the image nodes remain within the added layer. The runtime also adjusts the desktop performance photograph's position relative to `#outside-school`. The images are reparented, not duplicated.
- `contact.html` includes `responsive-personal-media.js`. Its currently enabled normal-page mode relocates the single portrait from the added-image layer into `.contact-background`, where CSS places it responsively. The script preserves the existing image and alternative text.

These scripts affect the delivered DOM and visual placement. Equality of the original HTML source alone cannot establish the final layout of these images. The real-page browser check therefore evaluates post-script DOM relationships and computed geometry.

## New isolated browser regression

[Commit `ebf3899`](https://github.com/gmoon-code/gmoon-code.github.io/commit/ebf3899ee1e620ecbf4af86875263de7978be68d) added two tests to `tests/editor-v2-current-website.spec.cjs`. The tests load exact checkout source bytes through mocked GitHub Contents GET responses; visitor pages themselves are independently served from the same local checkout. They compare each photo in visitor, editable and publication-preview views on desktop (`1160 × 900`), tablet (`768 × 1024`) and phone (`390 × 844`) viewports.

For each image, the checks compare its stable source ID, enclosing section, alternative text, source-string length, decoded intrinsic width and height, CSS `object-fit`, border radius and page-main-relative position and dimensions. The geometric tolerance is **4 CSS pixels**. They verify the relevant images are decoded and that visitor image counts remain two for Home and one for Contact. All unexpected GitHub write requests are intercepted and rejected. No credentials or publications are used.

[Commit `0fa9797`](https://github.com/gmoon-code/gmoon-code.github.io/commit/0fa97976a798263b9c937a090ef3e5629cbfc6a0) additionally asserted the visitor's **intended** parent placement, preventing a false pass in which direct and editor views happened to share a broken script state. Home must use the added layer on desktop and both relevant content sections at narrow widths; Contact must use `.contact-background` at all three widths.

The initial [run 41791668249](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41791668249) passed 38/38 checks in Chromium, Firefox and WebKit. The strengthened [run 41791875686](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41791875686) also passed **38/38 in each of Chromium, Firefox and WebKit, 114/114 combined**. The 114 total represents the same 38 cases evaluated in three engines. In each engine, the two new tests cover three viewport sizes on each of two pages, including both editor and preview.

**Outcome:** Within the tested source revision, desktop/tablet/phone transitions, script-dependent photo reparenting and geometry agree between the visitor page, the editable source frame and verified preview. No source-grounded mismatch called for a change to image assets, original HTML, runtime scripts or Editor V2 code.

## Historical production evidence and limitations

The previously successful [public final release snapshot, run 41790995565](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41790995565), measured **24/24 exact public-resource byte matches** at its tested source commit `856a0ec498f0393f082bd7f6bf4db2a0258ffa34`. A fresh GitHub commit comparison from that commit to `0fa9797` shows **no changed HTML files, Home/Contact responsive scripts or Editor V2 application files**. This establishes source continuity with the historically tested public files. It does not prove the exact CDN response or an actual production-browser visual capture at the time of this stage.

The browser tests operate in Playwright on Linux; they do not establish equivalence on physical iOS/Android browsers or with real assistive technologies. The previously documented same-origin GitHub token trust boundary remains unresolved. The new tests neither authenticate publication nor test owner-token handling.

## Completion and exact resumption point

**C-RV29el completed.** All six source-matched page/viewport configurations passed in each of three browser engines with source, parent-section and geometry checks. The public academic-page wording and image originals remain unchanged. The current-source editorial completion decision and distinct broader verification status are preserved.

**Next: C-RV29em | Delivered production-browser photo placement.** Verify the actual HTTPS-delivered Home and Contact files against their unchanged repository source and sample visitor-side photo placement at a few defined widths, if the available browser environment permits. Record an explicit retrieval or browser limitation if not. Do not repeat completed source-matched testing or change photo assets without a demonstrated defect.
