# Stage C-RV27b | Third historical S2C record, visitor assertions and deployment parity boundary

**Date:** 2 November 2026. Continued from [C-RV27a](SCOPING_LEARNER_PROFILE_VERSION_RECONCILIATION_C-RV27a_2026-11-02.md), preserving the prior original-publication work in [C-RV21d](SCOPING_S2C_SOURCE_CROSSWALK_C-RV21d_2026-11-02.md) and [C-RV21e](SCOPING_S2C_FINAL_PROFILE_WARRANT_C-RV21e_2026-11-02.md). This is a source/content integrity audit, not an intervention study, author recoding, or a claim of public web parity.

## Additional original workbook inspected

Project/Library search recovered the **15 July 2026** original `Master Screening and Coding Ledger(1).xlsx`. Its private raw XLSX was inspected using the spreadsheet artifact toolkit, selecting `S2C Learner Profile!A1:M24`. The sheet contains **20 distinct S01–S20 study records**. Independent counting of exactly `Reported comparably` returned:

| S2C dimension | 15 July original ledger | 14/16 July supplementary snapshots | 12 August manuscript and current HTML |
| --- | ---: | ---: | ---: |
| Broad multilingual label/language arrangement | 20 | 20 | 20 |
| Focal language condition | **14** | **14** | **18** |
| Programme/instructional placement | **5** | **5** | **7** |
| Prior schooling | **0** | **0** | **3** |
| Newcomer status | 1 | 1 | 1 |
| Comparable biliteracy trajectory | 0 | 0 | 0 |
| Comparable earlier disciplinary language exposure | 0 | 0 | 0 |

The 15 July ledger's focal-condition positives were S02, S03, S04, S08, S09, S10, S12, S13, S14, S15, S16, S17, S18 and S19; placement positives were S06, S08, S09, S16 and S19; its only newcomer-positive row was S02. The 15 July data therefore agree with both previous supplementary snapshots. This is **three mutually consistent July historical copies, not an independent August coding warrant**. A final August S2C spreadsheet or row-by-row recoding memo was not found in the bounded Project/Library search. The original source-level recoding candidates documented in C-RV21d–e remain distinct from verified author row assignments. No historical workbook, student response, or private document was uploaded to the public repository.

**Editorial decision:** leave `research-scoping.html` and its 18/7/3/1 August manuscript summaries unchanged; the precise final author mapping is **Blocked, original evidence version unavailable**. No unsupported study-ID assignments were fabricated.

## Stale content assertions in the visitor test

Compared the current GitHub `research-scoping.html` blob `cf0eaaa192876264d47f57ea9b30ffec36e84ebb` with the actual assertions in `scripts/audit-scoping-visitor.py`. The page has **10 written / 6 talk / 4 model** primary evidence-route cards and the five learner-reporting table rows **20 / 18 / 7 / 3 / 1**. The visitor script still expected the older **8 / 7 / 5** route values, the older **20 / 14 / 5 / 1** reporting rows, four row headers, and stale printable text tokens. Its assertion data no longer described its tested academic page. The older values in the dated October audit report are historical, not current claims, and that report was not rewritten.

Four focused corrections were committed in [commit b18479b](https://github.com/gmoon-code/gmoon-code.github.io/commit/b18479bb914a8145dc664b5af85abe94b0b437d9):

1. Primary evidence-route expected cards now **10 / 6 / 4**.
2. Learner-reporting table expected rows now **20 / 18 / 7 / 3 / 1**.
3. Expected row headers now **five**.
4. A4 printed-text required tokens now include the current **18 / 7 / 3** entries.

The published research HTML was **not** changed. The corrected script was re-fetched at Git blob `3a37d4793dba6a11b08a1c71934b7c222cbfd6c4`, and **7/7 source correspondence checks passed**, including explicit absence of the previous expectations and confirmation that the research page retained its original blob SHA.

## Public delivery and visitor-audit verification boundary

Direct public fetch attempts for `https://gmoon-code.github.io/research-scoping.html`, `research-action.html` and `teaching.html` returned **not accessible** in the web interface. The audit container's public hostname request failed DNS resolution. These failures are **access limitations of this audit environment**, not proof that the website is offline.

The GitHub Actions history showed an earlier successful Pages deployment at [run 41387270149](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41387270149), which establishes workflow success but not a direct byte-for-byte text comparison. The new script commit triggered a **Scoping review visitor audit** [run 41388978977](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41388978977) and **Pages deployment** [run 41388978426](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41388978426), both still **in progress at the initial verification check**. Importantly, the visitor workflow starts a **localhost** HTTP server for the checked-out source. Even a successful Chromium audit is **source-runtime verification, not remotely delivered GitHub Pages parity**.

The current `research-action.html` and `teaching.html` source blobs were re-fetched and compared with previously completed C-RV25 stage records. Their source-level claims remain qualified: action research in one 28-student class, three biologically different questions and noncausal comparisons; hypothetical teaching sequences identified as proposals. No new defensible public prose correction was identified during this bounded cross-page recheck. This does not reopen or certify a complete independent empirical audit.

## Exact continuation

**C-RV27c:** Check final outcomes of the new visitor and Pages workflows without assuming pending checks succeeded. Seek an actual independent HTTP/HTML text comparison from a network-enabled environment for `research-scoping.html`, `research-action.html` and `teaching.html`; if unavailable, retain **Blocked, public served-content parity** while pursuing another narrowly specified outstanding original-source or author-facing content issue. Preserve the C-RV21d–e finding that 7/20 instructional placement lacks a verified final author-coded study roster, the original AP Biology response/consent/rater records as separately blocked, and all already verified source revisions. No final whole-site Fully verified claim.

**Overall comprehensive academic website content audit: In progress.**
