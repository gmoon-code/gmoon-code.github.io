# C-RV29av | Public delivered-site parity reattempt with explicit access failure boundary

**Date:** 3 November 2026, approx. 14:10–14:20 KST. **Continues from:** [C-RV29au](CURRENT_26_ROUTE_CONTENT_COVERAGE_DELTA_C-RV29au_2026-11-03.md). **Status:** Public delivered-site **HTML and browser parity remain independently unverified**, despite working authenticated GitHub source access and an earlier successful Pages build. Multiple actual external retrieval attempts failed **before response bytes** and therefore cannot establish either that the site is down or that the deployed content is identical to the repository. **No website edit made.**

## Distinct retrieval attempts

**1. Web public-page reader:** Explicitly requested all four live URLs in one bounded retrieval:

- `https://gmoon-code.github.io/`
- `https://gmoon-code.github.io/research.html`
- `https://gmoon-code.github.io/research-action.html`
- `https://gmoon-code.github.io/writing-biological-classification.html`

The web reader returned **“URL ... is not accessible via this tool”** for each of the **4/4**. This is a **tool access failure**. It is **not** an HTTP status response proving 404/403/5xx, not an independently fetched live page, and not a negative test of JavaScript or styles.

**2. Independent runtime HTTPS attempt:** Executed a bounded Python stdlib `urllib.request.urlopen` call to `https://gmoon-code.github.io/research-action.html` with an eight-second timeout and browser-style user agent. The runtime returned `URLError: [Errno -3] Temporary failure in name resolution`. It obtained **no public HTTP status, response headers or page body**. This is a network/DNS limitation in the audit environment, **not evidence that the user's site itself failed DNS resolution for real visitors**.

**3. Authoritative GitHub repository and GitHub Actions records (different kind of evidence):** The repository source `research-action.html` has independently fetched blob **`80277bba0aa0ad715be87865e5a30e609b419147`** and contains both rigorously reviewed C-RV29ap/aq text revisions. The GitHub Actions runs listing, obtained on 3 November 2026, showed:

| Workflow run ID | State observed | Commit | What it can establish |
| --- | --- | --- | --- |
| [41583023946](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41583023946) | Completed, **success** | `16dacddeb4df13f2de4b79839c98096040b29eeb` | A Pages **build and deployment workflow** completed for a source revision that followed the two public research-text changes. It does **not verify delivered HTML/DOM**. |
| [41583205261](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41583205261) | Completed, **cancelled** | `a7973f84183fdb688756e3865b40447202bf07c7` | A superseded queued documentation-only deployment, **not** proof of overall site outage. |
| [41583234639](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41583234639) | **Queued** at observation | `36cf82c64a3ff657a15d7ba143cfaa928b6d2b0d` | Workflow state only. Its later outcome was **not known at observation** and should not be guessed. |

No claim is made that a successful workflow alone proves page-content parity, correct fonts/images, actual browser rendering, working internal navigation, accessibility or Editor V2 functionality.

## Version-specific parity markers to test when external read access exists

Direct public read-only retrieval should search for these current committed text strings:

1. **Action Research table:** `Later reconstructions added missing causal connections or extended earlier pathways through to plant death.`
2. **Action Research paraphrase source notice:** `These descriptions paraphrase the de-identified records retained for analysis and are not verbatim excerpts.`
3. **Research opening:** `In a biology lesson, students may examine a simplified diagram` rather than the retired imagined-classroom opening.
4. **Classification essay:** Current page identified by `writing-biological-classification.html` source blob `3dc0d45bfc2ac3257eb3e079bb28f36c107e3094`; compare relevant revised paragraph using the actual source rather than just its file name.

Matching snippets would support **public content consistency at a sampled textual level**. It would still not by itself verify every live page asset, interactive element, responsive CSS or a complete rendered DOM. A full production audit would require actual direct HTTP/browser access with evidence capture, which this stage could not obtain.

## Editorial interpretation

No substantive factual inconsistency was identified from the failure to fetch. **Do not modify stable published content merely to compensate for tool-side DNS or retrieval restrictions.** Continue to label production parity as **Blocked by audit environment**; underlying site availability to real users **not determined**.

Other independent material boundaries are not resolved by deploy status: 16 versus 26 September AP Biology retained response wording, original classroom transcripts, school director and participant/guardian consent records, later independent reader logs, final August scoping-review S2C row-level source, inaccessible publisher originals, current editorial manuscript system status, owner-decided contact email, and six known Editor V2 browser regression tests.

## Exact next checkpoint

**C-RV29aw | Current source-status ledger synthesis and evidence tier clean-up.** Review all stage documents created since C-RV29ao, the 53-reference current Research source register and the living current checkpoint. Check for **overstated tier labels**, mutually contradictory counts or source-authentication implications in the audit documentation, not just in public copy. Fix only proven documentation mistakes while preserving historical audit reports and their original evidence snapshots. Keep the current source blobs and direct-versus-author-reported distinctions exact. Do **not** retest already blocked live URLs repeatedly without a new access path or external evidence, and do not claim completed whole-site verification.
