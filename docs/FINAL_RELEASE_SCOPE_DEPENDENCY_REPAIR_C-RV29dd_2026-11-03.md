# C-RV29dd | Exact public-release success after scope-correct audit dependency reconciliation

**Date:** 3 November 2026. **Continued from:** [C-RV29dc](GALLERY_SOURCE_FIXTURE_UPDATE_C-RV29dc_2026-11-03.md). **Scope:** Final public-source byte-parity workflow, scientific citation correction, current academic linkgraph/external-result evidence and the metadata audit's actual page scope. **Result:** A verified logic error in the S8 audit's dependency freshness check was corrected. A newly triggered S8 run independently **passed with 24/24 exact public byte matches, zero errors, no source drift and an accurate custom 404**.

## Why the earlier complete release check remained failed

At C-RV29da a real GitHub Actions runner fetched all **19 public-release HTML routes and five CSS/JavaScript assets** as exact public HTTP bytes and found **24/24 matches**. The overall S8 run nevertheless remained failed on an inherited source-report freshness guard. At C-RV29db, the correction of one KCI link on the Pungmul page triggered another S8 run during deployment lag, initially reporting an older Pungmul HTML object; a later rerun proved **24/24 exact matches**, but the aggregate report still marked drift.

A direct review of `scripts/audit-final-public-release.py` found the cause of the persistent remaining false staleness. Its `recorded()` routine evaluated changes across **all 19 public HTML routes and five shared assets** for *every* supporting audit report, even when the audit did not read those pages. The actual scholarly metadata script `scripts/audit-research-metadata.py` has a defined list of **nine** academic source pages. `pungmul.html` is **not in that list**, and the KCI URL edit did not modify a paper, DOI or preprint citation in any of those nine pages.

Thus, the S8 routine wrongly treated the unrelated Pungmul link replacement as invalidating the last successful metadata report, despite its input files being identical across that report's recorded source commit and current production.

## Narrow test-only correction

In `scripts/audit-final-public-release.py`, added an exact `METADATA_HTML` list corresponding to the nine pages read by the original metadata checker, and changed the source-change inspection to use that list **only when evaluating the metadata report**. Other supporting report checks retain the pre-existing complete public-release source scope, so the correction does not waive a real content change to other audited pages, ignore a failed metadata result or relax public byte equality.

**Commit:** [`d0e8d06d`](https://github.com/gmoon-code/gmoon-code.github.io/commit/d0e8d06d9f2f0222627cabc1ee7b2590479b7fed). Exact script blob **`8fc7c584988663090d43ee2213a3b44ad784bbcc`**.

The independent report files produced after the KCI correction had already recorded successful current-source checks for the public linkgraph, external URLs, reflow, browser engines, typography and interactions. Only metadata remained at the preceding academic source revision, which was appropriate because no metadata-audited HTML had changed. The previously updated gallery script also passed a separate **10/10** actual public byte check of both pages and seven distinct original photographs.

## Actual successful public workflow

The code change triggered [GitHub Actions S8 run **41657139378**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41657139378) at exact source revision `d0e8d06d9f2f0222627cabc1ee7b2590479b7fed`. Its completed job **125990350808** was **success**, and the archived [current machine release record](PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json) confirms:

- `pass: true` and `errors: []`.
- `deployedChecks: 24`, `verifiedExactMatches: 24`, `httpErrors: 0`.
- `sourceDriftSinceAudits: []`.
- Nested nonexistent route returned **HTTP 404** with the expected custom “Page not found” and “Return home” text.
- All required recorded supporting audits met the release checker’s source/failure conditions.

The current [Pungmul linkgraph audit 41655799407](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799407) at the changed HTML source had **556 links, 93 checked asset references, no problems or advisory issues**. The [external source audit 41655799495](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799495) returned **73 reachable and 42 unverified** external destinations, with the corrected official KCI article-landing URL no longer listed as unverified. The [Pungmul visitor audit 41655799348](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799348) and [final seven-photo/HTML byte check 41656308850](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41656308850) also passed.

## Editorial and evidential boundaries

**No additional academic paragraph, citation, image or CSS was edited during this stage.** Only the final-release audit script changed. The Pungmul citation correction remains in [C-RV29db](PUNGMUL_KCI_LINK_DESTINATION_C-RV29db_2026-11-03.md), and the test-fixture correction in [C-RV29dc](GALLERY_SOURCE_FIXTURE_UPDATE_C-RV29dc_2026-11-03.md).

This latest S8 pass verifies **actual public HTTP byte parity at a particular point**, not perpetual website availability. Its 19 HTML files do not include every auxiliary authoring/preview route in the 26-route repository. Independent earlier browser checks covered those auxiliary routes at bounded viewport states. No automated action here can establish physical-device screen-reader experience, native zoom, authenticated Editor V2 production publishing, permission signatures, original student-work facsimiles, or the final August scoping study matrix.

All four earlier and current run states are preserved as real time-specific evidence: first initial mismatches during Pages propagation, later **24/24 byte matches** with stale report provenance, and now a **fully passing source-scoped composite release audit**. There is no basis to rewrite the past failed runs as successes.

**Whole academic website audit:** In progress. **53-item scholarly source register:** **46 F / 6 A / 1 M / 0 P**, unchanged.

## Exact next checkpoint

**C-RV29de | Fresh academic-source or page-delta first, then evidence-supported scholarly content.** Reconcile latest actual Git changes to public and supplementary routes against the now passing complete-release source; do not repeat already closed Pungmul citation and gallery test investigations. Give priority to newly retrieved original research data, genuinely changed academic prose or independently accessible substantial previously restricted scholarly article bodies. Keep original Unit 3 instrument/scoring and student/ethics record evidence, final August scoping S2B/S2C and any author-controlled contact choice explicitly blocked until proper evidence or preference becomes available.
