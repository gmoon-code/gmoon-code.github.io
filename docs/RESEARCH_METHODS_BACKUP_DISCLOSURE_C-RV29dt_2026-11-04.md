# C-RV29dt | Linked-app backup and privacy-copy disclosure

**Date:** 4 November 2026. **Continued from:** C-RV29ds. **Disposition:** One source-grounded correction to the academic website's Research Methods Studio privacy paragraph. No other public academic copy was edited. Whole-site academic content audit **In progress**.

## New evidence and exact scope

The 26-route academic website repository was unchanged at the start of this stage, commit `d8e8dc5682889e0d856ae4582e5126382ee2a380`. The distinct unfinished evidence target was the **current linked application repository**, which was compared with `projects.html`, `research-methods-studio.html#methods-privacy` / `#methods-implementation` and `story-method.html#story-released` / `#story-implementation`.

[Research Methods Studio README at commit `94b9213`](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/README.md), [actual `assets/pilot.js` source](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/assets/pilot.js), [visible Pilot & Recovery UI text](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/assets/pilot-ui.js) and [regression-test source](https://github.com/gmoon-code/research-methods/blob/94b9213ca7d4ad968c7fc9bfb02e253e4b162255/tests/pilot-limited-summary.test.mjs) establish the following first-party implementation distinctions. A full JSON recovery backup may include project details, raw data, research notes and Chat history. A separate limited progress summary excludes notebook text, cannot restore a project and is not guaranteed anonymous. The current app UI warns that older files labelled privacy copies may still contain detailed notebook text or Chat history. These are **source- and test-level observations**, not an independent security audit or confirmation of real browser deployment.

The site's previous `#methods-privacy` paragraph described browser-local notebook data, Word-compatible `.doc` export, JSON backup and optional networked Research Chat, but did not disclose these substantive file-sensitivity and restore distinctions. Readers working with participant data could reasonably benefit from them.

The current [Story Method README at commit `0615a01`](https://github.com/gmoon-code/memory-palace-u1-8/blob/0615a01f80cde6aa97dd02dfa5d1a9012bf434e7/README.md) continues to document eight frozen AP Biology units, 58 guided journeys and 448 permanent scenes, aligning with the academic project's released-course claims. Recent work on an authoring editor does not itself change those learner-curriculum totals. No Story Method academic-page rewrite was warranted.

## Implemented correction and verification

[Public academic source edit `d8fc85d`](https://github.com/gmoon-code/gmoon-code.github.io/commit/d8fc85d29048946910ed6fa4e7b0350f728ca57f) changed only `research-methods-studio.html` and added the following three sentences after the backup reference.

> A full recovery backup may contain research notes, raw data, and Chat history. The separate limited progress summary cannot restore a notebook and should not be assumed anonymous. Earlier downloads labelled as privacy copies may also contain detailed notebook text, so exported files need careful handling.

The earlier combined paragraph was divided into two, preserving the existing Research Chat data-minimization explanation and participant-data cautions as a coherent following paragraph. The correction uses Canadian `labelled`, avoids em dashes and ordinary-prose colons, and does not assert that files are fully anonymized or that security is independently established.

Independent original-GitHub source refetch confirmed **exact intended full-page text**, all three disclaimers, retained Research Chat cautions and one `id="methods-privacy"` section. GitHub compare from `d8e8dc5` to `d8fc85d` showed **one changed file**, with **2 added lines, 1 deleted line**, and no other site content or application files changed by this commit.

Direct web retrieval of both linked published applications failed in the initial web-tool environment. That did not establish a live-site outage. Both application repositories were source-read at their named commits. Subsequent public academic-page delivery evidence is documented below, separately from the linked applications' runtime behaviour.

## Subsequent CI delivery and documentation evidence

The first S8 public-release attempt at [GitHub Actions run 41759436451](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436451) began before the new site source propagated to GitHub Pages. It recorded **23/24 exact HTTP byte matches**, with the deployed `research-methods-studio.html` still presenting the older backup paragraph. That result was a real point-in-time delivery mismatch and was not misclassified as a permanent outage.

After a later [successful Pages deployment of the current documentation-head commit](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759705093), the **second attempt of that same S8 run** directly checked the public deployment and recorded **24/24 exact served/source byte matches and zero HTTP errors**, using source head `d8fc85d29048946910ed6fa4e7b0350f728ca57f`. Because no academic HTML file changed after that source commit, this verifies delivery of the revised backup paragraph at the tested moment. The **overall S8 job still reports failure**, solely because separate link, external, reflow, browser-engine, typography and interaction audit snapshots refer to an earlier source revision. Their prior assertions cannot be transferred automatically to the changed page. A passing static byte check is not a live-browser accessibility, screen-reader, application-security or learning-effectiveness certification.

Separately, [documentation-link check 41759705401](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759705401) detected an inherited ledger formatting violation, in which the earlier C-RV29ds historical note had appeared *under* the one-paragraph next-stage heading. The note was moved above that heading without altering its content in [commit `7d996c2`](https://github.com/gmoon-code/gmoon-code.github.io/commit/7d996c238aa4be2a98281f458ff513285534cf5a). [Fresh documentation-link run 41759961824](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759961824) then **passed**. This documents the genuine structural correction without claiming new scholarly evidence.

## Preserved research and next evidence boundary

No action-research original student scripts, scored Unit 3 administered form, historical transcription transformation, signed permission/consent, independent reader source records or final August 20-study scoping S2B/S2C coding matrix was independently authenticated. Research reference register remains **53 entries, 46 F / 6 A / 1 M / 0 P**.

**Exact next checkpoint C-RV29du | Evidence-triggered continuation after linked-app privacy correction.** Compare new academic source against `d8fc85d`. Check for actual new original evidence or changed copy. The revised paragraph has passed independently executed public HTTP byte parity as detailed below, while application runtime behaviour, newly modified source-specific auxiliary test coverage and original research documents remain outside the verified scope. Avoid resuming already completed source or editorial reviews without a concrete new evidentiary target.
