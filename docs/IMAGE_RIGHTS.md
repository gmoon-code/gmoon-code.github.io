# Image sources and reuse record

This record documents third-party images and original interface captures used on the public academic website. Each image must be evaluated for scientific relevance, attribution requirements, reuse licence, and permitted modification before publication.

## Scientific photograph added 17 October 2026

- **Site page:** `teaching-ap-evolution.html`
- **Image:** *Sickle cells in blood.jpg*
- **Creator:** Graham Beards
- **Image description:** Giemsa-stained blood film from a person with sickle cell disease
- **Date listed by source:** 22 October 2025
- **Original file description and licence:** https://commons.wikimedia.org/wiki/File:Sickle_cells_in_blood.jpg
- **Licence selected:** Creative Commons Attribution–ShareAlike 4.0 International (CC BY-SA 4.0), https://creativecommons.org/licenses/by-sa/4.0/
- **Display image:** https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Sickle_cells_in_blood.jpg/960px-Sickle_cells_in_blood.jpg
- **Displayed through:** the Wikimedia thumbnail service; the binary file is not stored in this website repository.
- **Modification:** none; CSS scales the complete frame without cropping.
- **On-page attribution:** creator, Wikimedia Commons source, licence link, modification statement.
- **Editorial relevance:** illustrates red-cell morphology in a patient with sickle cell disease. The image does not demonstrate HbAS trait, genotype-specific malaria protection, reproductive fitness, or allele-frequency change.
- **Accessibility:** descriptive alternative text and numbered contextual caption.

## Structural micrograph added 17 October 2026

- **Site page:** `teaching-ap-biology.html`
- **Image:** *Chloroplast 30000x (3660656624).jpg*
- **Creator attribution:** Image credits Andreas Anderluh and Bela Hausmann; Wikimedia metadata lists Bela Hausmann as author.
- **Image description:** Transmission electron micrograph of chloroplast grana / thylakoid membrane stacks, originally presented at approximately 30,000× magnification, with a 500 nm scale bar.
- **Source date:** 25 June 2009.
- **Original file and licence:** https://commons.wikimedia.org/wiki/File:Chloroplast_30000x_(3660656624).jpg
- **Reuse licence:** Creative Commons Attribution–ShareAlike 2.0 Generic (CC BY-SA 2.0), https://creativecommons.org/licenses/by-sa/2.0/ . Wikimedia Commons records a historical Flickr licence review.
- **Image URL:** https://upload.wikimedia.org/wikipedia/commons/4/45/Chloroplast_30000x_%283660656624%29.jpg
- **Hosting:** Wikimedia original file; not copied into this site's repository.
- **Modification:** No crop or image-content edits; CSS scales the complete frame for the layout.
- **On-page attribution:** both credited people, original Commons record, licence and no-alteration statement.
- **Interpretive limit:** This is an example of thylakoid ultrastructure. It is not an observation of bentazon-treated tissue, electron flux, proton-gradient size, or ATP/NADPH concentrations.
- **Accessibility:** meaningful alternative text, caption and preserved scale bar.

## Original application screenshots captured in October 2026

These are **genuine screenshots of the released public applications**, captured in a fresh, logged-out Chromium browser on GitHub Actions and reviewed visually before publication. They appear on `projects.html`, with a link to each larger image. Both applications retain their working interactive previews on their own project pages.

### The Story Method opening interface

- **Local asset:** `assets/story-method-interface.webp`.
- **Published application:** https://gmoon-code.github.io/memory-palace-u1-8/?unit=unit-1
- **Repository and release history:** https://github.com/gmoon-code/memory-palace-u1-8 . The site documentation calls this released interface *Site UX1*.
- **Observed screen:** Eight-unit AP Biology course overview, showing Unit 1 selected and an option to begin *The Evidence Lockdown*. It is not a screenshot of the Observation Window or a learner's response.
- **Attribution:** original author's application, captured from its public interface in October 2026.
- **User content:** fresh browser context with no saved learner work or login.
- **Alteration:** browser viewport screenshot proportionally resized to 1280 × 800 and encoded as WebP; no overlay, synthetic interface, or image-content modification.

### Research Methods Studio opening interface

- **Local asset:** `assets/research-methods-studio-interface.webp`.
- **Published application:** https://gmoon-code.github.io/research-methods/
- **Repository and release history:** https://github.com/gmoon-code/research-methods . Its repository release is described as *v3.0.0*; the screen includes the older internal *v2.13.3 Guided Student Flow* label.
- **Observed screen:** introductory research pathway and empty research-notebook creation form. It does not show the Data and Statistics Lab, results, or any example dataset.
- **Attribution:** original author's application, captured from its public interface in October 2026.
- **User content:** fresh browser context with no locally saved research project.
- **Alteration:** browser viewport screenshot proportionally resized to 1280 × 800 and encoded as WebP; no annotation or artificial UI content.

### Capture workflow and editorial rules

- **Capture code:** `scripts/capture-project-interfaces.mjs`.
- **GitHub Actions workflow:** `.github/workflows/capture-portfolio-images.yml`, triggered by its initial commit and available for manual refresh.
- **Controls:** capture waits for the published page to load, confirms named interface content, checks for the absence of an application loading/error screen, checks image size, and captures without signing in. Generated screenshots are reviewed before updating the portfolio.
- **Caption policy:** specify which actual part of the application is visible. Do not describe the overview as an Observation Window journey or the starting form as a Methods or Statistics Lab. Original interface screenshots do not count as classroom evaluation.
- **Accessibility:** each screenshot has a descriptive alt attribute, nearby caption, and accessible full-size link. The interactive published applications remain separately available.

### Detailed instructional interface captures, 17 October 2026

These screenshots were captured from the actual deployed applications, using fresh Chromium browser contexts in GitHub Actions. Their source files are preserved locally in the website repository, and both images link to a full-size copy on their respective project pages. Neither image is a reconstruction or a generic illustration.

| Website page | Image | Actual content | Capture conditions |
| --- | --- | --- | --- |
| `story-method.html` | `assets/story-method-observation-window.webp` | Scene 1 *Observation Window* of Unit 1, showing the reporter-cell observation and three labelled room zones. | Public Unit 1; navigated into the first journey in a fresh profile; screenshot of the real scene-orientation panel, 978 × 436. No learner work. |
| `research-methods-studio.html` | `assets/research-methods-data-lab.webp` | *Data Analysis & Statistics Laboratory*, Step 1 of 7, before CSV import; shows how original raw-data records are introduced. | Public application; fresh local notebook labelled as illustrative, with context stating demonstration only. No dataset imported and no analysis performed. Screenshot 1280 × 800. |

- **Capture script:** `scripts/capture-project-detail.mjs`, using Playwright and Chromium; WebP encoding through Sharp.
- **Capture automation:** `.github/workflows/capture-portfolio-detail.yml`.
- **Validation record:** `docs/capture-detail-status.json`, reporting success on 17 October 2026 after an initial overly restrictive UI-selector check was corrected.
- **Attribution:** Screenshots of the author's original publicly released applications. Live public software remains linked next to each figure.
- **Presentation:** The Story Method capture shows only the original interface section around the Observation Window, preserving the application’s text and layout without invented visual objects. The Data Lab capture shows a browser-viewport screenshot with an empty file picker and a temporary demonstration notebook. Both images are resized only as necessary for web delivery, with no annotations added to the image files.
- **Scope:** The images document software design and availability. They are not empirical evidence of student learning, classroom evaluation, or completed research.

## Published language-conceptualisation figure, 17 October 2026

- **Page:** `research.html`, multilingual participation section.
- **Source:** González-Howard, M., Andersen, S., Méndez Pérez, K., & Suárez, E. (2023). Language views for scientific sensemaking matter: A synthesis of research on multilingual students’ experiences with science practices through a translanguaging lens. *Educational Researcher, 52*(9), 570–579. https://doi.org/10.3102/0013189X231206172
- **Original figure:** Figure 1, *Focal science practice(s) by language conceptualization*.
- **Publisher image record:** https://journals.sagepub.com/cms/10.3102/0013189X231206172/asset/c4fc6f9a-b8c5-47c5-abfb-5d29bea1bfaa/assets/images/large/10.3102_0013189x231206172-fig1.jpg
- **Rights:** © 2023 AERA. The publisher states the article is licensed Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). The published graph is presented as the article authors' own synthesis figure with no third-party credit indicated.
- **Display:** An original publisher JPEG is linked directly from the article page and embedded at its natural proportions on the Research page. No data or figure content has been altered. Browser loading of the publisher-hosted image is independently checked in the site's responsive visual audit. A local archiving workflow is under verification; do not claim a successful local copy unless the binary asset exists.
- **Research distinction:** The published source compares language views and focal science practices in 28 included articles. The 20-study ERIC-indexed scoping review on this website is a separate analysis; the figure makes no claim about its sample or results.
- **On-page credit:** Full creator/year/journal/figure citation, publisher source DOI, © AERA notice, linked Creative Commons licence, modification declaration, and explanatory alt text.
- **Editorial role:** Primary published synthesis evidence underlying the discussion of how definitions of language influence which science practices researchers examine; it does not depict a classroom event or a student-written artefact.

## Personal photographs and media artwork inventory, 17 October 2026

This inventory distinguishes image provenance, **display method**, and **permission**. A usable image URL or source citation is not proof that an underlying copyrighted illustration is licensed for republication.

| On-site image | Current source | Current finding / next action |
| --- | --- | --- |
| Profile portrait on Home and About | Local `assets/profile-portrait.webp` | First-party hosted. Confirm photographer and permission if supplied by someone else; preserve authenticity. |
| Four pungmul photographs on Interests, plus the stage photo on Home | Local `assets/pungmul-*.webp` | First-party hosted. Confirm photographer/ensemble permission and any consent considerations for clearly visible participants; no further public copy without confirmation. |
| *The Priory of the Orange Tree* cover | `covers.openlibrary.org` / ISBN 9781635570304 | Open Library permits public-facing display through its Covers API and welcomes a service backlink. Underlying cover artwork is not thereby established as freely licensed. |
| *The Lord of the Rings* cover | `covers.openlibrary.org` / ISBN 9780618640157 | Same Open Library guidance and underlying-artwork caveat. |
| *Rose* cover | `covers.openlibrary.org` / ISBN 9780918526526 | Same Open Library guidance and underlying-artwork caveat. |
| *I'm Waiting for You* cover | Target Scene7 image service | Retailer-hosted edition art. No general reuse licence or guaranteed hotlink availability established; do not copy to site assets without rights review. |
| *Detective Conan* text logo | Commons `Special:FilePath/Detective_Conan_logo.svg` | Source record: https://commons.wikimedia.org/wiki/File:Detective_Conan_logo.svg . Marked PD-textlogo on Commons, but explicitly tagged as potentially protected by trademark. Used to identify the discussed programme. |
| *Dimension 20* promotional art | SensCritique image CDN | Media image source and permission unverified; do not assume open licence. Consider replacing with a licensed official promotional asset or an unillustrated title if necessary. |

**Open Library usage documentation:** https://openlibrary.org/dev/docs/api/covers . Its guidance supports cover thumbnails on public-facing pages and appreciates courtesy links. Three Open Library book-cover thumbnails are credited by a single compact notice below the Books group.

**Current HTML performance controls:** the six externally served media images on `interests.html` now reserve a 112 × 168 display slot, load lazily, and decode asynchronously. CSS may resize or contain the original images depending on the artwork. The external image services' uptime and availability have **not** been tested in a live browser.

**Source-level gallery verification, 17 October 2026:** natural WebP dimensions obtained from the current repository assets are 860 × 645 for `pungmul-stage.webp`, 860 × 484 for `pungmul-group.webp`, 650 × 433 for `pungmul-solo.webp`, 650 × 366 for `pungmul-rehearsal.webp`, and 520 × 516 for `profile-portrait.webp`. The Interests gallery HTML uses these source dimensions so the browser can reserve the correct image proportions. The solo image's alt text was corrected after visual inspection to remove an inaccurate description of a hat. Full-size gallery links now open in a named new browser tab and disclose that behaviour in their accessible link labels. Visual rendering and keyboard/screen-reader interactions on the deployed site still require manual testing.

**Publication decision:** retain the existing personal essay and cover identifications during this phase. Investigate the two unverified commercial-hosted images and confirm photographer/ensemble rights before mirroring or replacing any assets. If an image is removed, keep the surrounding substantive review unchanged.

## Published student biosphere model, reproduction permission pending

- **Relevant site page:** `research-scoping.html`, example from Pierson, Clark, and Brady (2021).
- **Published figure:** Figure 3, *Luis, Carlos, and Sean's biosphere plan*.
- **Reference:** Pierson, A. E., Clark, D. B., & Brady, C. E. (2021). Scientific modeling and translanguaging: A multilingual and multimodal approach to support science learning and engagement. *Science Education, 105*(4), 776–813. https://doi.org/10.1002/sce.21622
- **Publisher record:** https://onlinelibrary.wiley.com/doi/full/10.1002/sce.21622
- **Current website use:** A source link from the discussion of the students' original written and visual representations. No image was downloaded, hotlinked or reproduced on the site.
- **Rights status:** Article is labelled *Free Access* by Wiley; this is not evidence of a Creative Commons reuse licence. A hosted copy of the published article identifies Wiley Periodicals LLC as the 2021 copyright holder. No licence authorising republication of Figure 3 on this public website has been obtained or verified.
- **Permission route:** In the Wiley article, use **Tools → Request permission** and the RightsLink process for online reproduction of Figure 3, or contact Wiley's permissions team if the figure cannot be licensed through RightsLink. Publisher guidance: https://www.wiley.com/research-intelligence/content-solutions/permissions/general-queries and https://authors.wiley.com/help/license-signing-and-permissions.html
- **Additional considerations:** The figure reproduces work made by school-aged students. Confirm whether the publisher's permission covers that underlying material and whether any additional permissions or restrictions apply. Preserve the original image without re-labelling student contributions or presenting it as data from this site's author's classroom.
- **Next publication gate:** Reproduce only after all relevant rights and permission conditions are documented. Add the granted licence/credit wording to the caption, cite the original study, provide accurate alt text, and update this register. If permission cannot be established, retain the publication link without an embedded image.

## Audit outstanding

Images on `interests.html` include externally hosted book-cover and media artwork. Their image licences, source reliability, and reproduction permissions should be checked individually before these items are replaced, mirrored, or expanded. Citation by itself does not establish permission to reproduce an image.
