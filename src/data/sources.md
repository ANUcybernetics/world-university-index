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

## Products tracked

| Product                                                   | Publisher                            | Next edition ~due | Latest held | Notes                                                                                                      |
| --------------------------------------------------------- | ------------------------------------ | ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| QS World University Rankings (overall)                    | QS                                   | June (annual)     | 2027        | Hold 2025, 2026, 2027. Adelaide 2027 = merged "Adelaide University".                                       |
| QS World University Rankings by Subject                   | QS                                   | March (annual)    | 2026        | Hold 2025, 2026. ~55 disciplines; we track the ones where our institutions place well.                     |
| QS World University Rankings: Sustainability              | QS                                   | Nov (annual)      | 2026        | One overall table.                                                                                         |
| QS Graduate Employability Rankings                        | QS                                   | discontinued      | 2022        | Last standalone edition was 2022; folded into main methodology since.                                      |
| THE World University Rankings (overall)                   | THE                                  | Oct (annual)      | 2026        | 2027 due Oct 2026.                                                                                         |
| THE Sustainability Impact Ratings (was "Impact Rankings") | THE                                  | June (annual)     | 2026        | Hold 2024, 2025, 2026. Rebranded at the 2026 edition. Overall + 17 SDG tables. Most Go8 don't participate. |
| THE Young University Rankings                             | THE                                  | discontinued      | 2024        | Discontinued after the 2024 edition — do not look for a 2025.                                              |
| ARWU Academic Ranking of World Universities (overall)     | ShanghaiRanking                      | Aug (annual)      | 2025        | 2026 due ~Aug 2026.                                                                                        |
| ARWU Global Ranking of Academic Subjects (GRAS)           | ShanghaiRanking                      | Nov (annual)      | 2025        | Hold 2024, 2025. 57 subjects, each at `/rankings/gras/<year>/<AScode>`.                                    |
| ARWU Global Ranking of Sport Science (GRSSSD)             | ShanghaiRanking                      | annual            | 2025        | Hold 2024, 2025.                                                                                           |
| U.S. News Best Global Universities (overall)              | U.S. News                            | Oct (annual)      | 2026-2027   | Subject tables blocked here (see above).                                                                   |
| CWUR Global 2000                                          | Center for World University Rankings | mid-year (annual) | 2025        | 2026 due ~mid-2026.                                                                                        |

## When refreshing

1. For each product whose "next edition" date has passed, fetch it with the
   method above and add it as a new set of tables (do not delete the old ones).
2. Add the specific figures + source URLs to `PROVENANCE.md`.
3. Bump "Latest held" in the table above.
4. `pnpm update-rankings --write` to normalise and validate.
