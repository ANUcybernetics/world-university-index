# The World University Index

You're an academic filling out the 'institutional context' section of a grant
application or a stressed marketing intern pumping out 'study with us' posts
across all the socials. You need a defensible number to give for your
university's ranking which shows you in the best possible light. The _World
University Index_ has got your back.

It's an authoritative-looking reference to the standing of the world's
universities --- which reports, for every institution, its single best
(lowest-numbered) placement across the major international rankings.

[Every](https://reporter.anu.edu.au/all-stories/anu-climbs-the-global-university-rankings-in-key-subjects)
[university](https://www.unimelb.edu.au/newsroom/news/2025/march/university-of-melbourne-in-top-50-for-qs-subject-rankings)
[proudly](https://www.sydney.edu.au/about-us/our-world-rankings.html)
[and](https://www.unsw.edu.au/newsroom/news/2026/03/39-unsw-subjects-in-global-top-100)
[relentlessly](https://news.uq.edu.au/2026-03-uq-subjects-rank-top-10-globally)
[trumpets](https://www.monash.edu/news/articles/monash-strengthens-its-position-among-the-worlds-best-with-pharmacy-world-2-and-success-across-all-faculties)
[whichever](https://www.uwa.edu.au/about/rankings-and-reputation)
[global](https://adelaide.edu.au/about/news/2026/adelaide-university-scores-global-subject-recognition-/)
[ranking](https://www.uts.edu.au/news/2026/03/world-class-rankings-for-it-and-health-subjects)
[happens](https://lighthouse.mq.edu.au/media-releases/2026/march-2026/macquarie-surges-in-global-rankings-with-record-number-of-top-subjects)
[to](https://www.rmit.edu.au/news/all-news/2026/mar/global-rankings-rmit)
[show](https://www.qut.edu.au/news?id=188053)
[it](https://www.curtin.edu.au/about/reputation-rankings/)
[in](https://www.deakin.edu.au/about-deakin/news-and-media-releases/articles/deakin-retains-top-spot-in-global-rankings-for-sports-science-schools)
[the](https://www.uow.edu.au/media/2026/uow-ranks-6th-in-the-world-for-philosophy-in-qs-subject-rankings-2026.php)
[most](https://www.newcastle.edu.au/news/2026/06/University-of-Newcastle-ranked-in-the-top-30-globally-in-the-2026-Times-Higher-Education-Impact-Rankings)
[flattering](https://news.griffith.edu.au/2026/03/26/griffith-leaps-in-2026-qs-subject-rankings/)
[possible](https://www.canberra.edu.au/future-students/study-at-uc/international/international-student-experience-at-uc/why-rankings-matter-at-uc)
[light](https://newshub.medianet.com.au/2026/03/sport-nursing-archaeology-top-50-in-qs-rankings/145752/)
[each](https://www.swinburne.edu.au/news/2025/03/swinburne-shines-in-2025-qs-world-university-rankings-by-subject/)
year --- and with over a hundred ranking tables now in circulation (overall, by
subject, by Sustainable Development Goal, and across several editions of each),
there is almost always one in your institution can call itself world-leading.

You could look at the
[methodology](https://anucybernetics.github.io/world-university-index/methodology/)
if you like. But who's got time for that? Honestly, just grab the number and use
it with confidence.

## Data

All ranking figures live in [`src/data/rankings.json`](src/data/rankings.json):
a list of ranking tables --- overall, by subject, by Sustainable Development
Goal, and thematic, across multiple editions --- and a list of institutions,
each with its position in the tables it appears in. A table may be scoped to a
subject or theme (e.g. "Philosophy", "climate action (SDG 13)") or ranked within
a single country, and the site reports each institution's single best position
across all of them, whatever the scope, country or year --- always deadpan as
"Nth in the world". A national league-table placement counts too, reported with
the same straight face as everything else; the source line (e.g. "CUG 2027") is
the only tell. Banded results (e.g. "201--250") are recorded at the lower bound.
The schema and best-rank logic are in [`src/lib/`](src/lib); where each figure
comes from and how to refresh it are in
[`PROVENANCE.md`](src/data/PROVENANCE.md) and
[`sources.md`](src/data/sources.md).

```sh
pnpm update-rankings            # validate + integrity-check + report
pnpm update-rankings --write    # also rewrite the file, normalised and sorted
pnpm update-rankings --sources  # where each ranking is published
pnpm update-rankings --links    # check every citation URL still resolves
```

The major rankings don't publish a clean, openly-licensed machine-readable feed
--- their tables render client-side and their terms restrict bulk reuse --- so
each table is fetched by the host-specific method recorded in
[`sources.md`](src/data/sources.md), and every figure is then checked
individually against the publisher's own table before it lands.
[`scripts/update-rankings.ts`](scripts/update-rankings.ts) keeps the result
honest: schema-valid, internally consistent and stably ordered.

An institution is listed once some tracked ranking places it in the world top 50
of any table. That bar is what keeps every headline flattering; admit any
placement at all and institutions start headlining at 3000th in the world. Each
one carries a [ROR](https://ror.org) identifier so a row in one publisher's
table can be matched to the same institution in another's --- attach them with
`pnpm ror-backfill`, verify with `pnpm ror-backfill --check`.

## Departments

Some tables rank units, not institutions: ShanghaiRanking's is explicitly of
"Schools and Departments", so Deakin's world #1 in sport science belongs to its
School of Exercise and Nutrition Sciences. The rank is recorded against the
institution and the unit alongside it in `units`, then shown only in the small
print --- the same treatment `universe` gives a national league table. Ingest
with `pnpm ingest-grsssd <year> <ranking-id>`; the unit is read out of the
markup, never matched by hand.

## Citations

Every ranking in the Index is one somebody has boasted about.
[`src/data/citations.json`](src/data/citations.json) records those boasts: for
each one, the institution, the index cited (as a `ranking` id where the claim
names an edition we hold, otherwise as a `product` short name), the page it
appeared on, and a verbatim pull quote of what was actually said. An archive URL
is stored where the original is likely to be restructured away.

The citing institution need not appear in the Index. Most do not, and that is
the point: a ranking is vouched for by whoever quotes it, so a Turkish, Filipino
or Palestinian university boasting about a table is evidence about the table
regardless of whether we hold a figure for them.

This is the Index's inclusion test, and it is deliberately generous. A ranking
counts once one institution has quoted it — not because the ranking is rigorous
or well known, but because being quoted by an interested party is, in practice,
what a ranking's authority consists of. The obscure ones are the most eloquent:
a university citing a table almost nobody has heard of tells you something about
the currency of that table which a household name never could.

Quotes are recorded verbatim and never tidied, capped at 300 characters, and
always shown with a link to the source. Every quote in the file was verified
against the live page rather than transcribed. `pnpm update-rankings` checks
that each citation resolves to a ranking and product that exist, and warns about
claims that vouch for no index at all.

## Machine-readable output

The built site publishes the dataset as JSON alongside the pages:

| Endpoint | Contents |
| --- | --- |
| `/api/institutions.json` | every institution, with `ror`, slug, headline placement and full placement profile |
| `/api/indices.json` | every ranking table, with placement and citation counts |
| `/api/citations.json` | every published claim, verbatim, with its source URL |

Each profile page also embeds `schema.org/CollegeOrUniversity` JSON-LD carrying
the same ROR identifier as both `identifier` and `sameAs`. The point of both is
the identifier: assembling this dataset meant reconciling institution names
across publishers who disagree about them, and the endpoints exist so nobody
consuming it has to do that again.

The payloads are built by pure functions in [`src/lib/api.ts`](src/lib/api.ts)
that take the site origin as an argument, so they are tested directly rather
than over HTTP.

## Adding an institution

Add an entry to `universities` in `rankings.json` with a `name`, `country` and a
`ranks` map keyed by ranking `id`. The slug, page and league-table position are
all derived. Run `pnpm update-rankings` to validate, then `pnpm build`.

To add a citation, append to `citations` in `citations.json` with the
institution's name, the `url`, a verbatim `quote`, the date `retrieved`, and
either a `ranking` id (when the claim names an edition we hold) or a `product`
short name such as `RUR`. Where the institution is one of ours, spell its name
exactly as it appears in `rankings.json` so the quote reaches its profile page.

## Author

A Cybernetic Studio project by Ben Swift at the ANU School of Cybernetics.

## Licence

MIT
