# C-RV29bw | Public supplementary HTML delivery and read-only landing states

**Date:** 3 November 2026. **Continued from:** C-RV29bv. **Scope:** all eight remaining supplementary routes in the 26-HTML-file repository tree. These are a legacy redirect, public editor-directory and authoring-tool entry points, a dynamic writing exercise, an intentionally historical preview and an experimental layout utility.

## Route classification before testing

| Route | Classification and observed entry |
| --- | --- |
| `about.html` | Legacy HTML redirect. Browser lands at Contact with its current heading. Original redirect HTML still serves independently as a real source file. |
| `editors.html` | Search-excluded directory of three website-specific authoring entries, with separate scopes and publication controls. |
| `editor.html` | Older visual editor, not ordinary academic reader content. Public landing only; publication and image positioning not retested here. |
| `editor-v2.html` | Academic Editor V2 public entry; editor mutation, GitHub authorization, persistent drafts and publishing covered by separate tests, not this read-only visit. |
| `studio/index.html` | Website Studio author entry displaying the explicit token sign-in screen; no credentials entered, no GitHub write action. |
| `connection-studio/index.html` | Interactive writing practice tool. Initial HTML contains a `main` and a dynamic view mount, while JavaScript renders the page heading and eight navigation choices on load. A static-HTML-only h1 audit would misclassify this working interface. |
| `editor-v2-previews/source-index.html` | Historical editor source snapshot, `noindex`, canonical to current Home. Its older About navigation is part of that snapshot. It is not the delivered current Home or an approved copy-edit target. |
| `fluid-layout-lab.html` | Experimental/legacy layout utility. Entry only; site mutation and import workflows remain a separate functional test scope. |

## Independent public HTTPS results

Created `scripts/audit-public-auxiliary-entrypoints.py` and `.github/workflows/audit-public-auxiliary-entrypoints.yml`. The probe independently fetched the eight real public HTTPS documents, compared **exact bytes** to the checked repository files, then opened each route in Linux Playwright Chromium at **390 px and 1280 px**. It checked public entry status, one `main`, stylesheet attachment, intended category-specific landing state, and saved **first-viewport screenshots**. No token, draft edit, login submission, publishing action or student-app progress write was attempted.

Successful [GitHub Actions run 41612787456](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41612787456), tested head `c4e9044a618d284b39a8ae18291c0a66d833dac4`, recorded **8/8 exact deployed-byte matches**, **16/16 read-only browser landing checks**, **0 failures**, and uploaded JSON plus screenshots to [artifact 13220271062](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41612787456/artifacts/13220271062).

Downloaded and reviewed the diagnostic JSON. At both widths, no browser JavaScript exceptions were recorded for any of the eight pages, and each document's `documentElement.scrollWidth` matched its viewport width. All linked stylesheets attached successfully where provided; `editors.html` and `fluid-layout-lab.html` use embedded styles. Dynamic Connection Studio renders an `h1` and eight navigation controls at both widths. Website Studio presents `#tokenInput[type="password"]`, while the editor directory has three accessible cards.

The sixteen **initial-viewport** screenshots were also sampled in a contact sheet. They show the expected distinct tool and route identities with no gross clipped headers in the sampled frames. The source-preview snapshot visibly carries an older About tab but is separately `noindex` and canonical-to-Home. Neither a screenshot appearance nor a successful landing test establishes full authoring functionality.

## Exact tested-source reconciliation

Compared the tested revision and current default-branch blobs for all **eight HTML pages and the probe script**. All **9/9** pairs were identical:

- `about.html` `a39c0469eeadc8c104c884d812b1b4be4db68db1`
- `editors.html` `0da76d7a477e996ba3341b599512a61dd50d1d75`
- `editor.html` `09c1704033fca19cf48b706f276023009178500f`
- `editor-v2.html` `8a1a5a28629e80daaa9d4fef6fbafa1b283bed4c`
- `studio/index.html` `468d7e26d0412c8186fd3d43cbd983e457fb957f`
- `connection-studio/index.html` `485dbe8c8a5994139fee5b0884889ad4e3479942`
- `editor-v2-previews/source-index.html` `a014cd51bf0aca488a47cb38126206606b40813c`
- `fluid-layout-lab.html` `12b6bb4572abec9ab6819178f825310f43e435cb`
- `scripts/audit-public-auxiliary-entrypoints.py` `28a61fd9464387c69831208588f3dcd99331382b`

**Changes made:** test probe, workflow and this audit report only. There was no public HTML, academic prose, research evidence or editor production algorithm change.

## Scope limits and next stage

This stage checks **public delivery and initial landing states**, not whether each authoring app can safely complete privileged workflows. The successful four Editor V2 Chromium suites cover their own tested behaviours separately; none of these tests constitutes authenticated production publishing or physical-device accessibility proof.

The primary source blockers involving original student assessment work, historical school authorization/assent/consent, independent rater adjudication, the final August scoping S2B/S2C coding rows, and remaining restricted full-text references are unchanged.

**Exact next stage: C-RV29bx | All 26 current public HTML routes and stage-result scope reconciliation.** Independently compare the tested route sets from C-RV29bs, bt, bu, bv and bw against the complete current Git tree. Record counts, omissions and status tiers without claiming complete academic content verification. Then identify the next actionable source-dependent scholarly issue rather than running redundant generic browser checks.
