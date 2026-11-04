# C-RV29dn | Website Studio shared-footer publication would replace tailored Contact and CV copy

**Date:** 4 November 2026. **Continued from:** [C-RV29dm](ACADEMIC_AUTHORED_PROSE_STYLE_SENTINEL_C-RV29dm_2026-11-04.md). **Scope:** Genuine unreviewed interaction between dynamically generated Website Studio Header & Footer guidance, the actual publication hook, the current Contact and CV authored footers, the Studio manifest and the distinct 404 publishing scope. **Result:** Added an explicit, precise warning to the authoring dialog. No public academic-page text, chosen email address, publication algorithm or page imagery was changed. The source-level regression independently passed **6/6**.

## Current source, distinct intended messages, and publication scope

The academic website Git head at the beginning of the stage was **`5603f9c108e600a8dfd9401f9d17a541e3b62665`**, unchanged from the preceding saved checkpoint. The original complete non-truncated Git tree contained **26 HTML routes** and current through-stage scholarly reference grades **46 F / 6 A / 1 M / 0 P**.

A focused examination of `studio/studio-chrome.js` (original blob **`4800d58d109b19e5075f205f91c94dbce125285b`**) showed that the generated Header & Footer dialog told editors only that changes would appear on public pages. The source's `beforePublish` hook actually walks all entries of the current `studio/pages.json` manifest, **plus `404.html`**, and replaces the first paragraph in each page's `footer.site-footer .site-footer-inner` with the configured shared text/link settings when the corresponding draft is dirty.

Both **`contact.html`** and **`cv.html`** are in the manifest. Their currently published footers differ intentionally from the default shared footer:

- **Contact**, original blob **`ac42543da2d79999e1eb93bff6759e6095022b56`**, closes with the gentle page-specific sentence **“Thank you for stopping by.”**
- **CV**, original blob **`601707af9ca4fb7d4746c6d1d2525bdf3f081a74`**, invites readers to **“get in touch”** through an actual `href="contact.html"` link. This is a deliberate different link destination from the generic footer's public `mailto:` link.

A shared-footer publication can erase both custom endings, even though the dialog made no explicit mention of their page-specific form. It would also apply to the **404 page**, outside the manifest. This is an independently supported author-facing editorial risk, not evidence that any user has already published an unwanted change or that the existing live footers are broken.

Earlier [C-RV26d](STUDIO_MODULE_CONTENT_SCOPE_AUDIT_C-RV26d_2026-11-02.md) correctly limited its claims to Studio-listed pages and recorded the `404.html` batch. It did not address the **specific loss of the Contact thank-you and CV's Contact link**. This stage adds that missing consequence without reopening manifest membership or inventing a preferred public email address.

## Minimal and style-consistent correction

Changed **only the dynamically generated help paragraph** in `studio/studio-chrome.js` to read:

> Publishing updates the header and footer on Studio-listed pages and the 404 page. It replaces the Contact page’s current thank-you footer and the CV footer’s link to Contact. Review those pages before publishing. Menu links are edited in Navigation. Leave both fields of an optional footer link blank to remove it.

The wording states the actual publication scope and specific source-dependent consequence, gives a concrete review action and leaves the existing optional-link guidance intact. It uses restrained, direct prose, Canadian English, no em dash, no irrelevant promotional language, and no invented behaviour. It does **not** alter the underlying publication hook, selected contact details or the intentionally authored public footers.

Source commit [**`78e0b81`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/78e0b81adaf54b2f5c104a132322aa84f860da8b), new `studio/studio-chrome.js` blob **`54c42587245406a928a3fcfa25c3e51edccfab7d`**.

## Independent regression and coverage

Extended existing `tests/studio-author-content.test.mjs` with a sixth test asserting that **both pages are in the manifest**, Contact contains its exact existing thank-you footer, the CV contains the actual link to Contact, the generated dialog names both replacement effects and the **404** scope, and source publishing still replaces the footer paragraph. Also syntax-parsed the actual Studio Chrome JavaScript. Updated the existing Studio source-content workflow path triggers to include `studio/studio-chrome.js` and `cv.html` so future changes to either source rerun the check.

- Test commit [**`54ecf99`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/54ecf9930f13555b7bc4a107d1a6a8667784d112).
- Workflow trigger commit [**`e52b6a4`**](https://github.com/gmoon-code/gmoon-code.github.io/commit/e52b6a4303014584bd5fb5a6309b0a0f7c7a1cfd).
- Actual independent [GitHub Actions run **41750326678**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41750326678), job **126313532652**, completed **success**. All **six test cases passed** with **zero failures**, including the new case.

The original existing site HTML, Contact/CV page source, research, student data, source bibliography, photography and publication logic remain unchanged. The code-level result verifies the new generated wording and preserved source, **not an authenticated live publish/revert cycle or public-CDN delivery of the modified Studio script**. Direct external retrieval of that JS from the web reader was unavailable in this stage; no public byte-parity claim is made.

## Remaining and next stage

The historical student assessment/mark conversion, primary student text transformations, signed school/participant permissions, independent reading logs, final August scoping study row-level S2B/S2C matrix, and owner-selected public contact address remain separate **Blocked** evidence items. No original research source tier was changed. The comprehensive academic website content audit remains **In progress**, with scholarly register **46 F / 6 A / 1 M / 0 P**.

**Exact next checkpoint C-RV29do | Source-change triage and reader-visible published authoring guidance.** Check the exact current repository diff and whether the now-tested generated Studio warning has reached the public site before claiming production delivery. Where feasible, use independent HTTPS retrieval or bounded CI parity of the *exact JS file*, keeping authenticated publication tests outside scope. After that, prioritize a new original scholarly evidence source or a genuinely unreviewed academic-page statement, and do not repeat the already source-verified prose, footer and software cases without new evidence.
