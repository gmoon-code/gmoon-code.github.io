# Stage C-RV15 | Website Studio duplicate-page content and inherited metadata

Date **2 November 2026**. Continued from [C-RV14](WEBSITE_STUDIO_CONTACT_AUDIT_C-RV14_2026-11-02.md).

## Section read and implementation checked

Reviewed `studio/index.html` help, the create-page form and new-page versus explicit-duplicate operations in `studio/studio.js`. Compared the standard new-page source `projects.html` against the retired `about.html` redirect and Contact page. Rechecked the newly corrected `studio/pages.json` and `studio/navigation.json`.

Default new pages now inherit the lightweight non-redirecting Projects HTML. The creation routine updates title, description and canonical link using the new path, removes the prior current-page navigation marker and replaces the main content with author-entered material. That avoids the former inherited About-to-Contact redirect. An **explicit duplicate** remains a deliberately broader copy of the source page, including its references, photos and optional search-indexing metadata. Changing or deleting every such setting automatically would presume an author's intent; the appropriate editorial safeguard is a clear warning to review copied material before publishing.

## Justified wording correction

Expanded one concise help-list instruction in `studio/index.html`:

> “New pages start with a simple title and section. A duplicated page keeps its source content and may retain its search-indexing settings, so check citations, image credits and links before publishing.”

The revised message accurately distinguishes a new blank draft from duplicating another page. It makes the author responsible for checking inherited scholarly content and licence information without making ungrounded guarantees about privacy or discoverability.

Source commit [fcf3c4d](https://github.com/gmoon-code/gmoon-code.github.io/commit/fcf3c4d7fd5c11ffc384c77ecf86ff26af950018).

## Regression protection

Extended `tests/studio-author-content.test.mjs` to assert the duplication warning appears and describes inherited source/metadata ([commit ad9ac32](https://github.com/gmoon-code/gmoon-code.github.io/commit/ad9ac327cc723336a9618e4fce4530ca6c4e4455)). Updated `.github/workflows/studio-author-content.yml` to trigger when `studio/index.html` itself changes ([commit 37b7b26](https://github.com/gmoon-code/gmoon-code.github.io/commit/37b7b26b8eaf880f21458b5bb9befd30ea276d94)).

A fresh **real Node 22 GitHub Actions run** [41360606660](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41360606660) **completed successfully**. This includes the new help-text assertion alongside the Contact route and non-redirect/canonical source checks. Independently re-fetched the help page, test and workflow. Four targeted source assertions passed for the exact warning, test presence and trigger coverage. Native test success establishes code/data consistency, not authenticated browser publication, full page rendering, independent indexing state or the author's eventual manual review of a duplicated scholarly page.

## Pending and next checkpoint

The latest site code and manifest fixes are committed, with the old public About redirect preserved intentionally. Some Studio editing routes are narrower than all 26 public HTML paths; that may reflect deliberate owner tooling limitations, not necessarily a defect. Author-generated drafts and existing content remain subject to scholarly source review.

**Stage C-RV16 | Public source metadata and linked content status.** Check browser titles, descriptions, canonical URLs, and indexability across the 19 original public/legacy routes and seven supplementary authoring/tool routes against the verified source inventory. Distinguish intentional noindex tools and redirect pages from accidentally indexable archived content. Review human-authored descriptive text associated with metadata. Make only evidence-supported content changes, run targeted source checks and document exact remaining primary-record/browser verification. Do not reopen completed teaching or scholarly writing passages unnecessarily.

**Status:** C-RV15 authoring guidance corrected and re-fetched; native Node test successful; public deployment, complete browser authoring actions and unpublished manuscript primary records remain outstanding.
