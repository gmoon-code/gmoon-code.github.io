# Stage C-RV25e | AP Biology and AP Chemistry proposed curriculum, science, arithmetic, and epistemic limits

**Date:** 2 November 2026. Continued from [C-RV25d](TEACHING_OVERVIEW_CROSS_PAGE_AUDIT_C-RV25d_2026-11-02.md). Content-only examination of the complete substantive writing, calculations, captions, proposed lesson sequences, provenance statements and original scientific claims in two dedicated teaching case studies. This stage preserves previously verified edits and treats both designs as prospective, not implemented student interventions.

## Exact source coverage

| Page | Verified Git blob SHA | Sections read |
| --- | --- | --- |
| `teaching-ap-evolution.html` | `40de860091218b308283707ed40949110241c9a6` | Molecular/cellular HbS explanation; published two-cohort malaria results; four proposed 50-minute meetings; Hardy–Weinberg example; synthetic one-generation selection model; Piel geospatial study; ethics, participation, proposed inquiry extension, references and figure captions |
| `teaching-ap-chemistry.html` | `d22115cd633357695967af5d499bd0065cb73c84` | Ammonia reaction quotient; particulate/macroscopic/symbolic views; equilibrium compression example; three proposed 50-minute meetings; three invented student responses; independent numerical task, interpretation criteria and sources |

## Biology original-study claims and interpretation

**Haemoglobin molecular and population mechanism.** The description of the HBB Glu6Val substitution, oxygen-dependent polymerization of deoxygenated HbS, HbSS associated with disease and the conditional malaria benefit of HbAS is consistent with original primary and authoritative biology literature. The phenotype is appropriately recognized as dependent on genotype and environment. HbS is not claimed to have arisen in response to adaptive need.

**Williams et al. (2005)** [original *Journal of Infectious Diseases* study, PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/15942909/), studied two cohorts of children in coastal Kenya. The published outcomes reported approximately **50%** protection against mild clinical malaria, **75%** against admission for malaria and almost **90%** against severe/complicated malaria; the study reported **no effect on symptomless parasitaemia**. Every one of these four descriptions agrees with the public website. The site correctly distinguishes *reduced clinical disease* from absence of infection, and does **not** convert cohort-specific clinical protection rates into independent estimates of reproductive fitness or allele selection coefficients.

**Piel et al. (2010)** [original open *Nature Communications* article](https://www.nature.com/articles/ncomms1104) documented geographic distributions using historical observations and model-based maps. The geographic malaria–HbS relationship was relatively strong in Africa but **unresolved in Asia and the Americas**. The page reproduces those qualifications and does not claim a present-day genetic frequency of any student or racial group. **Donovan (2022 journal issue)** [original open review](https://pmc.ncbi.nlm.nih.gov/articles/PMC8756492/) discusses how genetics education and racial framing can increase or decrease genetic essentialist beliefs depending on teaching. The page appropriately cautions against substituting racial categories for genotypic evidence, without asserting an outcome measured in this proposed curriculum.

**Proposal and ethics.** All four lesson meetings and the extended source-reading and participatory question-selection activities are labelled **proposed**. The described opportunity for students to influence the next research question is a teaching design, not an already measured result. The page repeatedly rejects personal disclosure of students' ancestry, medical status, genetic testing and family background as prerequisites.

## Independently recomputed evolutionary mathematics

The initial **illustrative** frequency assumption is `p(HbA)=0.8, q(HbS)=0.2`. Under stipulated Hardy–Weinberg proportions the starting genotype frequencies are **HbAA 0.64**, **HbAS 0.32**, **HbSS 0.04**. The fraction with one or more **HbA** copies is **0.96**, so the pedagogical warning against interpreting `p²=0.64` as the number of all HbA carriers is correct.

The separate **fabricated relative reproductive contributions** are HbAA `0.70`, HbAS `1.00` and HbSS `0.20`. Multiplying by genotype frequencies yields `0.448`, `0.320`, `0.008`, summing to **0.776**. The gametic HbS fraction under this explicit viability/fitness-selection abstraction is `(0.320/2 + 0.008)/0.776 = 0.216494845…` and the complementary HbA fraction is `0.783505155…`. Assuming random union of these gametes produces next-zygote frequencies **0.613880**, **0.339250**, and **0.046870**, matching the page's stated rounded **0.6139, 0.3392, 0.0469**. Those values are *not* predictions for any Kenyan population and are *not* derived from the Williams cohort percentages; the site explicitly says so.

No numeric, interpretive, terminological, or ethical correction was justified.

## Chemistry reactions, calculations and explanatory caveats

**Reaction** `N₂(g) + 3H₂(g) ⇌ 2NH₃(g)`, `Qp = (P_NH3)^2/[(P_N2)(P_H2)^3]`, using the standard AP-level ideal-gas pressure expressions.

- **Initial arbitrary reaction mixture:** `P(N₂)=1`, `P(H₂)=2`, `P(NH₃)=1` atm gives `Qp=1/(1×8)=0.125` versus stipulated `Kp=0.50`. Net product formation predicted; this establishes **direction**, not kinetic timescale.
- **Separate equilibrium mixture:** `P(N₂)=1`, `P(H₂)=2`, `P(NH₃)=2` atm yields `Qp=4/(1×8)=0.50=Kp`.
- **Instantaneous halving of volume:** at the same hypothetical temperature under ideal-gas behavior, prior to chemical relaxation, each partial pressure doubles. The new pressures 2, 4, 4 atm yield `Qp=16/(2×64)=0.125`, precisely one-quarter of `Kp`. Later net reaction favours the side with fewer gas moles (ammonia) while **Kp remains fixed at constant temperature**. The figure correctly refrains from inventing a final mixture composition.
- **Independent constructed equilibrium task:** pressures 2, 1, 1 atm yield `Qp=1/(2×1)=0.50`. At this equilibrium forward and reverse events continue at **equal rates**, which are **not calculable from Kp** without kinetic information. Equal forward/reverse rates never require equal amounts of the three gases.

The three **illustrative, explicitly nonquoted** student statements are appropriately differentiated. “At equilibrium, all concentrations are equal” and “Pressure increases, so K increases” are incorrect in these contexts. “Compression shifts the reaction right because the product side has fewer gas molecules” is **scientifically valid for this specific reaction and isothermal ideal-gas scenario**. The page correctly values that reasoning and asks for the quantitative derivation rather than labelling it a misconception. The macroscopic, particulate and symbolic teaching scheme is appropriately grounded in Johnstone (1991)/Talanquer (2011), not invented as an empirical finding from this author's classes.

The College Board original 2025 AP Biology Course and Exam Description places **natural selection in Unit 7**, with heredity and gene expression in Units 5–6. The AP Chemistry case fits the 2024 Unit 7 equilibrium scope. No conflicting course date or documented intervention claim was identified.

## Cohesion, student roles and authorial voice

The evolution case advances from β-globin mechanisms to clinically measured risk, to the extra assumptions needed for a model of evolutionary selection, and then to ethical choices about variables and who directs further inquiry. It does not present alleles, identities, and historical geography as interchangeable categories. The chemistry case advances from numerical direction to reversible microscopic dynamics, tests the reasoning with a compression disturbance, and uses the distinct quality of each imagined response to select a different teacher follow-up. The two cases therefore realize the Teaching overview's emphasis on evidence and responsive questions **through different disciplinary mechanisms**, without using an identical rhetorical template. In both pages, contextual qualifiers and first-person conditional language are appropriately placed and naturally varied. No em dashes in prose or inflated success claims were added.

## Source/structural checks and change decision

Re-fetched both pages and ran **39/39 targeted assertions**, including independent JS arithmetic, all cited numeric data, constructed-versus-empirical labels, DOIs, genetics/sport scope and original sources, hypothetical task conditions, ethics language, and reference targets. Evolution page has **18 unique IDs and 15 internally resolving fragment links**; chemistry page has **14 unique IDs and 13 internally resolving fragment links**. All respective links resolve in source. This is *repository source* verification, not a rendered deployment check, a PDF page-image verification of the College Board course framework, or evidence that either lesson was implemented.

**Public HTML changes:** None warranted. These pages already preserve source and meaning with sufficient accuracy, and revising them for visible activity would risk losing the author's voice.

## Exact next checkpoint

**C-RV26a | Site-wide human-authored content coverage and unfinished-route inventory.** Reconcile the broader content audit ledger and earlier stage reports against the repository's discoverable page list, including `index.html`, `contact.html`, `cv.html`, `interests.html`, `projects.html`, and lesser-known essays/teaching resources. Record which pages already received all content and original-source checks, which are partially source-verified and which still need work. Prioritize truly unreviewed original prose and factual status, not repeated citation audits. Check the research mentoring connections in `teaching.html` against already audited `research-methods-studio.html` only if a concrete inconsistency emerges.

Keep source-of-truth problems distinct: confidential original AP Biology response/consent/rater records, final August scoping S2C coding roster, unavailable scholarly books, public deployed-page parity and six Editor V2 browser issues. The **overall academic website content audit remains In progress**.
