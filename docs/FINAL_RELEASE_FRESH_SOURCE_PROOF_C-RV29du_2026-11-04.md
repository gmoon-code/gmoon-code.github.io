# C-RV29du | Source-matched public release audit and six supporting check reconciliations

**Date:** 4 November 2026. **Continued from:** [C-RV29dt](RESEARCH_METHODS_BACKUP_DISCLOSURE_C-RV29dt_2026-11-04.md). **Result:** Previously stale auxiliary audit-report references were reconciled against their real successful source-matched GitHub Actions runs. A narrowly scoped final-release workflow trigger correction then produced a **successful live-HTTP public-release reconciliation with 24/24 exact byte matches, zero HTTP errors and zero source-drift errors**. No academic website HTML or scholarly prose was edited during this stage. Full academic content audit **In progress**, original student/ethics/scoping evidentiary limits retained.

## Baseline and issue

At resumption, GitHub HEAD was `9abeae9a181a070aacd281cac17e108ed37d41f9`, with **26 HTML routes** in a complete nontruncated repository tree and no changed file since the C-RV29dt ledger close. The preceding S8 release report, [run 41759436451](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436451), had first recorded a public-delivery lag for the recently corrected Research Methods Studio backup paragraph. Its re-run then established **24/24 source/deployed byte matches and 0 HTTP errors**, but still failed the overall status because its checked-out source commit predated the arrival of six parallel supporting report commits.

The important distinction is *test execution versus stored report checkout*. The latest six report JSONs **already contained source-matched results** at `d8fc85d29048946910ed6fa4e7b0350f728ca57f`. The earlier S8 attempt saw older copies of the reports because that attempt was tied to the original HTML commit. Re-running that same historical checkout could not refresh its saved evidence snapshots.

## Individually verified source-matched supporting runs

All six workflows were independently fetched from the connected GitHub Actions API. Every job completed **successfully** against the same exact academic-HTML source commit `d8fc85d...`, the version containing the research-methods backup/privacy correction.

| Scope | GitHub Actions run | Saved report and observed bounded results |
| --- | --- | --- |
| Source links and navigation | [41759436405](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436405) | `PUBLIC_LINKGRAPH_LATEST_RESULTS.json` reports 19 scanned public-page sources, **556 links, 0 problems** |
| External resources and linked apps | [41759436334](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436334) | `EXTERNAL_RESOURCES_LATEST_RESULTS.json` reports **115 distinct destinations, 73 reachable, 42 unverified**; **3** separate-site application destinations reachable at the HTTP checker level. Unverified includes **41 scholarly identifiers and 1 external destination**; 403 restrictions are not proof of broken scholarly links or read originals |
| Local accessibility and CSS reflow | [41759436440](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436440) | `ACCESSIBILITY_REFLOW_LATEST_RESULTS.json` reports **54 cases, 0 failures** |
| Cross-engine public pages | [41759436426](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436426) | `PUBLIC_BROWSER_ENGINES_LATEST_RESULTS.json` reports **108 regular and 18 forced-colours checks, 0 recorded failures** in Chromium/Firefox/WebKit. **Real browser zoom remains unverified**, since headless keyboard zoom did not produce an observable change |
| Text resilience and spacing | [41759436518](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436518) | `PUBLIC_TYPOGRAPHY_LATEST_RESULTS.json` reports **111 cases, 0 failures and 0 combined-stress failures** |
| Semantics and interactive states | [41759436477](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41759436477) | `PUBLIC_INTERACTIONS_LATEST_RESULTS.json` reports **18 semantic page scans, 2 preview open/close sequences, 0 failures and 0 reported axe violations** |

The separately retained `RESEARCH_METADATA_LATEST_RESULTS.json` at older source commit `7f147...` remained valid under the final gate's **exact source-diff test**, with **no metadata-relevant academic source changes** since its run. Its evidence was not falsely represented as newly executed.

These report summaries verify only the tests each script implemented. They do not establish manual screen-reader speech checks, physical-device coverage, learning-effectiveness outcomes, independent security testing or exhaustive external DOI full-text availability.

## Narrow workflow repair and completed final gate

Inspection of `.github/workflows/audit-final-public-release.yml` confirmed S8 normally starts on HTML, CSS, JavaScript or its own script/workflow changes. It did **not** start again when parallel supporting audit JSON files finished publishing, even though S8's purpose is to reconcile their status.

Updated only the **S8 workflow trigger** in [commit `90cfc245d`](https://github.com/gmoon-code/gmoon-code.github.io/commit/90cfc245d1200b94c8226272b983bdc89ff97029) to watch the seven exact supporting report JSON files in addition to existing page/script sources. The S8 evaluation algorithm, source-file scope and documented privacy text were left unchanged. The workflow was refetched and confirmed to contain the intended trigger paths; the GitHub comparison showed this single workflow YAML change.

The resulting [fresh S8 run **41762038695**](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41762038695), at workflow commit `90cfc245d...`, completed **success**. The newly saved `docs/PUBLIC_RELEASE_FINAL_LATEST_RESULTS.json`, published in [report commit `0ba2135`](https://github.com/gmoon-code/gmoon-code.github.io/commit/0ba213531d441888634863bae1dee72700b8da47), confirms

- **24 of 24** tested public source resources matched the GitHub source bytes exactly
- **0 HTTP errors** for those resources
- A deliberately invalid nested path returned HTTP **404**, showing the custom 404 content
- **0 source-drift findings** across supporting audit reports
- **No recorded critical-audit failure** and overall `pass: true`, `exit_code: 0`

The matched resource scope is **19 public HTML routes plus five shared assets**, as defined in `scripts/audit-final-public-release.py`. The full website inventory remains **26 HTML routes**; the S8 result is not falsely inflated to a test of every nested/editor/archival route. Its exact byte result establishes successful delivery **at the tested moment**, not future CDN behavior or internal functionality of linked apps.

The recorded previously unresolved S8 failure is thus **resolved at the source/deployment audit level**, rather than merely explained away as a false alarm.

## Editorial and scholarly verification limits

The C-RV29dt addition to `research-methods-studio.html#methods-privacy` was the sole recent academic-content change and remains in the current checked source. The site did not acquire a new paragraph requiring an additional substantive rewrite at this stage. This S8 audit only resolved its *current published delivery and supporting source-regression verification*.

**No changes** were made to the Action Research study report, scoring categories, ethics-method paragraphs, multilingual-scoping evidence assignments, Home, CV, bibliography or classification/teaching essays. The retained research bibliography remains **53 entries, 46 F / 6 A / 1 M / 0 P**. The following independent evidence limits remain untouched: historically administered/scored Unit 3 form and conversion; unnormalized original student responses plus transformation ledger; dated independent reader/recode files; executed school and participant authorization; final August scoping S2B/S2C twenty-study row-level coding; and author-controlled public contact preference.

## Exact next checkpoint

**C-RV29dv | New original record, external scholarly original, or substantive source change gate.** Compare current academic HTML against `d8fc85d29048946910ed6fa4e7b0350f728ca57f`; the recent commits after it are audit/CI documentation and workflow changes. Reuse the now **successful S8 source-matched run 41762038695** and six named verified supporting runs as evidence without repeating them unnecessarily. When a genuine new original record becomes accessible, verify the matching factual/ethics/coding claim and document any justified correction. If no such evidence is available, preserve the site's correct prose and blocked research tiers rather than falsely advancing them. Whole academic-content audit **In progress**.
