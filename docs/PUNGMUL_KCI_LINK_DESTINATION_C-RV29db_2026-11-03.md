# C-RV29db | Pungmul source citation redirected to independently verified official KCI article landing

**Date:** 3 November 2026. **Continued from:** [C-RV29da](CURRENT_PRODUCTION_BYTE_PARITY_RECOVERY_C-RV29da_2026-11-03.md). **Scope:** The two direct non-DOI scholarly links that the external audit classified as unverified, with special attention to the Park (2014) article actually referenced on the Pungmul page. **Outcome:** Found a specific intermittent *wrong-article destination* under the older Korean Citation Index URL, replaced it with a verified official article landing URL, retained the original citation text and paragraph, and obtained successful subsequent source, visitor, external and linkgraph tests.

## Two originally unverified direct article URLs

The previous [external-resource report](EXTERNAL_RESOURCES_LATEST_RESULTS.json) distinguished direct non-DOI page links from scholarly DOI links. Its two direct unverified destinations were:
- `https://onlinelibrary.wiley.com/doi/full/10.1002/sce.21622`, used on `research-scoping.html` for the original Figure 3 context in Pierson, Clark and Brady (2021).
- `https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001857639`, cited on `pungmul.html` for Park (2014).

The first Wiley address is an authentic publisher article page. On 3 November, the publicly retrievable publisher HTML displayed **Pierson, Clark and Brady (2021), *Scientific modeling and translanguaging: A multilingual and multimodal approach to support science learning and engagement*, *Science Education* 105(4), 776–813**, DOI **10.1002/sce.21622**. Its subject, sixth-grade English-dominant ecology class and multilingual scientific modelling context match the Scoping-page discussion. The page labels the linked original Figure 3 as being within the article, not a guaranteed automatic figure-specific URL fragment; see earlier source-checked [C-RV29bb](SCOPING_PIERSON_KANE_FIGURE_DOI_SOURCE_AUDIT_C-RV29bb_2026-11-03.md). **No Scoping-page link or text was changed**.

The prior KCI URL showed a more concrete problem. Search-engine/indexed records for the exact `ART001857639` identifier still associated it with Park's Pungmul paper, but one fresh direct page opening of the exact URL displayed **an unrelated 2006 article in the *International Neurourology Journal***. This is a real observed inconsistent destination under the old detail-page route; it does **not** establish whether every visitor would receive the wrong article.

A second, separately accessible **official KCI article-landing route**,
`https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART001857639`,
returned the expected **박흥주 / Heung-Ju Park (2014)** article, titled *1980년대 전반기 서울지역의 풍물운동계열 작품에 나타난 굿성 연구－1980~1987년 6월항쟁 사이의 작품을 중심으로－*, in `실천민속학 연구`, volume **23**, pages **115–163**. Its Korean and English abstracts discuss university Pungmul performances incorporating village `gut` structures, participants' labour and farmers' movement experiences, and the tension between staged works and communal practice. An independent KCI journal-issue listing and DBpia metadata corroborated the identity.

The actual Pungmul source paragraph reads, in part, **“During the 1980s, some university performers drew on the forms of village rituals to respond to political concerns, informed by their experiences in labour and farmers' movements.”** Its qualified note about staged works versus everyday communal ritual is also faithful to Park's published abstract. The citation author's romanization, date, title, journal, volume and pages remain correct.

## One justified public correction

Changed exactly **one `href` target**, using the verified official article landing route above in place of the inconsistent older KCI detailed-page route. The Korean title, visible citation details, on-page interpretation, navigation, illustrations, original images and other references were preserved.

**Public HTML commit:** [`413adf30`](https://github.com/gmoon-code/gmoon-code.github.io/commit/413adf30fe77033ea78d7032f69235ccfa007a2f). Direct source diff reports **one line added and one line removed, in `pungmul.html` only**. Re-fetched current HTML confirms the new KCI URL and absence of the old one; new blob **`2cc23a609653529c37c43cf243ddf484cd863d49`**.

## Actual verification and evidence boundary

- [Pungmul visitor audit run 41655799348](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799348) finished **success**, with zero reported page-test failures under the content correction source revision.
- [Public linkgraph run 41655799407](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799407) finished **success** and produced a report for the exact `413adf30` source of **556 links, 93 asset references, 0 problems and 0 advisory issues**.
- [External resource audit run 41655799495](https://github.com/gmoon-code/gmoon-code.github.io/actions/runs/41655799495) finished **success** for `413adf30`; its machine summary shows **73 reachable and 42 unverified** external destinations, compared with the earlier 71/44 inventory. The new official KCI landing URL is **not among the unverified issues**. The remaining Wiley direct article link can still be robot-blocked even though it was read successfully from another public retrieval environment. The increase of two reachable destinations is **a net observation**, not attributed entirely to the URL correction.
- The first new S8 strict byte-release audit and live photo-source audit ran during deployment transition and initially saw the older public `pungmul.html` bytes. This temporary mismatch must be preserved. The later corrected [gallery audit C-RV29dc](GALLERY_SOURCE_FIXTURE_UPDATE_C-RV29dc_2026-11-03.md) independently obtained **10/10 exact public byte matches** for both affected page files, their stylesheet and seven intended gallery photographs. This is direct evidence that the corrected Pungmul HTML subsequently reached the live site.

No original photos, CSS or editorial copy were modified. The external link fix is supported by article-identity verification, rather than treating a crawl timeout as proof of a broken link.

**Status:** Pungmul scholarly reference target **Corrected and source-verified**, local visitor/linkgraph checks passed, bounded public byte delivery verified later. No claim of reliable availability on every KCI session, physical-device accessibility or complete site-wide scholarly evidence authentication.

## Exact next checkpoint

**C-RV29dc | Photo restoration regression fixture provenance and live byte verification.** Reconcile the existing gallery checker, which still expects obsolete and identical image names on both pages, with their actual different current photography sets; verify both distinct page image lists and actual public bytes, without changing the rounded presentation or artworks.
