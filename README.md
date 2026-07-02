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
a single country, and the site reports each institution's single best world
position across all of them, whatever the scope or year. National tables show on
an institution's page but never as its headline figure, so a home-market rank
can't pose as a world one. Banded results (e.g. "201--250") are recorded at the
lower bound. The schema and best-rank logic are in [`src/lib/`](src/lib); where
each figure comes from and how to refresh it are in
[`PROVENANCE.md`](src/data/PROVENANCE.md) and
[`sources.md`](src/data/sources.md).

```sh
pnpm update-rankings            # validate + integrity-check + report
pnpm update-rankings --write    # also rewrite the file, normalised and sorted
pnpm update-rankings --sources  # where each ranking is published
```

The major rankings don't publish a clean, openly-licensed machine-readable feed
--- their tables render client-side and their terms restrict bulk reuse --- so
the dataset is curated by hand from the published tables, and
[`scripts/update-rankings.ts`](scripts/update-rankings.ts) keeps it honest
rather than scraping live.

## Adding an institution

Add an entry to `universities` in `rankings.json` with a `name`, `country` and a
`ranks` map keyed by ranking `id`. The slug, page and league-table position are
all derived. Run `pnpm update-rankings` to validate, then `pnpm build`.

## Author

A Cybernetic Studio project by Ben Swift at the ANU School of Cybernetics.

## Licence

MIT
