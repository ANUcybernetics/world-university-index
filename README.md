# The World University Index

An authoritative-looking reference to the standing of the world's universities
--- which reports, for every institution, its single best (lowest-numbered)
placement across the major international rankings.

That is the whole joke, played entirely straight. Universities routinely cite
whichever ranking flatters them most, and because there are so many rankings ---
QS, THE, ARWU, U.S. News, CWUR --- there is almost always one in which any given
institution looks good. This site does that selection for them, with a clean
editorial design and a deadpan [methodology](src/pages/methodology.astro) that
never breaks character.

The University of Canberra is "ranked #401 in the world". Harvard, Oxford and
MIT are all "#1". Every claim links to its real source.

## Stack

- [Astro 7](https://astro.build) static site (Vite 8, Lightning CSS), TypeScript
  in strict mode
- pnpm via [mise](https://mise.jdx.dev) (node 24)
- Vitest for the data/logic layer; oxlint + oxfmt + Stylelint for quality
- Deployed to GitHub Pages via `jdx/mise-action`

## Develop

```sh
mise install          # node 24 + pnpm
pnpm install
pnpm dev              # http://localhost:4321/university-rankings
```

Checks (all run in CI):

```sh
pnpm typecheck        # astro check
pnpm test             # vitest
pnpm lint             # oxlint
pnpm lint:css         # stylelint
pnpm build            # static build to dist/
```

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
