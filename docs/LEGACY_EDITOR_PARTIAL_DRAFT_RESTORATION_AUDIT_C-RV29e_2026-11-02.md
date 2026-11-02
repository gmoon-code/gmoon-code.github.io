# C-RV29e | Legacy editor partial browser-draft restoration and failure reporting

**Date:** 2 November 2026. Continued from [C-RV29d](LEGACY_EDITOR_SAVE_FAILURE_SOURCE_RECOVERY_AUDIT_C-RV29d_2026-11-02.md).

**Status:** Selected recovery claims and narrowly necessary safeguards have been corrected and source-verified with isolated function tests. Real-browser recovery, local-storage durability and live publishing remain unverified. Comprehensive academic website content audit **In progress**.

## Exact inspected source and earlier decisions preserved

Read the latest `editor.js` `restoreDraft()`, `saveDraft()`, `loadPage()`, `resetPage()`, `updateStatus()`, `initialIndex()`, `reindex()`, section ordering, original-source removal and content-order validation functions, along with the corresponding `editor.html` author-help paragraph. Compared with C-RV29c–d decisions and the earlier C-ED2–4 source coverage. Reused source evidence rather than reopening already verified public academic pages.

Previously, `restoreDraft()` could accept a JSON draft with the current fingerprint, mutate responsive groups or added blocks, replace early edited nodes, and then throw on a later malformed section, removal or reorder entry. Its catch handler still claimed that the original page had been left available. In reality the working document could have been partially altered. The subsequent `loadPage()` status could say **“Draft restored”** if any partially applied edit survived. An automatic `saveDraft()` could then overwrite the full original browser record with an incomplete state. Even without an exception, the original loop silently skipped individual saved edits when their identifiers or edited element types could not be matched, allowing an incomplete recovery to appear successful.

A malformed JSON record or unrecognised version was also silently disregarded, after which a subsequent save could replace it. The reset button was disabled if the only outstanding state was an unapplied older or failed browser draft, despite existing help recommending reset as the way to discard that record.

## Corrections implemented

1. **All-or-nothing application.** `restoreDraft()` now snapshots the initial working document and relevant edit state before applying saved changes. Any later validation or application exception restores that snapshot. This preserves the original displayed source in the bounded failure path instead of retaining partial edits.
2. **Fail closed on unusable saved entries.** A saved patch must have a unique, valid element identifier, string markup, an existing original element, acceptable markup and a matching element tag. Unsupported or duplicate entries cause the entire restoration to be rejected rather than silently skipped. Source, layout, removal and block-order validators are still used, with a final index check.
3. **Preserve unreadable and incompatible drafts.** A browser record with malformed JSON or an unrecognised schema is reported as unapplied and is protected against replacement by newly edited content. An older source-fingerprint mismatch keeps its existing separate warning. A failure to read browser storage is described as an unchecked restoration rather than evidence of a saved record.
4. **Accurate recovery notices.** After rollback, the editor reports that **none of the rejected draft's edits were applied** and that the browser record was retained. `loadPage()` gives the specific failure status priority over a generic “Draft restored” message. The active draft is shown without claiming that validation succeeded.
5. **Reset remains reachable and conditional.** `updateStatus()` enables Reset when an unapplied stored browser draft is known, even when there are no currently changed elements. The reset confirmation distinguishes a previously saved draft that could not be restored from one belonging to an older page version. Reset attempts removal; if browser storage rejects it, the editor reestablishes the protection flag and warns that the saved record could not be deleted.
6. **Help aligned with the implementation.** The `editor.html` browser-draft paragraph now covers older-source and failed-restoration records, preserving old data until a deliberate reset, requiring separate HTML export for new edits, and making deletion conditional on browser storage permission.

The changed code does not alter the JSON draft format, source fingerprint calculation, public academic pages, GitHub Contents API direct publishing, token handling, or the independent Editor V2 system. No unsupported claim that browser storage is a secure backup has been introduced.

## Commits and verification

Four scoped commits changed only the legacy editor source files:

- `27ef14d8e20d0aacc95d761c85e7d008c62530a3`, `editor.js`, state and warning distinctions for failed recovery.
- `bdc00b61c070cc4d2c45b38598b30d73bea96dd3`, `editor.js`, all-or-nothing restoration with validation and rollback.
- `82a78d739f359914efedd66f354fa7671d6e9760`, `editor.js`, recovery Reset enablement and conditional deletion safeguards.
- `c02c652616898209b2bf259081b47729446d8549`, `editor.html`, author guidance.

Final fetched blobs were **`2dd46b27515b162a90b934e47843528de84a56aa`** for `editor.js` and **`588edbe660f7e645709d091c4f3b90a27b1ca957`** for `editor.html`.

The isolated recovery harness passed **23/23** checks, including valid restoration, later validation failure after an earlier edited node, rollback, malformed JSON, unknown and repeated keys, version mismatch, changed source fingerprint, unavailable browser storage, JS parse, 149 unique HTML IDs, and existing Github source/commit invariants. The first separate mocked loader test failed due to its *fixture* omitting the `history` and `redo` arrays required by `loadPage()`; this was not a repository change or observed browser failure. After correcting that fixture, a further **8/8** reset/loader checks passed, covering successful and refused old-draft deletion, cancellation, older-source wording, and accurate loader status precedence. Thus **31/31 applicable final isolated/source checks passed**. These tests use mocked DOM/storage implementations and are not real-browser functional or authenticated publication tests.

## Remaining uncertainty and next checkpoint

The complete editor remains subject to real browser testing, including page reload and automatic save timing, browser storage quota and denial, native close-confirmation behaviour, restored preview parity, downloaded HTML, and authenticated publishing. The six previously recorded Editor V2 browser regression failures remain a separate open track. Source-level restoration tests do not repair those failures.

**Exact next checkpoint C-RV29f:** review the remaining legacy editor's `reviewChanges()`, export-readiness and generated file-download/help messages against `buildExport()`, `exportHtml()`, `reviewExportStatus` and image payload handling. Cross-check prior C-ED2 and C-RV29c findings so that only a genuinely unreviewed or newly inconsistent claim is corrected. Keep these author-help improvements distinct from changes to research evidence or the real publishing algorithm.

The original final-August scoping S2C 20-study coding matrix, original AP Biology assessments and independent rater/consent/assent/permission records, and the preferred public email decision remain independently unresolved pending authentic sources or owner choice.

**Overall comprehensive academic website content audit: In progress.**
