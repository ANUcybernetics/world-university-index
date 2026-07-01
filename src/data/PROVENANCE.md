# Sub-ranking provenance

The overall rankings (QS, THE, ARWU, U.S. News, CWUR) are cited from the
publishers' own tables, linked from `rankings.json`. This file records where the
subject, Sustainable Development Goal and thematic sub-ranking figures were
verified, since some publishers (notably QS) serve their tables behind bot
protection and the on-page "Source" link points to the publisher's ranking
portal rather than a deep link.

Figures were compiled 2026-07 from the most recent verifiable edition of each
product. Banded results are recorded at the lower bound of the band.

## ARWU — ShanghaiRanking (Global Ranking of Academic Subjects, 2024; GRSSSD 2024)

Verified directly from the ShanghaiRanking subject tables (linked per entry in
`rankings.json`, e.g. `/rankings/gras/2024/AS0226`).

- Mining & Mineral Engineering: UNSW 8, Adelaide 16, Curtin 20, Wollongong 23
- Business Administration: RMIT 10, Curtin 18, Macquarie 41
- Nursing: Griffith 5, Deakin 14, UTS 15
- Automation & Control: Swinburne 13, Newcastle 41
- Political Sciences: ANU 14 · Geography: Melbourne 7 · Public Health: Sydney 10
- Environmental Science & Engineering: UQ 5 · Pharmacy & Pharmaceutical
  Sciences: Monash 5 · Agricultural Sciences: UWA 9 · Biomedical Engineering:
  QUT 16 · Communication (GRAS 2025): Canberra 76 (band 76–100)
- Sport Science (GRSSSD 2024): Deakin 1, La Trobe 8

## THE Impact Rankings (2025, with 2024 where a stronger placement stands)

Verified from the JSON payload embedded in each THE Impact ranking page (linked
per entry). Group of Eight participation is patchy — Melbourne, Sydney,
Adelaide, Curtin and Deakin did not participate in a recent Impact edition, so
they carry no Impact rows.

- Overall: Griffith 4, UNSW 11, Wollongong 31, UTS 33, Newcastle 39, Macquarie
  50, RMIT 56, QUT 101 (band), Canberra 201 (band)
- SDG 10 Reduced Inequalities: RMIT 1 (2024), RMIT 5 / Canberra 10 / Wollongong
  11 (2025)
- SDG 17 Partnerships: UTS 1 (2024), UTS 3 (2025)
- SDG 13 Climate Action: Newcastle 2, UNSW 3, Griffith 20, Wollongong 21
- SDG 15 Life on Land: Griffith 3, UNSW 11 · SDG 6 Clean Water: Griffith 4,
  Wollongong 10, Macquarie 13 · SDG 14 Life Below Water: Griffith 4, Macquarie
  21 · SDG 3 Good Health: Newcastle 9, Griffith 13, La Trobe 27, UQ 41 · SDG 5
  Gender Equality: Griffith 9 · SDG 7 Clean Energy: Griffith 7 · SDG 12
  Responsible Consumption: UNSW 7, UTS 19 · SDG 8 Decent Work (2024): Monash 14
  · SDG 11 Sustainable Cities (2024): Monash 10 · SDG 2 Zero Hunger: La Trobe 20
  · SDG 16 Peace & Justice (2024): ANU 35

## THE Young University Rankings (2024)

Verified from the THE young-university table (linked). UTS 11, Wollongong 16,
QUT 17, Swinburne 24, RMIT 28, Curtin 33, Griffith 35, Deakin 37, Canberra 65.

## QS by Subject (2025)

QS serves subject tables behind bot protection; figures were verified from
institutional press releases and QS mirrors, cross-checked against the
universities' own rankings pages. The on-page link points to the QS subject
rankings portal.

- Sports-related Subjects: UQ 2, Sydney 3, Melbourne 6, Deakin 14, UTS 41, La
  Trobe 47, Canberra 51 (band)
- Mineral & Mining Engineering: UNSW 2, Curtin 5, UQ 6, UWA 13, Wollongong 51
  (band) · Petroleum Engineering: Adelaide 4, UNSW 10, UQ 12
- Pharmacy & Pharmacology: Monash 4, Sydney 20 · Nursing: Sydney 19, Monash 24,
  UTS 26, Griffith 33, QUT 42, La Trobe 42, Newcastle 47, Wollongong 51 (band)
- ANU: Philosophy 8, Anthropology 9, Archaeology 10, Development Studies 10,
  Politics & International Studies 11
- Law & Legal Studies: UNSW 12, Melbourne 13 · Education & Training: Melbourne
  16, Monash 30, Deakin 50 · Art & Design: RMIT 26, Swinburne 101 (band) ·
  Architecture & Built Environment: RMIT 21 · Communication & Media Studies: QUT
  33 · Linguistics: Macquarie 36 · Hospitality & Leisure Management: Griffith 25
  · Environmental Sciences: UQ 15 · Veterinary Science: Sydney 16 · Data Science
  & AI: UTS 36 · Anatomy & Physiology: UWA 30, Adelaide 42

## QS thematic

- QS Sustainability (2026): UNSW 7, Sydney 15, ANU 16, Melbourne 16, Monash 41,
  UQ 50, UTS 69, Griffith 76, Adelaide 89, Macquarie 98
- QS Graduate Employability (2022): Sydney 4, Melbourne 8, UNSW 29, Monash 54,
  UTS 62, UQ 63, RMIT 74, ANU 79, UWA 111 (band), Adelaide 171 (band), Macquarie
  98

## Newer editions added 2026-07

Added as independent year-tables alongside the editions above (see `sources.md`
for the additive policy). Confirmed published; each figure verified via the
fetch method noted in `sources.md`.

- **QS overall 2025 & 2027** (2027 released 2026-06-18; MIT #1). All 30
  institutions, both years, from the xuanxiao.org mirror cross-checked against
  the QS PR Newswire release and university media. Adelaide 2027 (#79) is the
  merged "Adelaide University"; the 2025 figure (#82) is pre-merger.
- **QS by Subject 2026** (released 2026-03-25). Top-of-table movers: Monash
  Pharmacy 2, UQ Sports 2, UNSW Mining 3, Sydney Sports 3, Curtin Mining 4, ANU
  Philosophy 4, UQ Mining 5, Wollongong Philosophy 6, UWA Mining 9, ANU
  Archaeology 10. Verified from university media releases (UQ, UNSW, Monash,
  RMIT, UOW, Griffith, Macquarie, UTS, Curtin) and the QS mirror.
- **ARWU GRAS 2025** (released 2025-11-18) & **GRSSSD 2025**. Best per
  institution: Monash Pharmacy 3 & Business 3, Griffith Nursing 3, UTS Nursing 5
  & AI 8, Sydney Nursing 6, UNSW Energy 6, UQ Ecology 6, Griffith Hospitality 6,
  Curtin Mining 8, Swinburne Automation 9. GRSSSD 2025: Deakin 1, QUT 11, Curtin
  13, Griffith 18, Sydney 19, La Trobe 19, UQ 39. From the ShanghaiRanking Nuxt
  JSON payload (curl).
- **THE Sustainability Impact Ratings 2026** (rebranded from Impact Rankings;
  released 2026-06-24). Standouts: Griffith #2 overall and #1 SDG 14, RMIT #1
  SDG 6, UNSW #2 SDG 13, Newcastle #3 SDG 13 & SDG 14, La Trobe #3 SDG 3,
  Canberra #5 SDG 10. From the THE JSON payloads. The ten non-participating
  institutions (Melbourne, Monash, Sydney, Adelaide, UWA, ANU, Curtin, Deakin,
  Swinburne, Macquarie) are genuinely absent, not omitted.
- **Not newly published** (verified, so not added): THE Young University
  Rankings 2025 (discontinued after 2024), ARWU GRAS 2026.

## Not included

U.S. News subject tables could not be verified from this host (anti-bot block),
so only the U.S. News overall ranking is recorded.
