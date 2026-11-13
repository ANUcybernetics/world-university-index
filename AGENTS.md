# World University Index

A satirical-but-rigorous Astro 7 static site (worlduniversityindex.org, GitHub
Pages) that reports each university's single best placement across the major
international rankings. README.md explains the concept and the data model.

## Commands

`package.json` has the scripts. `pnpm update-rankings` validates and
integrity-checks the dataset (CI runs it). The `ingest-*`, `ror-backfill` and
`update-rankings` scripts are documented in their file headers and in README.md.

## Rules

- Data lives in `src/data/rankings.json` and `src/data/citations.json`; the
  schema and best-rank logic are in `src/lib/schema.ts` and
  `src/lib/rankings.ts`. Run `pnpm update-rankings` after any data edit.
- Every figure is verified against the publisher's own table; record where in
  `src/data/PROVENANCE.md` and `src/data/sources.md`. Never invent or estimate a
  placement. Banded results (`201--250`) are recorded at the lower bound.
- An institution is listed only if some tracked ranking puts it in the world top
  50; don't admit anything lower. Each carries a ROR id.
- Citation quotes are verbatim, never tidied, capped at 300 characters, and
  checked against the live page.
- The tone is deadpan: every best rank reads "Nth in the world", national tables
  included. A ranking's `universe` records the truth but isn't surfaced in the
  headline.
- The JSON API payloads are pure functions in `src/lib/api.ts` taking the site
  origin as an argument; test them directly, not over HTTP.
- `compressHTML: true` in `astro.config.ts` is deliberate: Astro 7's default
  drops the space between prose and inline links.
- Scoped `<style>` blocks in `.astro` files aren't covered by stylelint (see
  `stylelint.config.mjs`); formatting is oxfmt's.
