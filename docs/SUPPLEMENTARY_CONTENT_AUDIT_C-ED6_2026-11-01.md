# Supplementary content audit | C-ED6

Date 1 November 2026. Continued from C-ED5. Content-only supplementary route review.

## Source inspected

Read descriptive labels and help in `fluid-layout-lab.html` and historical `editor-v2-previews/source-index.html` in the academic website repository. Compared the existing main-site renewed audit, current Home source and the content boundaries established in the editor source-review stages.

## Findings and change

The fluid layout experiment describes its draft as unpublished, explains local JSON export and how restricted content/style edits might transfer to another editor, and already has a `noindex,nofollow` directive. It does not claim its preview is the current academic site, and no justified wording change was identified at this stage.

The `editor-v2-previews/source-index.html` file is an archived Editor V2 source preview of Home. It retains earlier wording including `worked synthetic experiment` and an older Interests-page description, while the current root Home has received subsequent editorial corrections. It also retained the Home canonical URL and had no robots no-index directive. Because this is a source fixture, its older text was intentionally **not** rewritten to mimic the latest Home. Added `<meta name="robots" content="noindex,nofollow">` to reduce the chance that this archived preview is surfaced as the current public scholarly biography. This metadata is a discovery boundary, not an assertion that external search engines have already removed it.

Commit [e3938d5](https://github.com/gmoon-code/gmoon-code.github.io/commit/e3938d5474bc8c3708a0859aef0dcbb6caa61fb8).

## Verification

Re-fetched both files. Seven source assertions passed verifying the archived preview's new no-index directive, preservation of older fixture text, the Fluid Lab's existing no-index and unpublished status, its draft description and JSON export guidance. No direct live served-page fetch or browser search indexing inspection was possible. The original Home remains as reviewed; it was not modified.

## Ongoing cross-cutting QA

C-ED5 recorded genuine failures in browser regression tests for Editor V2 on an earlier commit. The original test job logs show failures with image effects, photo-format copying, matched widths, multi-selection, text-save/mode switching and reserved text reflow. These should be triaged through functional QA with the exact failing cases and artifacts; no claim of full editor/browser verification is justified. The separate content-bank Node suites passed on their tested commits.

## Exact next checkpoint

**Stage C-ED7 | Other supporting documents, editor guidance and public route status.** Review any discoverable downloadable documents, captions or source materials linked from the public academic pages. Reconcile the supplemental inventory against actual current links and existing renewed audit records before revisiting factual verification of the action research manuscript and scoping review source corpus. Preserve the fixture and editorial history, prioritize evidence-backed source-to-claim checks, and avoid unnecessary rewrites of already strong prose.

**Status:** Scoped supplementary source and metadata checks passed 7/7, one non-indexability correction committed. Full empirical/citation and live-browser audits remain in progress.
