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

## Application interface screenshots awaiting direct capture

The Story Method and Research Methods Studio have working embedded application previews on their respective website pages. No screenshots were added during this phase. Genuine captures must show the actual released interface at a known version, with any private student work excluded. A guessed or recreated illustration must not be labelled as a screenshot.

For future screenshots, record the public release/version, view or screen captured, date, source repository or application, whether any data shown are synthetic, any edits or annotations, and an appropriate author-source note.

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

## Audit outstanding

Images on `interests.html` include externally hosted book-cover and media artwork. Their image licences, source reliability, and reproduction permissions should be checked individually before these items are replaced, mirrored, or expanded. Citation by itself does not establish permission to reproduce an image.
