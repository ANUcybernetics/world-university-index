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

## Fetch methods (host-specific, learned the hard way)

- **QS / topuniversities.com** — Cloudflare + Turnstile blocked here, for both
  WebFetch and headless agent-browser. Use the `xuanxiao.org` mirror (mirrors QS
  subject + world tables) and cross-check against the QS PR Newswire release and
  university media releases. Never trust a single mirror figure without a
  press-release cross-check.
- **THE / timeshighereducation.com** — UI is JS-rendered and ad scripts hijack
  the tab, but every ranking page ships its data in an embedded JSON payload
  (`/json/ranking_tables/...`, or the `__NEXT_DATA__`-style blob on
  `/rankings/impact/<slug>/<year>`). Fetch and parse that directly.
- **ARWU / shanghairanking.com** — static Nuxt/JSON payload readable with a
  plain `curl` (`/rankings/gras/<year>/<AScode>`, `/rankings/grsssd/<year>`,
  `/institution/<slug>`). agent-browser gets redirect-hijacked on this host —
  use curl.
- **U.S. News** — HTTP/2 anti-bot block on this host; subject tables could not
  be verified. Only the overall table is recorded.
- **Leiden / leidenranking.com** — the `www` list now redirects to the Open
  Edition home; the classic filterable list lives on
  `traditional.leidenranking.com`, whose form posts to
  `/Ranking2025/Ranking2025ListResult` and returns the full non-paged HTML
  table.
- **RUR / roundranking.com** — the documented `.html` URL 404s; the live table
  is fed by `data_proc/get_data_raiting_o.php?id_year=<code>&rank=<O|T|R|I|F>`
  (`id_year=17` = 2026), `curl` with a browser UA.
- **NTU / nturanking.csti.tw** — the old `.lis.ntu.edu.tw` host is dead.
  DataTables AJAX endpoints return JSON: `/OverallRanking_AJAX/<year>` and
  `/FieldRanking_AJAX/<FIELD>/<year>`. Use the `RankU` column, not `Ref_RankU`.
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
  `/nature-index/annual-tables/<year>/institution/academic/<subject>/global`
  HTML and filter to the academic sector.
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
  league table is CloudFront-blocked (403); read a Wayback Machine capture,
  whose rows carry `data-<N>-uni-ranking` attributes with exact positions (ties
  included).
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
  tables (`timeshighereducation.com/rankings/japan`).

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
| QS Graduate Employability Rankings                        | QS                                   | discontinued             | 2022        | Last standalone edition was 2022; folded into main methodology since.                                                        |
| THE World University Rankings (overall)                   | THE                                  | Oct (annual)             | 2026        | 2027 due Oct 2026.                                                                                                           |
| THE Sustainability Impact Ratings (was "Impact Rankings") | THE                                  | June (annual)            | 2026        | Hold 2024, 2025, 2026. Rebranded at the 2026 edition. Overall + 17 SDG tables. Most Go8 don't participate.                   |
| THE Young University Rankings                             | THE                                  | discontinued             | 2024        | Discontinued after the 2024 edition — do not look for a 2025.                                                                |
| ARWU Academic Ranking of World Universities (overall)     | ShanghaiRanking                      | Aug (annual)             | 2025        | 2026 due ~Aug 2026.                                                                                                          |
| ARWU Global Ranking of Academic Subjects (GRAS)           | ShanghaiRanking                      | Nov (annual)             | 2025        | Hold 2024, 2025. 57 subjects, each at `/rankings/gras/<year>/<AScode>`.                                                      |
| ARWU Global Ranking of Sport Science (GRSSSD)             | ShanghaiRanking                      | annual                   | 2025        | Hold 2024, 2025.                                                                                                             |
| U.S. News Best Global Universities (overall)              | U.S. News                            | Oct (annual)             | 2026-2027   | Subject tables blocked here (see above).                                                                                     |
| CWUR Global 2000                                          | Center for World University Rankings | mid-year (annual)        | 2025        | 2026 due ~mid-2026.                                                                                                          |
| CWTS Leiden Ranking                                       | CWTS, Leiden University              | mid-year (annual)        | 2025        | Overall (P) + PP(top 10%) impact + all 5 broad-field tables. Field impact tables skewed by mega-collaboration co-authorship. |
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
| Complete University Guide (UK, national)                  | Complete University Guide            | annual (June)            | 2027        | National (UK); `universe`. Live page Wayback-only.                                                                           |
| Guardian University Guide (UK, national)                  | Guardian News & Media                | annual (Sept)            | 2026        | National (UK); via the Wikipedia aggregator.                                                                                 |
| U.S. News National Universities (US, national)            | U.S. News                            | Sep (annual)             | 2026        | National (US); usnews.com blocked, via reproductions.                                                                        |
| WSJ / College Pulse Best Colleges (US, national)          | Wall Street Journal                  | annual                   | 2026        | National (US); paywalled, via reproductions.                                                                                 |
| Forbes America's Top Colleges (US, national)              | Forbes                               | annual                   | 2025-2026   | National (US); paywalled, via reproductions.                                                                                 |
| Maclean's University Rankings (Canada, national)          | Maclean's                            | annual                   | 2026        | National (Canada); Medical Doctoral category.                                                                                |
| THE Japan University Rankings (Japan, national)           | THE                                  | annual                   | 2025        | National (Japan); THE JSON payload.                                                                                          |

## When refreshing

1. For each product whose "next edition" date has passed, fetch it with the
   method above and add it as a new set of tables (do not delete the old ones).
2. Add the specific figures + source URLs to `PROVENANCE.md`.
3. Bump "Latest held" in the table above.
4. `pnpm update-rankings --write` to normalise and validate.
