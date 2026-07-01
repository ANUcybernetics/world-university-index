# The World University Index

You're an academic filling out the 'institutional context' section of a grant
application or a stressed marketing intern pumping out 'study with us' posts
across all the socials. You need a defensible number to give for your
university's ranking which shows you in the best possible light. The _World
Univerity Index_ has got your back.

It's an authoritative-looking reference to the standing of the world's
universities --- which reports, for every institution, its single best
(lowest-numbered) placement across the major international rankings.

Universities routinely cite whichever ranking flatters them most, and because
there are so many rankings --- QS, THE, ARWU, U.S. News, CWUR --- there is
almost always one in which any given institution looks good. This site does that
selection for them, with a clean editorial design and a deadpan
[methodology](src/pages/methodology.astro) that never breaks character.

So grab the number and use it with confidence.

## Data

All ranking figures live in [`src/data/rankings.json`](src/data/rankings.json):
a list of ranking systems and a list of institutions, each with its world
position in each system. Banded results (e.g. "201--250") are recorded at the
lower bound. The schema and the best-rank selection logic are in
[`src/lib/`](src/lib).

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
