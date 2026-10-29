# Public accessibility semantics and interactive states | Stage S7 | 29 October 2026

## Exact continuation and scope

S7 follows the completed academic website's individual visitor-page audits and cross-site S1–S6b reviews, preserving their original evidence rather than repeating layout, print, bibliographic, or responsive checks. This stage covers the **18 directly readable public HTML pages**. The nineteenth route, legacy `about.html`, is an intentional Contact redirect with keyboard and no-script fallback, previously reviewed in utility U1.

The visitor-facing interactive surface is relatively modest. Static portfolio pages are primarily reading surfaces. Shared elements include the keyboard Skip to content link and the **Appearance** selector. Four pages have native disclosure controls, two project-detail pages expose opt-in interactive previews for separately deployed applications, and the CV and osmosis worksheet pages have print controls. Scientific tables have semantic column/row headers and some deliberately scrollable keyboard-focusable regions. These were S7's narrow focus.

## Reproducible test and limitations

Added `scripts/audit-public-interactions.py` and `.github/workflows/audit-public-interactions.yml`. The workflow uses Chromium on a Linux GitHub Actions runner, pinned Playwright 1.57.0 and `axe-core@4.14.0`. The local test server provides the exact checked-out portfolio source. Default page scans occur at **375 CSS pixels** with simulated reduced-motion preference.

For each of the 18 public pages the test checks English document language, one main landmark and one main H1, duplicate IDs, skip-link presence, accessible appearance label, existence of referenced ARIA descriptions, absence of focusable controls inside `aria-hidden` containers, structural scientific table headers, image alt attributes, textual or aria-based link names, safe new-tab rel attributes, and labeled form selects. It then runs tagged WCAG 2.0/2.1/2.2 A/AA and best-practice automated axe checks.

Every page's native Appearance selector is exercised by an actual `select_option` action in a fresh browser context. The test confirms light/dark/system preference states, dark resolution, matching selector state and **dark preference persistence through page reload**. It restores the selector to light after its checks.

The four disclosure interactions in `research-scoping.html`, `story-method.html`, `research-methods-studio.html`, and `teaching-osmosis-practice.html` are checked by **keyboard Enter** on the native `summary`. The content becomes open, a simulated `beforeprint`/`afterprint` sequence preserves the prior disclosure state, and Enter closes it again. The final S7 implementation explicitly executes axe **while the disclosure is expanded**, not after it has closed.

For both `story-method.html` and `research-methods-studio.html`, checks open the opt-in preview by keyboard Enter, verify the resulting **titled iframe has the same origin**, confirm focus has moved to Close preview, activate the Phone selector, verify `aria-pressed=true` for Phone and false for Desktop, close with Escape, verify the iframe is removed and focus returns to the opener, and separately close via the explicit Close preview button. Axe also scans each **active parent preview-control state**, with embedded iframe documents intentionally excluded. This validates the portfolio's preview *container and controls*, **not** the separately deployed learning applications inside the iframe.

The CV and osmosis worksheet print buttons are tested independently by one pointer activation and one keyboard Enter activation each, instrumenting `window.print` without opening native printer UI. The final run confirms **one click and one print invocation per action** for both pages.

## Diagnostics and resolution

- Initial workflow **40874233833** could not begin S7 because a script variable for the axe browser callback shadowed the filesystem path to its bundle. This was a *test harness error*, not a website defect.
- Next full workflow **40874399252** completed all **18 page scans**, appearance tests, four disclosures, two previews and two print-button tests. It found **zero axe violations**. Only the **two print-button cases** failed an overly broad call-count measurement. A focused instrumentation update separated pointer and keyboard events and captured browser call stacks. The print controls' inline `onclick="window.print()"` handlers were verified to fire **exactly once per individual activation**. No production print handler change was needed.
- The first passing S7 workflow **40874719067** confirmed zero failing cases and correct print interactions. Before closing the stage, the test was strengthened to scan **expanded** disclosures and **active** parent-preview controls. This prevents the audit from falsely claiming that those states had been checked when only their closed versions were scanned.
- **Final workflow [40875089499](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/40875089499)** at exact test/source commit `3928ee17f7656d8155aca81b54f0cdd25581e904` completed **successfully**, with exit code **0**, zero failures and no reported axe violations. Evidence artifact **12898076448**, named `s7-public-interaction-evidence`, includes full per-page semantic values, state transitions, call stacks and axe scan outputs. Compact result is `docs/PUBLIC_INTERACTIONS_LATEST_RESULTS.json`.

## Verified final totals

| Visitor-facing test | Completed | Result |
|---|---:|---|
| Public page semantic + ordinary axe scans | 18 | All passed |
| Appearance control and persistence tests | 18 | All passed |
| Keyboard-opened disclosures with active-state axe scans | 4 | All passed |
| Opt-in previews, device-state and focus-return tests, active parent axe scans | 2 | All passed |
| Print buttons, both pointer and keyboard Enter | 2 | All passed |
| Failed S7 cases | 0 | None |
| Automated axe violations | 0 | None |

The final artifact was downloaded and its full `report.json` reviewed for all 18 cases. All cases have empty `errors` arrays. Confirmed both print-control call stacks identify the expected inline handler and one invocation per pointer and keyboard action.

## Status and next completion review

**S7 completed. No visitor-facing production HTML, CSS or JS changes were justified.** The published site itself was not modified during S7; changes were limited to the reusable audit script, GitHub workflow and written audit results.

The next stage **S8** is the final release reconciliation, verifying that the current repository/deployed public surface matches the audited source, reviewing all unresolved items across S1–S7 and the page-level ledger, and producing an explicit automated-audit closure record. Prior successful runs are point-in-time evidence and do not alone certify later source modifications.

A headless Chromium semantics/axe pass **is not** spoken screen-reader testing, a full WCAG audit, physical iOS/macOS Safari validation, actual browser Ctrl-plus zoom, Windows operating-system forced colours, or an independent audit of the separately deployed apps inside preview iframes. Keep these limitations separate from the completed automated scope and avoid implying they were tested.
