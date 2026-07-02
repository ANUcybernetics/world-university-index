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

## International subject placements added 2026-07

Subject sub-rankings for the ten non-Australian institutions, so the same
cherry-picking applies to them (QS by Subject 2026 + ARWU GRAS 2024/2025). QS
figures from the xuanxiao.org mirror, corroborated by primary press releases for
the marquee #1 claims (MIT News "No. 1 in 12 subjects"; the QS/Forbes list of
Harvard's 14 No. 1 subjects; Oxford, Cambridge and ETH Zurich releases); GRAS
figures from the ShanghaiRanking JSON payloads.

- QS #1s: MIT (Computer Science, Physics, Maths, Electrical/Mechanical/Chemical
  Engineering, Chemistry, Data Science, Linguistics), Harvard (Medicine,
  Biological Sciences, Economics, Politics, Law, Psychology, History, Pharmacy,
  Environmental Sciences), Oxford (Anatomy & Physiology, Geography,
  Anthropology, Modern Languages), Cambridge (Archaeology, English), ETH Zurich
  (Earth & Marine Sciences, Geology, Geophysics), Stanford (Statistics &
  Operational Research).
- GRAS #1s: Tsinghua (Mechanical, Electrical, Chemical Engineering, Materials
  Science, Nanoscience), Stanford (Chemistry, Education), NUS (Geography 2025),
  Oxford (Ecology), MIT (Automation & Control, Physics, Computer Science &
  Engineering, Robotics).
- Best-but-not-#1 (recorded as their strongest honest claim): Toronto #2
  Sociology (GRAS 2024, vs #17 in 2025 — a deliberate best-year pick), Imperial
  #3 Automation & Control (GRAS). The eight others reach world #1; Harvard, MIT
  and Oxford keep their genuine overall #1, which ties/beats their subject #1s.

## Global expansion added 2026-07 (151 institutions)

Widened from the original 30 to 151: the Australian sector completed (~38
universities, including all Table A providers) plus ~100 well-known
internationals across the US, UK/Europe and Asia-Pacific. For each institution:
overall QS 2026 / THE 2026 ranks plus its 1-3 strongest verified subject or SDG
placements (prioritising world top-10), drawn from whichever product ranked it
best. Researched in four regional batches.

Fetch/verification: ARWU GRAS 2025 from the ShanghaiRanking Nuxt JSON payloads
(exact integer ranks, high confidence); QS by Subject 2026 from the xuanxiao.org
mirror's embedded JSON-LD (top-50 only), corroborated by university press
releases where available; THE Impact/Sustainability from the THE JSON payloads.
Overall ranks are edition-checked to QS 2026 (the mirror sometimes defaults to
QS 2027 — corrected for Michigan, NYU, Duke). Banded overall results recorded at
the lower bound.

Marquee world-#1 claims from this pass: Western Sydney (THE Impact overall #1),
Princeton (Mathematics), Chicago (Economics & Finance), UPenn (Nursing), NYU
(Philosophy), UT Austin (Petroleum Engineering), UC San Diego (Oceanography),
Washington (Atmospheric Science), Michigan (Dentistry), UCL (Education &
Architecture), Amsterdam (Communication & Media), Sheffield (Library &
Information Management), Karolinska (Dentistry), Shanghai Jiao Tong (Biomedical
& Marine/Ocean Engineering). Result: 26 institutions at world #1, ~100 in the
world top 10; the tail (e.g. USQ #151, Notre Dame #201) is recorded as-is.
Lower- confidence overall figures (a few large US publics, some THE
mirror-derived ranks) are flagged in the batch research but published as
best-effort.

## Eleven new ranking systems added 2026-07

Broadened beyond the original five overall publishers (QS, THE, ARWU, U.S. News,
CWUR) to eleven further global ranking systems catalogued on Wikipedia's list of
college and university rankings, each researched in parallel. For every system:
a primary whole-of-institution world table plus, where the publisher issues
them, a few field or dimension sub-tables chosen for where our institutions
place strongest. Ranks are exact integers from each publisher's own data unless
noted; banded results at the lower bound. Coverage is out of the 151
institutions.

- **CWTS Leiden Ranking (2025)** — 145/151. Period 2020–2023, "all sciences",
  fractional counting. Primary table is world rank by P (total publications),
  read from the classic filterable list's AJAX endpoint on
  `traditional.leidenranking.com` (the `www` list now redirects to the Open
  Edition home). Plus a PP(top 10%) scientific-impact table (MIT 1, Princeton 2,
  Caltech 3) and two PP(top 10%) field tables. Caveat: the by-field impact
  tables are distorted by co-authorship on mega-collaborations — Edith Cowan 1
  and Southern Queensland 2 in physical sciences, Swinburne 1 in maths/CS — an
  artefact of gravitational-wave (LIGO/OzGrav) papers. Left in deliberately: it
  is the publisher's own honest figure and the most flattering number those
  institutions can point to.
- **Round University Ranking (2026)** — 127/151. From the JSON endpoints feeding
  the live table (`roundranking.com/data_proc/get_data_raiting_o.php`,
  `id_year=17`). Primary world table plus all four dimensions (teaching,
  research, international diversity, financial sustainability). RUR runs on
  opt-in institutional data submission, so ~24 institutions (Melbourne, Duke,
  Vienna, Delft, Heidelberg and others) show N/A and are absent, not omitted.
- **NTU Ranking (2025)** — 148/151. Performance Ranking of Scientific Papers,
  from the DataTables AJAX JSON on the current host `nturanking.csti.tw` (the
  old `.lis.ntu.edu.tw` host no longer resolves); primary is the `RankU`
  world-rank column, not the FTE-adjusted reference rank. Plus four field tables
  (social sciences, life sciences, clinical medicine, natural sciences). Ranks
  past ~800 are banded → lower bound.
- **University Ranking by Academic Performance (2025–2026)** — 147/151.
  Announced 19 June 2026. The site is a client-rendered Meteor/Kendo app, so the
  full 3,776-institution dataset was read from the grid's in-memory dataSource
  via a headless browser. Plus four field tables from the 2024–2025 field
  edition (URAP's normal one-cycle lag): nursing, studies in human society,
  public/ environmental/occupational health, human movement & sports sciences.
- **SCImago Institutions Rankings (2026)** — 126/151. Rank _within the higher-
  education sector_ (the leading number), not the parenthetical mixed-sector
  global figure. The live site sits behind a Cloudflare managed challenge that
  blocked every fetch method, so figures came from Wayback Machine snapshots
  (which render only the first ~500 rows). Plus Research and Societal component
  tables from the 2025 edition.
- **Webometrics (July 2025, 2025.2.0)** — 151/151, the only full-coverage
  system. The official site has been offline since early 2026 and the January
  2026 edition is now "by request" only, so the last fully open edition was
  used: the 921-page figshare PDF (DOI `10.6084/m9.figshare.29588921.v3`),
  parsed with `pdftotext`. Predatory mirror clones (`webometrics.org`,
  `.online`) were avoided. Every match was cross-checked against the ROR API by
  registered country, which caught one false hit ("Heidelberg University" → a
  college in Ohio, corrected to rank 99). No sub-tables: the
  Impact/Openness/Excellence components are only published per-profile, not as
  standalone lists.
- **Nature Index (2025 annual tables, 2024 Share)** — 116/151. Filtered to the
  academic sector to exclude research institutes (CAS, CNRS, Max Planck) and
  hospital-only entries. From the nature.com annual-tables HTML via `curl`
  (WebFetch hit an auth redirect). Plus physical-sciences, biological-sciences,
  health-sciences and earth-&-environmental subject tables.
- **THE World Reputation Rankings (2025)** — 121/151. The final edition; THE is
  discontinuing this ranking. From the same static JSON-payload trick as the
  other THE tables. Recorded as an overall ranking scoped to "reputation" so the
  claim reads "… in the world for reputation". Individually ranked to ~100, then
  banded → lower bound.
- **Three University Missions / MosIUR (2025)** — 147/151. The full 1–2000 world
  table is embedded directly in the page HTML (`id="top_table"`), read with
  plain `curl`. Ranked 1–300, banded thereafter → lower bound.
- **Aggregate Ranking of Top Universities (2025)** — 129/151. UNSW's seventh
  edition, from the static CSV datasource behind the results-page filter grid
  (`aggregate_ranking` column, top 400). ARTU is a meta-ranking of QS, THE and
  ARWU rather than an independent measurement — included because a
  best-of-the-aggregators number is exactly the kind of figure this site exists
  to surface. Karolinska (absent every year), Utrecht and Zurich (both outside
  the 2025 top 400) were confirmed genuinely absent against the CSV, not
  mismatched.
- **Time World's Top Universities (2026)** — 130/151. The inaugural
  Time/Statista edition, published 28 January 2026, weighting academic capacity
  & performance (60%), innovation & economic impact (30%) and global engagement
  (10%). The article pages block normal fetches; the table is an embedded
  Datawrapper chart whose CSV dataset was read directly.

## Sub-table deepening added 2026-07 (65 further world tables)

More field and subject sub-tables for four systems already held, chosen for
where our institutions place strongest. All are world-scoped, so they feed the
headline like any other table; fetch methods are the ones recorded in
`sources.md`. Ranks are exact integers from each publisher's own data.

- **CWTS Leiden Ranking (2025)** — the three remaining broad fields on the
  PP(top 10%) impact indicator (biomedical & health sciences, life & earth
  sciences, social sciences & humanities), fractional counting, from the
  `traditional.leidenranking.com` AJAX endpoint. 142–144/151 each, matching the
  coverage of the physical-sciences and maths/CS field tables already held.
  Leiden's own institution strings were folded onto our exact key names (e.g.
  "ETH Zürich" → ETH Zurich, "Katholieke Universiteit Leuven" → KU Leuven,
  "University of Michigan" → University of Michigan-Ann Arbor); the merger case
  Institute of Science Tokyo is genuinely below Leiden's per-field threshold and
  left absent.
- **NTU Ranking (2025)** — the two remaining broad fields (engineering,
  agriculture) plus all 26 subject tables from the `SubjectRanking_AJAX/<code>`
  endpoints, restricted to `RankU` ≤ 50. Two subject codes that share a display
  name with a held broad field are disambiguated by id
  (`ntu-clinicalmedicinesubject-2025`, `ntu-socialsciencesgeneral-2025`).
- **University Ranking by Academic Performance (2024–2025)** — fifteen further
  field tables (engineering, the physical/chemical/biological/earth/
  environmental sciences, agriculture, veterinary, education, psychology,
  economics, law, computing, mathematics, medical & health), each top-50, read
  from the client-rendered grid via `agent-browser`.
- **SCImago Institutions Rankings** — eighteen subject-area tables (medicine,
  engineering, computer science, physics, chemistry, the social sciences and
  humanities, and more), higher-education-sector rank, from Wayback snapshots of
  the Cloudflare-blocked live site. Editions vary by subject (2025 or 2026)
  because the usable snapshot date differs per area; each `url` is the snapshot
  actually read. Six areas had no country-unfiltered snapshot and were skipped
  rather than guessed.

## National league tables added 2026-07 (home-market numbers)

National rankings rank universities against others in their own country, not the
world, so a new optional `universe` field on a ranking (e.g. "the United
Kingdom") marks these: on an institution's profile they read "… in the United
Kingdom" rather than "… in the world", and they are deliberately excluded from
the world-scoped headline figure and the front-page league table. They give the
non-Australian institutions a home-market number without ever letting a national
rank masquerade as a world rank. Sourced from the relevant Wikipedia "Rankings
of universities in <country>" aggregators cross-checked against the primary
tables and university press releases.

- **United Kingdom** — Complete University Guide 2027 (via a Wayback capture of
  the CloudFront-blocked live page's embedded rank attributes) and the Guardian
  University Guide 2026 (from the Wikipedia aggregator, the Guardian site not
  being directly fetchable). All 19 UK institutions in each. The Times / Sunday
  Times Good University Guide was skipped: paywalled, and the only open
  reproduction exposed just ranks 1–10 with an internal inconsistency.
- **United States** — U.S. News Best Colleges 2026 National Universities (36),
  the Wall Street Journal / College Pulse 2026 list (28) and Forbes America's
  Top Colleges 2025–2026 (34). U.S. News is anti-bot-blocked here and WSJ/Forbes
  are paywalled, so ranks were read from published reproductions and
  cross-checked against university press releases; the `url` on the WSJ and
  Forbes tables points to the canonical publisher page. Washington Monthly was
  skipped — its 2025 guide no longer publishes a single National Universities
  table.
- **Canada** — Maclean's University Rankings 2026, Medical Doctoral category,
  all five Canadian institutions (McGill 1, Toronto 2, UBC 3, Alberta 4,
  Montreal 11).
- **Japan** — THE Japan University Rankings 2025 (from the underlying datatable
  JSON): Tohoku 1, Tokyo 3, Kyoto 4, Osaka 6. Institute of Science Tokyo is left
  absent because THE's 2025 table still lists its two 2024 merger predecessors
  (Tokyo Institute of Technology, Tokyo Medical & Dental) separately, with no
  combined entry.

## Not included

U.S. News global subject tables could not be verified from this host (anti-bot
block), so only the U.S. News overall world ranking is recorded (the U.S. News
_National Universities_ table is held separately as a national ranking, above).

Excellence in Research for Australia (ERA), cited on Wikipedia's Group of Eight
page, was deliberately excluded: it rates each research field on a 1–5 "world
standard" scale rather than producing a rank-ordered position, so it has no
world (or national) place number to record.

Defunct or low-credibility global systems from Wikipedia's catalogue were
deliberately skipped: Reuters Most Innovative (last 2019), HEEACT (ended 2012),
RatER, G-factor, Newsweek (discontinued 2006), and U-Multirank (publishes
letter-grade bands per indicator rather than a single world rank).
