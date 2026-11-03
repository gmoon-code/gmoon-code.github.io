# C-RV29da | Corrected academic production byte parity recovered without erasing stale audit status

**Date:** 3 November 2026. **Continued from:** [C-RV29cz](UNIT3_ORIGINAL_EXAM_FILE_BOUNDARY_C-RV29cz_2026-11-03.md). **Scope:** Actual changed production Git files since the verified AP Biology wording correction, recorded public release and supporting audit result provenance, independent strict HTTPS rerun, and linkgraph-sensitive equivalence. **Outcome:** The full current production file set is unchanged in the Git history since the corrected HTML revision, and a fresh runner proved exact byte equality for 19 public HTML pages and five shared assets. The composite S8 run **remains formally failed** due the old checkout's source-drift test, not an observed current public-file discrepancy.

## Repository and historical baseline

At the opening of this stage the master checkpoint was **C-RV29cz**. The complete, non-truncated recursive Git tree had **26 HTML routes**, including 19 S8 public release routes and seven auxiliary/authoring entries. A full Git compare from **`7f147beca823e70fae2b20ddd1d5881034402f13`**, where the last two unsupported item-point assertions were corrected, to current post-rerun commit **`cfb00cba4c132941092db4cc475f320de497675d`**, covered **23 descendant commits**. The files changed in this interval were audit documentation and the AP Biology visitor-audit Python check. **No file in the S8 list of 19 HTML files and five shared CSS/JS assets changed.**

The prior [C-RV29cu](AP_BIOLOGY_PUBLIC_DELIVERY_RECONCILIATION_C-RV29cu_2026-11-03.md) run established **16/16** sitemap-listed academic pages returned HTTP 200 and matching normalized static main text, after an initial temporary AP Biology deployment lag. The separate S8 release machine record at first attempt of run `41646697728` remained **23/24 byte matches**, because it caught the public page still serving the earlier AP Biology wording.

## Fresh exact byte-level public check

Triggered a re-execution of the **failed job** of [GitHub Actions S8 run 41646697728](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41646697728) rather than inventing a successful result from an earlier mismatch. Its **second run attempt**, actual job **125983384304**, checked the exact source commit **`7f147bec`** after production deployment settled. Source and public bytes were compared directly, using independent HTTPS requests with cache-busting query parameters and exact SHA-256/byte comparison.

The newly archived machine result reports:

- **`deployedChecks: 24`** for all **19 public HTML routes + 5 shared style/script assets**.
- **`verifiedExactMatches: 24`** with **`httpErrors: 0`**.
- A nested missing route responded **404**, with the expected custom “Page not found” and “Return home” source copy and **no errors**.
- Its **`pass: false`** remains intact. The only error is a **`sourceDrift`** assessment referring to seven inherited source-audit reports from the old run's checked-out commit. The rerun did **not** say that any currently deployed file was mismatched.

A new [`docs/PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json`](PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json) was committed automatically by the original workflow, preserving the source-provenance limitation and successful byte-equality observation together. Its true overall state is **failed**, so the formal composite S8 check must not be called a passing run.

## Reconciliation of conservative report provenance

At the current branch head, recorded metadata, external, reflow, browser engines, typography and interactions reports reference and passed at **`7f147bec`** (their reported source revision matches the exact production source). The linkgraph report alone still explicitly references earlier source commit **`44f4370`**.

Directly re-fetched the actual `teaching-ap-biology.html` blobs at `44f4370` and current. The entire **192-line** source differs at exactly **two lines**, lines **102 and 165**, representing the known replacement of scoring prose in C-RV29ct. A structural comparison of the relevant links/asset tags and their href/src/srcset/poster/rel/target attributes showed **42/42 matching tagged elements**, **46/46 matching tracked attributes**, and identical **16 IDs**, H1 count and main count. The two differences contain paragraph text only; they do not alter the navigation/asset/fragment graph that the earlier passing linkgraph scan checked. This is a **bounded independent structural reconciliation**, not falsely presented as a new current-head GitHub Actions linkgraph run.

The S8 rerun checks out the original `7f147bec` commit and consequently retains the older versions of the seven report files from that historical revision. It does not automatically incorporate later CI-uploaded reports, which explains why its source-drift guard remains unsatisfied even though the fetched public bytes all match.

## Other external-resource interpretation

The current externally hosted resource report counts **115** distinct destinations, with **71 reachable and 44 unverified** by that runner. Of the 44 unverified, **42 are scholarly identifiers commonly resolving to publisher access restrictions or timeouts**, and two are direct non-DOI citations. A **403** after DOI redirect is not proof a DOI is invalid. No scholarly link was removed or modified merely because a crawler received 403.

One non-DOI Wiley original-article URL cited on the Scoping page is independently indexed as Pierson, Clark and Brady (2021), *Scientific modeling and translanguaging*, *Science Education* 105, 776–813, DOI 10.1002/sce.21622. The other, a Korean Citation Index record on the Pungmul page, is independently indexed with its original Korean article title, Park (2014), `실천민속학 연구` 23, 115–163, record ART001857639. The source pages were re-fetched and their citation context matches those article identities. An index/publisher page being identifiable elsewhere does **not** establish that the URL opened successfully in the prior CI runner or will load for every reader. Direct KCI opening can time out while its indexed bibliographic record remains authentic.

## Editorial and verification status

**Published academic copy edits:** None. There is no new source content problem to correct, and no reason to undo the manuscript-attribution and scoring fixes. The current exact production source has independent **24/24 public byte equality** evidence, distinct from **16/16 normalized scholarly text parity**, local browser/print tests, and the **26-route historical bounded Chromium navigation coverage**.

**Still blocked:** Complete authenticated publisher or independent app access for every external destination, physical-device/browser zoom/screen-reader verification, authenticated editor publishing, original Unit 3 administered assessment/marks, student answer facsimiles and textual transformation history, executed permissions, and final August scoping row-level source coding. No stage infers these are absent or false.

The 53-item scholarly register remains **46 F / 6 A / 1 M / 0 P**. The comprehensive academic website audit remains **In progress**.

## Exact next checkpoint

**C-RV29db | Two direct external citation URLs and source-context accuracy.** Distinguish authentic scholarly citation identity from robot-limited access using the exact KCI and Wiley original web records, compare their explicit research claims with the Pungmul and Scoping page prose, and document any real citation/title/interpretive mismatch. Do not replace correct links solely because automated HEAD/GET receives 403, 405 or a timeout. If no public error is found, preserve this as a bounded citation-source verification and choose a genuinely new claim on the next continuation.
