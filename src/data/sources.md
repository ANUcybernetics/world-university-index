# Source manifest — what we track and how to refresh it

Forward-looking companion to `PROVENANCE.md` (which records where specific
figures came from). This lists every ranking **product** we track, when its next
edition is due, the latest edition we hold, and — most importantly — the fetch
method that actually works, so a refresh doesn't have to rediscover it.

Policy: editions are **additive**. We never replace an edition with a newer one;
each year is an independent table so an institution's best rank can cherry-pick
the best table _and_ the best year. When a new edition drops, add it alongside
the existing ones. Record each institution's strong placements (roughly world
top ~50); banded results at the lower bound.

To check coverage against this manifest: `pnpm update-rankings` prints per-table
institution counts and the current headline leaders.

## Which institutions are in the Index

An institution is in the Index when a ranking we track places it in the world
top 50 of any table --- overall, subject, SDG, thematic or national. The rule is
derived rather than borrowed: there is no canonical roster of the world's
universities to adopt, and membership here is a consequence of the tables we
track, not a list chosen in advance. It mirrors the rule for indices themselves
(an index counts once an institution has cited it).

The top-50 bar is what keeps every headline flattering, which is the whole
premise. Admit any placement at all and institutions start headlining at 3000th
in the world, which is not a claim anyone puts on a media release.

Every institution carries a `ror` identifier
([Research Organization Registry](https://ror.org), CC0). It is never displayed.
It exists so a row in one publisher's table can be matched to the same
institution in another's: name-matching fails in both directions, missing "UNSW
Sydney" against "University of New South Wales" and wrongly matching
"Northwestern University" to "Lyceum-Northwestern University". Attach ids with
`pnpm ror-backfill`; `--check` re-resolves every stored id against ROR.

## Tables that rank departments

A few products rank faculties, schools or departments rather than whole
institutions --- ShanghaiRanking's sport science ranking is titled "Global
Ranking of Sport Science Schools and Departments", and its first row is Deakin
University's School of Exercise and Nutrition Sciences, not Deakin. The Index
reports those placements under the parent institution's name and records the
unit in `units`, keyed by ranking id. Same principle as `universe`: the truth is
kept, the claim stays deadpan, and the small print is the only tell.

The unit needs no matching. ShanghaiRanking prints it in its own `sub-name`
element and the institution as a `/universities/<slug>` link, so
`pnpm ingest-grsssd <year> <ranking-id>` reads both out of the markup
structurally. Any future department-level product should clear the same bar
before being added: if the unit can't be extracted without hand-matching, the
table isn't worth the maintenance.

## How the data is curated

Extraction is scripted, verification is not. The fetch methods below get a whole
table in one request wherever possible, which is what makes expansion tractable
at all. But a scraped figure attached to the wrong institution is worse than a
missing one, so each candidate is then checked individually --- a fleet of small
agents, one per institution or per figure, each confirming the number against
the publisher's own table and reporting what it actually saw.

Agent output is never trusted on its face. Anything an agent proposes is
re-verified mechanically before it lands: ROR ids are re-resolved through the
API, and citation quotes are matched character-for-character against the live
page (of 42 proposed quotes, six failed that check and were dropped). Propose
and trust are separate steps, and only the second one is authoritative.

Whole tables go in through `pnpm ingest-table <table.json>...`. Each fetch
method below produces a normalised table file (the format is in the script's
header); the script records placements for institutions already held and admits
the top-50 rows that match nobody, taking each newcomer's name, city and ROR id
from ROR. It admits only what ROR vouches for --- chosen or exactly named, same
country as the publisher says, a university rather than an institute --- and
prints the rest. Names ROR can't settle are mapped by hand in
`scripts/ror-overrides.json`, which gets the same country check. A check that
passes can still be wrong: a hand-picked id once named the right university's
other campus in the same country, so look an override up rather than recall it.

## Fetch methods (host-specific, learned the hard way)

- **QS / topuniversities.com** — Cloudflare + Turnstile blocked here, for both
  WebFetch and headless agent-browser. Use the `xuanxiao.org` mirror (mirrors QS
  subject + world tables) and cross-check against the QS PR Newswire release and
  university media releases. Never trust a single mirror figure without a
  press-release cross-check. The mirror is now Cloudflare-blocked for curl and
  headless Chrome too, but WebFetch reads its English pages:
  `xuanxiao.org/en/rankings/qs/regional/<slug>[/<year>]?page=N`, 50 rows a page,
  with slugs `asia-university-rankings`, `europe-university-rankings`,
  `latin-america-caribbean-overall` and `arab-region-university-rankings` (no
  year for the latest edition). WebFetch paraphrases, so ask for rows verbatim,
  and expect it to drop `=` tie markers and skip the odd row.
- **THE / timeshighereducation.com** — UI is JS-rendered and ad scripts hijack
  the tab, but every ranking page ships its data in an embedded JSON payload
  (`/json/ranking_tables/...`, or the `__NEXT_DATA__`-style blob on
  `/rankings/impact/<slug>/<year>`). Fetch and parse that directly. Table names
  aren't the page slugs; read each from the `ranking_tables/...` string in the
  page source. Current ones: `world_university_rankings`,
  `asia_university_rankings`, `arabic_university_rankings`,
  `latin_america_rankings`, `isr_university_rankings`, and per subject
  `<subject>_rankings` (`engineering_technology_rankings`,
  `clinical_pre_clinical_health_ran` --- truncated). There is no Asia-Pacific or
  Sub-Saharan Africa table in this form.
- **ARWU / shanghairanking.com** — whole tables come as JSON from
  `/api/pub/v1/arwu/rank?version=<year>` and
  `/api/pub/v1/gras/rank?version=<year>&subj_code=<AScode>` (plain `curl`,
  browser UA; fields `ranking`, `univNameEn`, `region`), with subject codes
  listed on `/rankings/gras/<year>`. agent-browser gets redirect-hijacked on
  this host — use curl. The HTML pages (`/rankings/gras/<year>/<AScode>`,
  `/rankings/grsssd/<year>`, `/institution/<slug>`) server-render only the top
  ~30 rows; `/api/pub/v1/inst/<slug>` returns one institution's full ranked
  subject list, current edition only. In the HTML, the name cell prints the
  institution twice followed by the country, so match on that doubled prefix: a
  substring match will put "Columbia University" at the rank belonging to the
  "University of British Columbia".
- **U.S. News** — HTTP/2 anti-bot block on this host; subject tables could not
  be verified. Only the overall table is recorded. Don't go looking for a way
  round it: curl, WebFetch, headless Chromium, Wayback, Common Crawl and reader
  proxies have all been tried and all fail, and the universities themselves
  rarely cite this ranking. Take the figure from a press release or leave it.
- **Leiden / leidenranking.com** — the `www` list now redirects to the Open
  Edition home; the classic filterable list lives on
  `traditional.leidenranking.com`, whose form posts to
  `/Ranking2025/Ranking2025ListResult` and returns the full non-paged HTML
  table. The form fields are `field`, `period_id`, `performance-dimension`,
  `ranking-indicator`, `sort-indicator`, `number-of-publications` and
  `fractional_counting`, but posting them directly answered 400 in September
  2026 — the working parameter set needs rediscovery, so treat any Leiden figure
  that has not been read off the rendered table as unverified.
- **Leiden Open Edition / open.leidenranking.com** — GET `/ranking/<year>/list`
  for a cookie, then POST `/Ranking<year>/Ranking<year>ListResult` with
  `X-Requested-With: XMLHttpRequest` and
  `field_id=0&performance_dimension=0&ranking_indicator=3&fractional_counting=true&core_pubs_only=true&number_of_publications=100&period_id=15&order_by=<p|pp_top_10>`
  for the full HTML table (2024: `core_pub_only=false`, `period_id=14`).
  `ranking_indicator` must be 3 for the PP(top 10%) sort or the table comes back
  empty. Take names from each span's `data-tooltip` (the visible text is
  abbreviated) and countries from the flag's. Rank is position in the sort; ties
  can't be seen at the displayed precision.
- **CWUR / cwur.org** — `/<year>.php` carries all 2000 rows in one HTML table;
  plain `curl`.
- **UI GreenMetric / greenmetric.ui.ac.id** — unreachable from this host. The
  overall table is one static page (`/rankings/overall-rankings-<year>/`,
  `table#tableranking`), so read it from a Wayback capture
  (`web.archive.org/web/<year+1>/<url>`).
- **RUR / roundranking.com** — the documented `.html` URL 404s; the live table
  is fed by
  `data_proc/get_data_raiting_o.php?id_year=<code>&rank=<O|T|R|I|F>&srt=rf`,
  `curl` with a browser UA. `id_year` is the year minus 2009 (`17` = 2026), and
  the `srt` parameter is required — without it the endpoint answers 500.
- **NTU / nturanking.csti.tw** — the old `.lis.ntu.edu.tw` host is dead.
  DataTables AJAX endpoints return JSON: `/OverallRanking_AJAX/<year>` and
  `/FieldRanking_AJAX/<FIELD>/<year>`, both behind a 301 — `curl -L`. Use the
  `RankU` column, not `Ref_RankU`.
- **URAP / urapcenter.org** — a client-rendered Meteor/Kendo app;
  `curl`/WebFetch get an empty shell. Render with agent-browser and read the
  grid's client-side dataSource (all institutions in one JS array).
- **SCImago / scimagoir.com** — Cloudflare managed challenge blocks WebFetch,
  `curl` and headless agent-browser alike; use Wayback Machine snapshots (which
  render only the first ~500 rows). Use the higher-education-sector rank, not
  the parenthetical mixed-sector global figure.
- **Webometrics / webometrics.info** — official site offline since early 2026
  and the current edition is "by request" only. Use the last fully open edition
  on figshare (July 2025 = DOI `10.6084/m9.figshare.29588921.v3`) as a PDF,
  parsed with `pdftotext`. Avoid the predatory clones (`webometrics.org`,
  `.online`).
- **Nature Index / nature.com** — WebFetch hits an auth redirect; `curl` the
  `/nature-index/research-leaders/<year>/institution/academic/<subject>/global`
  HTML and filter to the academic sector. The path was `/annual-tables/<year>/`
  before the 2026 edition.
- **THE reputation** — same JSON-payload trick as the other THE tables: a static
  file under `/sites/default/files/the_data_rankings/`.
- **MosIUR / mosiur.org** — the full 1–2000 table is embedded in the page HTML
  (`id="top_table"`); plain `curl`.
- **ARTU / unsw.edu.au** — the results page is a JS filter grid; its datasource
  is a static CSV under `/content/dam/pdfs/.../ARTU_website_data_<date>.csv`
  (`aggregate_ranking` column).
- **Time / time.com** — article pages block normal UAs (403/406, a Googlebot UA
  works); the table is an embedded Datawrapper chart with a CSV at
  `datawrapper.dwcdn.net/<id>/dataset.csv`.
- **Complete University Guide / thecompleteuniversityguide.co.uk** — the live
  league table fetches directly with `curl` and a browser UA. Rows carry
  `data-<N>-uni-ranking` attributes with exact positions (ties included).
- **Guardian University Guide / theguardian.com** — the interactive isn't
  directly fetchable; read the ordered table from the Wikipedia "Rankings of
  universities in the United Kingdom" wikitext via the MediaWiki raw API.
- **U.S. News National Universities / usnews.com** — same HTTP/2 anti-bot block
  as the overall table; read the order from a reproduction and cross-check
  against university press releases. Ties share an ordinal.
- **WSJ / Forbes US college rankings** — wsj.com and forbes.com are
  paywalled/JS-heavy; read positions from published reproductions (e.g.
  poetsandquants.com) and cross-check press releases. The stored `url` is the
  canonical publisher page, not the reproduction.
- **Maclean's / macleans.ca** — capture the category table (Medical Doctoral for
  the research universities); cross-check against each university's own page.
- **THE Japan University Rankings** — same JSON-payload trick as the other THE
  tables (`timeshighereducation.com/rankings/japan`). Probably discontinued
  after the 2025 edition: secondary sources report the Benesse partnership has
  ended, with no primary THE statement either way.

National league tables (CUG, Guardian, U.S. News National, WSJ, Forbes,
Maclean's, THE Japan) carry a `universe` field naming the country they rank
within. It is recorded for provenance only: the site reports these placements
deadpan as "Nth in the world" like any other, so a national #1 can headline as a
world #1 — the source line is the only tell. That is the joke.

## Products tracked

| Product                                                   | Publisher                            | Next edition ~due        | Latest held | Notes                                                                                                                        |
| --------------------------------------------------------- | ------------------------------------ | ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| QS World University Rankings (overall)                    | QS                                   | June (annual)            | 2027        | Hold 2025, 2026, 2027. Adelaide 2027 = merged "Adelaide University".                                                         |
| QS World University Rankings by Subject                   | QS                                   | March (annual)           | 2026        | Hold 2025, 2026. ~55 disciplines; we track the ones where our institutions place well.                                       |
| QS World University Rankings: Sustainability              | QS                                   | Nov (annual)             | 2026        | One overall table.                                                                                                           |
| QS regional rankings (Asia, Europe, Latin America, Arab)  | QS                                   | various (annual)         | 2026–2027   | Asia 2025–26, Europe 2025–26, Latin America 2026–27, Arab Region 2026–27. `universe` set; via the WebFetch mirror route.     |
| QS Graduate Employability Rankings                        | QS                                   | discontinued             | 2022        | Last standalone edition was 2022; folded into main methodology since.                                                        |
| THE World University Rankings (overall)                   | THE                                  | Sept/Oct (annual)        | 2027        | Hold 2026, 2027. 2027 released 30 Sep 2026, individual ranks to 300.                                                         |
| THE Sustainability Impact Ratings (was "Impact Rankings") | THE                                  | June (annual)            | 2026        | Hold 2024, 2025, 2026. Rebranded at the 2026 edition. Overall + 17 SDG tables. Most Go8 don't participate.                   |
| THE Young University Rankings                             | THE                                  | discontinued             | 2024        | Discontinued after the 2024 edition — do not look for a 2025.                                                                |
| THE World University Rankings by Subject                  | THE                                  | Jan (annual)             | 2026        | Hold 2025, 2026. All 11 subjects.                                                                                            |
| THE Interdisciplinary Science Rankings                    | THE                                  | Nov (annual)             | 2026        | Hold 2025, 2026. Scope "interdisciplinary science".                                                                          |
| THE Asia University Rankings (regional)                   | THE                                  | Apr (annual)             | 2026        | Hold 2025, 2026. `universe` Asia.                                                                                            |
| THE Arab University Rankings (regional)                   | THE                                  | annual                   | 2026        | `universe` the Arab region.                                                                                                  |
| THE Latin America University Rankings (regional)          | THE                                  | annual                   | 2026        | `universe` Latin America.                                                                                                    |
| ARWU Academic Ranking of World Universities (overall)     | ShanghaiRanking                      | Aug (annual)             | 2026        | Hold 2025, 2026.                                                                                                             |
| ARWU Global Ranking of Academic Subjects (GRAS)           | ShanghaiRanking                      | Oct/Nov (annual)         | 2026        | Hold 2024, 2025, 2026. 57 subjects, all held for 2026.                                                                       |
| ARWU Global Ranking of Sport Science (GRSSSD)             | ShanghaiRanking                      | annual                   | 2025        | Hold 2024, 2025.                                                                                                             |
| U.S. News Best Global Universities (overall)              | U.S. News                            | Oct (annual)             | 2026-2027   | Subject tables blocked here (see above).                                                                                     |
| CWUR Global 2000                                          | Center for World University Rankings | June (annual)            | 2026        | Hold 2025, 2026.                                                                                                             |
| CWTS Leiden Ranking                                       | CWTS, Leiden University              | mid-year (annual)        | 2025        | Overall (P) + PP(top 10%) impact + all 5 broad-field tables. Field impact tables skewed by mega-collaboration co-authorship. |
| CWTS Leiden Ranking Open Edition                          | CWTS, Leiden University              | Oct (annual)             | 2025        | Hold 2024, 2025. OpenAlex-based; overall (P) + PP(top 10%). CWTS says it will replace the traditional list.                  |
| Round University Ranking (RUR)                            | RUR Rankings Agency                  | annual                   | 2026        | Overall + 4 dimensions. Opt-in data model, so many institutions are N/A.                                                     |
| NTU Ranking                                               | National Taiwan University           | annual                   | 2025        | Overall + 8 field tables + 26 subject tables. Banded past ~800 → lower bound.                                                |
| University Ranking by Academic Performance (URAP)         | METU (URAP Lab)                      | mid-year (annual)        | 2025-2026   | Overall + 19 field tables (field edition lags the world edition by one cycle).                                               |
| SCImago Institutions Rankings (SIR)                       | SCImago Research Group               | annual (Mar)             | 2026        | Overall + Research/Societal + 18 subject-area tables. Higher-ed-sector rank. Cloudflare-blocked; via Wayback.                |
| Webometrics                                               | Cybermetrics Lab, CSIC               | Jan & Jul (twice yearly) | 2025.2      | Site offline since early 2026; last open edition is Jul 2025 on figshare.                                                    |
| Nature Index                                              | Nature / Springer Nature             | annual tables (rolling)  | 2025        | Academic-sector filter. Overall + subject tables.                                                                            |
| THE World Reputation Rankings                             | THE                                  | discontinued             | 2025        | Final edition — THE is retiring this ranking. Recorded as overall scoped "reputation".                                       |
| Three University Missions (MosIUR)                        | Association of Rating Makers         | annual                   | 2025        | Single overall table, banded past 300.                                                                                       |
| Aggregate Ranking of Top Universities (ARTU)              | UNSW Sydney                          | annual                   | 2025        | Meta-ranking of QS/THE/ARWU; top 400 only.                                                                                   |
| Time World's Top Universities                             | Time / Statista                      | annual (Jan)             | 2026        | Inaugural 2026 edition. Single overall table.                                                                                |
| UI GreenMetric World University Rankings                  | Universitas Indonesia                | Dec (annual)             | 2025        | Hold 2024, 2025. Opt-in campus-sustainability ranking; via Wayback.                                                          |
| Complete University Guide (UK, national)                  | Complete University Guide            | annual (June)            | 2027        | National (UK); `universe`. Live page Wayback-only.                                                                           |
| Guardian University Guide (UK, national)                  | Guardian News & Media                | annual (Sept)            | 2026        | National (UK); via the Wikipedia aggregator.                                                                                 |
| U.S. News National Universities (US, national)            | U.S. News                            | Sep (annual)             | 2026        | National (US); usnews.com blocked, via reproductions.                                                                        |
| WSJ / College Pulse Best Colleges (US, national)          | Wall Street Journal                  | annual                   | 2026        | National (US); paywalled, via reproductions.                                                                                 |
| Forbes America's Top Colleges (US, national)              | Forbes                               | annual                   | 2025-2026   | National (US); paywalled, via reproductions.                                                                                 |
| Maclean's University Rankings (Canada, national)          | Maclean's                            | annual                   | 2026        | National (Canada); Medical Doctoral category.                                                                                |
| THE Japan University Rankings (Japan, national)           | THE                                  | probably discontinued    | 2025        | National (Japan); THE JSON payload. Benesse partnership reportedly ended — treat 2025 as final unless a 2026 appears.        |
| Global Index of Research Throughput (GIRT)                | Slop University                      | annual                   | 2026        | Self-published, opt-in submission; sole participant places 1st. `universe`.                                                  |

## When refreshing

1. For each product whose "next edition" date has passed, fetch it with the
   method above into a normalised table file and run `pnpm ingest-table` on it
   (dry run first, then `--write`). Editions are added, never replaced.
2. Resolve what it reports as unresolved: add a looked-up id to
   `scripts/ror-overrides.json` and re-run, or leave the row out. Record the
   edition and fetch route in `PROVENANCE.md`.
3. Bump "Latest held" in the table above.
4. `pnpm update-rankings --write` to normalise and validate.
