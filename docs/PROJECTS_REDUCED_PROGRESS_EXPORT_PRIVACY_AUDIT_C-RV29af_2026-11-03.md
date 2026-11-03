# C-RV29af | Privacy-copy disclosure, reduced progress exports and historical download risk

**Date:** 3 November 2026. **Resumed from:** C-RV29ae. **Scope:** Original `gmoon-code/research-methods/assets/pilot.js::privacyCopy`, `assets/pilot-ui.js` Pilot & Recovery export UI, generated backup envelopes and filenames, the linked app's public README, and the academic website's `research-methods-studio.html#methods-privacy` and `#methods-implementation` explanations. **Result:** A substantial over-disclosure risk was corrected in the linked application, with source-execution regressions, GitHub Actions verification, and transparent legacy-file warnings. **No academic-site HTML rewrite warranted.** Whole-site academic content audit **In progress**.

## Previous implementation and substantive finding

The original companion `assets/pilot.js` `privacyCopy(project)` implementation began with **`clone(project)`** and normalized the complete project. It removed only `analysis.rawData`, replaced `analysis.fileName`, masked values in `writing.sections`, and narrowed the **source-record** properties to selected citation and extraction fields. The rest of the copied project remained present. This could include **project name/context, written research-question and design fields in `data`, notes and ethics/participant information in `methods`, search-log queries/notes, literature claims, source titles, source extraction evidence, class notes, `aiHelper.messages` Chat history, `aiHelper.lastField`, runtime events and other extension fields**. Even the retained source-record allowlist could reproduce student-entered evidence or sensitive terms.

Meanwhile the visible `assets/pilot-ui.js` button was labelled **“Download privacy-minimized copy”**. The file was deliberately **not restorable**, so the selected reduction was not necessary for recovery integrity. There was a meaningful mismatch between an ordinary student's likely interpretation of the label and the amount of sensitive free text actually present in the resulting JSON. It would have been unsafe to infer anonymization or approval for external sharing.

The old `backupFilename(project,"privacy")` also derived its **download filename from `project.name`**. Even if the JSON were minimized, a student's name or research topic in the filename could reveal personal or project information outside the document body. The separate full backup is expected to include the author's title, but a reduced summary must not rely on a potentially identifying filename.

## Minimal source-verified redesign in the companion application

The revised `assets/pilot.js` deliberately constructs a **new allowlisted object**, rather than cloning the working notebook. The summary contains exactly these keys:

```json
{
  "copy_type": "limited_progress_summary",
  "current_stage": 7,
  "activity_counts": {
    "source_records": 1,
    "search_log_records": 1,
    "literature_claims": 1,
    "schema_fields": 1,
    "analysis_runs": 1,
    "written_sections": 2
  }
}
```

The numbers shown above are an **illustrative synthetic test fixture**, not a real student's records or a general description of users' research progress. The actual counts are derived solely from array lengths and the number of populated writing-section strings. The stage number is constrained to a valid integer **1–18**, otherwise null. The export omits the project title, background, entered research answers, original source records, names, source details, participant descriptions, raw data, author messages, Chat histories, writing contents, notebooks and potentially unknown extension fields.

The surrounding envelope still contains the existing packet format, mode `"privacy"` for compatibility, a creation timestamp, a constant baseline identifier and the noncryptographic integrity fingerprint. **The timestamp and activity counts mean the file must not be advertised as anonymous or uniformly safe to share**. The existing `validateBackup` treats this mode as **nonrestorable**, and ordinary `"full"` recovery envelopes remain complete and restorable.

A second focused correction makes the **reduced-summary download filename use a generic `research-progress-summary-...` prefix**, never the project name. Full backups continue to use the established project-title filename, since they are plainly labelled full recovery exports.

The Pilot & Recovery button now reads **“Download limited progress summary (JSON)”**. An adjacent explanation says it contains only stage, activity counts and creation time, omits project titles, answers, raw data, source entries and Chat messages, **cannot restore work**, and is **not guaranteed anonymous or approved for sharing**. It asks students to inspect the file and applicable school rules before any external sharing.

**Historical-file warning:** Files generated under the **former “privacy copies”** label **are not retroactively sanitized**. They may still retain extensive project text or Chat messages. The new UI explicitly advises treating those earlier files as sensitive. This is a provenance and risk warning, not a claim that existing downloads were modified or remotely removed.

The linked [public README privacy section](https://github.com/gmoon-code/research-methods/blob/main/README.md) has been updated to distinguish full recovery backups from the limited nonrestorable summary, and to warn about older privacy-labelled exports. This provides consistent explanatory coverage both within the product and through the README linked from the academic site.

## Actual code changes and tested evidence

Companion repository code/docs/test commits on the default branch, all in the current stage:

- [f795cec](https://github.com/gmoon-code/research-methods/commit/f795cec6fcf7b3e1f1ad98012c79f4950e2b246f) replaces clone-based privacy export with an explicitly selected numeric progress summary and strengthens the envelope and nonrestorable-error wording.
- [27189e7](https://github.com/gmoon-code/research-methods/commit/27189e7ce122ac3df90fb47fb75918a22b171286) changes the UI label and introduces specific caution about remaining progress metadata.
- [39b8cb7](https://github.com/gmoon-code/research-methods/commit/39b8cb7e389ce7a21036c715f195a9e353200649) replaces the old privacy-copy filename suffix with a progress-summary suffix.
- [a52f709](https://github.com/gmoon-code/research-methods/commit/a52f70977a13bf8e0f5955ee83c42824a07a0b8e) creates six regressions using the actual `pilot.js` export and actual UI source, including a **private-text sentinel** placed in project titles, data, methods, source entries, writing, analysis and Chat history.
- [00f4d6d](https://github.com/gmoon-code/research-methods/commit/00f4d6d18becd2719febbb191c97f70a645651c3) adds the new source and test paths to the content-audit regression workflow.
- [d0bbdf5](https://github.com/gmoon-code/research-methods/commit/d0bbdf52e84c10851ee49b1473474e2dc30dec1c) eliminates the project-title-derived prefix in the reduced-summary filename; [d1549c5](https://github.com/gmoon-code/research-methods/commit/d1549c58a5d411b0b85a23a73e7d823196079a49) adds a filename-leakage regression.
- [72703a5](https://github.com/gmoon-code/research-methods/commit/72703a5f17dbb1d220df153a3df9993da62651b5) adds the historical privacy-copy warning to the UI, with [1c40b9b](https://github.com/gmoon-code/research-methods/commit/1c40b9bfdb4cf4005b98cda5744d439bb2ebc301) test coverage.
- [2acae99](https://github.com/gmoon-code/research-methods/commit/2acae99b8840525d080a2cb26d73bf8768ed404e) updates the README with the current and historical backup boundary; [94b9213](https://github.com/gmoon-code/research-methods/commit/94b9213ca7d4ad968c7fc9bfb02e253e4b162255) adds cross-checks for the README and interface.

The final [Content audit regression workflow, run 41567979171](https://github.com/gmoon-code/research-methods/actions/runs/41567979171), completed **success** for the **final source commit 94b9213ca7d4ad968c7fc9bfb02e253e4b162255**. Its original job logs establish the following six separate test suites:

| Test suite | Passed |
| --- | ---: |
| Research Chat backend and adapter requests | 37/37 |
| Published instructional-content loader | 11/11 |
| Confirmed backup and new-project reset | 8/8 |
| Save-before-in-memory-replace restoration | 6/6 |
| Multi-key localStorage partial-failure rollback | 6/6 |
| Reduced-summary content and privacy documentation | 6/6 |
| **Total** | **74/74** |

The final [GitHub Pages build and deployment run 41567979468](https://github.com/gmoon-code/research-methods/actions/runs/41567979468) also completed **success** at the same commit. A successful build and CI do **not** independently establish that all visitor browsers have cleared old caches, certify that earlier exported files have been erased, prove that output is anonymous, or confirm how external recipients handle downloaded files.

The new tests establish an exact allowlist, exclusion of embedded private-text sentinels from every JSON field, generic reduced-summary filenames even when project titles contain identifying text, unchanged full-backup restorability, deliberately blocked privacy-mode recovery and aligned interface/README warnings. These are genuine code-execution/source checks; no real student records were included in the test fixtures.

## Scholarly website coverage, stylistic and credibility judgement

The public academic `research-methods-studio.html` remains at source blob **911924f5f3b22a3106984cf1b96e716fe1732b9d**, with clear sections about local notebook storage, independent JSON backups, optional Chat and the difference between published guidance and personal records. Its language **does not advertise the optional reduced export as anonymous or promise it is suitable for recovery**. Adding the detailed schema to the academic visitor page would make that passage harder to follow without improving its conceptual accuracy. The **appropriate public correction was made in the application interface and its linked README**, where students actually encounter the export choice.

Across the relevant page paragraphs, the explanation develops naturally from local storage to independent backup, then networked Chat and professional responsibility. It does not present software features as measured educational outcomes, nor confuse the project with the author's peer-reviewed research. The current prose remains coherent in the author's restrained Canadian-English voice, without a justified reason for stylistic rewriting. **No academic HTML edit warranted.**

## Limits and exact continuation

The allowlist now excludes the obvious free-text disclosure paths, but stage numbers, activity counts and timestamps may still reveal individual information when combined with other contextual knowledge. The download location and external file recipients are outside the code's control. Browser simulation, CI and Pages build results are not an independent privacy/security evaluation. Previous exports continue to carry their historical content and need separate handling.

**Exact next checkpoint C-RV29ag:** audit the academic `research-methods-studio.html#preview` text claiming that an **embedded live preview and the full workspace may share a locally stored browser project**. Verify the site's actual preview scripts/iframe attributes, same-origin and storage behaviour, project access boundaries, and whether a preview can unexpectedly expose/edit an existing notebook. Read nearby preview and privacy sentences for natural cohesion and non-overstatement. Revise public text or embedding behaviour only if the evidence supports a concrete problem. Then resume the larger website's uncovered scholarly and visitor-facing content inventory rather than repeating the completed backup source audits.

Independent whole-site blockers remain the original **final-August S2C 20-study per-source coding**, original **AP Biology student assessment/rater/consent/assent/school permission evidence**, the **owner's public contact-email selection**, and **six unresolved Editor V2 browser regression failures**. The comprehensive academic website content audit remains **In progress**.
