# C-RV28x | Fluid Layout Lab storage and selected-page preview language

**Date:** 2 November 2026. Continued exactly from [C-RV28w](INTERESTS_PUNGMUL_LEGACY_PUBLIC_DELTA_C-RV28w_2026-11-02.md) and the [master content ledger](CONTENT_AUDIT_SUPPLEMENTARY_COVERAGE_2026-11-01.md). Bounded source-verified audit of genuinely unfinished auxiliary authoring copy. This is an **editorial/content audit** of what the existing source promises, not a full functional Editor V2 retest or a claim that the authored website was publicly redeployed and checked in a browser.

## Why this source was selected

Earlier [C-RV26b](SUPPLEMENTARY_AUTHOR_HELP_AUDIT_C-RV26b_2026-11-02.md), [C-RV26c](PUBLISHER_SUPPORT_CONTENT_AUDIT_C-RV26c_2026-11-02.md), [C-RV26d](STUDIO_MODULE_CONTENT_SCOPE_AUDIT_C-RV26d_2026-11-02.md) and [C-RV26e](STUDIO_COMPONENT_GUIDANCE_AUDIT_C-RV26e_2026-11-02.md) already audited the primary `studio/index.html`, `editor-v2.html`, optional `publisher/SETUP.md` and numerous generated Studio help modules. Reopening those completed source passages would be redundant. The [C-RV26a inventory](SITE_CONTENT_COVERAGE_RECONCILIATION_C-RV26a_2026-11-02.md) separately identified `fluid-layout-lab.html` as a **noindex supplemental layout workbench whose complete copy had not yet been recertified**. Its user-facing statements about previews and browser storage could be tested against its inline implementation, giving a meaningful new coverage step.

Confirmed GitHub files:
- `fluid-layout-lab.html` before edit Git blob `a5986f9dea7c5e3d630011b87b70f9a980880266`, after final edit `12b6bb4572abec9ab6819178f825310f43e435cb`.
- `editor-v2-previews/source-index.html` blob `a014cd51bf0aca488a47cb38126206606b40813c`, a known **stored editor preview snapshot**, not the current authoritative Home source.
- `index.html` blob `bbc4cac2ddc7ce3b719b59d31529228f3cb6ba46`, current authoritative public Home.
- `editor.html` blob `2b6533e6d1523941aa29eef5ad7a889f4d93b246`, the legacy editor targeted by the Fluid Lab's permitted transfer path.
- `publisher/SETUP.md` and `studio/studio-access.js` for context only; their previously audited instructions were **not rewritten**.

## Identified misleading preview scope

The Fluid Lab has one `sourcePage` value. `freshSourceDocument()` fetches **that selected root HTML page** and parses it. `buildSiteLayoutReviewHtml()` then derives original, proposed and applied **versions of that one page**, with a `noindex,nofollow` review document, and chooses filenames based on the selected `sourcePage` (for example `*.layout-review.html` and `*.applied-review.html`). The proposed review contains a sandboxed experimental layout preview; the applied review incorporates verified text/style changes, approved responsive groups and validated insertions for the selected page. It **does not** export every page in the portfolio or write a new website release.

The previous button said **“Full-site preview file”**, the review iframe title said **“Full website with experimental layout”**, and three status messages likewise called single-page outputs “full-site”. A reader could reasonably infer that the file included the entire portfolio or changed global pages. These statements exceeded the actual `sourcePage` implementation.

**Committed corrections, exact source text:**

| Former user-facing wording | Corrected wording |
| --- | --- |
| `Full-site preview file` | `Selected-page preview file` |
| `Full website with experimental layout` | `Selected website page with experimental layout` |
| `Downloaded a full-site review of publishable text and style edits. No website files were modified.` | `Downloaded a review of publishable edits for the selected page. No website files were modified.` |
| `Downloaded full-site layout review. The live page and publishing draft remain unchanged.` | `Downloaded the selected page’s layout review. The live page and publishing draft remain unchanged.` |
| `Full-site preview blocked: ` | `Selected-page preview blocked: ` |

These labels explain the scope accurately and avoid a new claim that a downloaded review HTML is directly publishable. The interface continues to distinguish `Publishable edits` from freeform canvas proposals. Source review text still clearly states **“This downloaded file cannot publish changes”** and **“Nothing has been published”**.

## Browser storage and student-information protection

The original lab header read **“Visual layout drafts · private to this browser · unpublished.”** Although the workbench has no direct publish operation, that formulation could be read as a confidentiality or access-control guarantee. The source actually persists a JSON payload (sourcePage, content blocks and responsive layout preferences) in browser `localStorage` under `moon-fluid-layout-lab-v1`. Browser storage may be unavailable or cleared, and code on the same site origin may have access to it. The author can also **export JSON or downloaded HTML containing draft text**. A noindex directive prevents routine search indexing; it does **not** enforce authentication, encryption of draft content or guaranteed confidentiality. None of these implementation observations validates handling real confidential student records.

The header was corrected to **“Browser-local layout drafts · not published.”** The inline help changed from a categorical autosave sentence to:

> Drafts save automatically in this browser when storage is available. Avoid entering confidential student information. Use Export JSON to keep a portable backup.

These three direct, user-oriented sentences preserve the original instructional purpose while disclosing meaningful conditions without claims about individual users’ browser encryption settings. The existing code's `persistDraft()` returns false when local storage fails; the auto-save and manual-save paths display **“Browser storage unavailable. Export layout JSON…”** as their fallback, matching the revised instructions.

**Actual source changes:** First commit `9b710918cb09678c4b337d247cab12ebd1e255f1` replaced six labels/status messages, including the browser-local header. Second commit `d0617e91036923f882234447090bb41bc8c44960` qualified autosave and the use of confidential student information. Only `fluid-layout-lab.html` was edited. No handler names, code functions, storage keys, same-origin checks, CSS layout algorithms, security tokens or live published academic pages were changed.

## The stored Editor V2 preview source is not authoritative Home content

The confirmed path `editor-v2-previews/source-index.html` has the printed title **“Home | Ye Eun Moon”**, an unchanged **Home canonical URL** and a `noindex,nofollow` directive. Its `<main>` holds an **older, 3,126-character Home-like preview** that still begins with an earlier introduction, while the latest authoritative `index.html` has about **2,947 normalized static main-text characters** and materially different introductory sentences. Both were compared as actual source files. This is an **old stored preview snapshot**, not a reason to overwrite today's Home or assert that the public site reverted. Its noindex directive is **not** evidence of a private authenticated route. The preview file remains unchanged and its historical source-copy status is documented here to prevent future audits from treating it as a current academic page or as a confidential secure staging destination. Exact preview provenance and access in a browser remain unverified.

## Warranted changes, voice and scope

All changed copy is concise and grounded in a specific author action. “Selected page” is less ambiguous than “full-site”, while “browser-local” states storage location without implying a confidentiality guarantee. The new conditional autosave and student-information caution connect the purpose of the lab to its actual constraints. No formulaic rhetorical contrast, speculative technology claim, intrusive marketing language or unnecessary rewriting of well-supported existing guidance was added.

**Verification still required:** Re-fetch the final Lab HTML and archived preview by exact path. Check that all six old strings are absent and all replacements present, the browser-storage fallback and one-source-page preview generation remain in the unchanged inline implementation, and no dynamic IDs/handler names or publication token operations were accidentally modified. Validate balanced unique HTML IDs and local `href="#..."` targets if applicable. No browser end-to-end success, content privacy certification or full site deployment should be inferred from source checks.

**Exact next checkpoint C-RV28y:** Review the **Website Studio GitHub publishing-access dialog** generated by `studio/studio-access.js` against the current `studio/studio.js` token storage/publish implementation and optional `publisher/` flow. Pay particular attention to the claims **“Your unpublished drafts stay in this Studio tab”**, the **Git blob write-test** as distinct from actual page publication, token/session persistence and the user's ability to recover after replacing a token. Do not attempt real authenticated publication without the owner's explicit credentials and consent. Inspect precisely which author-facing sentences remain unreviewed after C-RV26b–e; correct only source-supported issues. Preserve all earlier scholarly work, the unresolved six Editor V2 browser failures, original final-August S2C study codes, confidential AP Biology original/rater/permission/consent records and the unresolved preferred public email.

**Overall comprehensive academic website content audit remains In progress.**
