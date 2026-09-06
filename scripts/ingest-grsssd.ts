#!/usr/bin/env -S tsx
/**
 * Ingest ShanghaiRanking's Global Ranking of Sport Science Schools and
 * Departments, which ranks units rather than whole institutions.
 *
 * The Index reports a unit's placement under its parent institution's name —
 * Deakin's "1st in the world" is its School of Exercise and Nutrition Sciences
 * — so the unit is recorded in `units` and shown only in the small print,
 * exactly as `universe` records that a national table is national.
 *
 * The unit needs no matching: ShanghaiRanking prints it in its own `sub-name`
 * element and the institution in a `/universities/<slug>` link, so both come
 * out of the markup structurally.
 *
 * Usage:
 *   pnpm ingest-grsssd 2025 grsssd-sport-2025
 *   pnpm ingest-grsssd 2025 grsssd-sport-2025 --write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { datasetSchema, slugify, type Dataset } from "../src/lib/schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolvePath(HERE, "../src/data/rankings.json");

export interface UnitRow {
  rank: number;
  /** ShanghaiRanking's slug for the parent institution, e.g. "deakin-university". */
  institutionSlug: string;
  institution: string;
  unit: string;
}

const strip = (s: string): string =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Pull rank, parent institution and ranked unit out of one GRSSSD table. */
export function parseRows(htmlText: string): UnitRow[] {
  const rows: UnitRow[] = [];
  for (const row of htmlText.split("<tr").slice(1)) {
    const rank = /<td[^>]*>\s*(?:<[^>]+>\s*)*(\d+)/.exec(row);
    const link = /href="\/universities\/([a-z0-9-]+)"[^>]*>\s*<span[^>]*>\s*([^<]+)/.exec(row);
    const sub = /class="sub-name"[\s\S]*?<span[^>]*>\s*([^<]+)/.exec(row);
    if (rank === null || link === null || sub === null) continue;
    rows.push({
      rank: Number(rank[1]),
      institutionSlug: link[1]!,
      institution: strip(link[2]!),
      unit: strip(sub[1]!),
    });
  }
  return rows;
}

/** Record each row against the institution it belongs to, keeping the unit name. */
export function applyRows(
  data: Dataset,
  rankingId: string,
  rows: UnitRow[],
): { matched: UnitRow[]; unmatched: UnitRow[] } {
  const bySlug = new Map(data.universities.map((u) => [slugify(u.name), u]));
  const matched: UnitRow[] = [];
  const unmatched: UnitRow[] = [];
  for (const row of rows) {
    const uni = bySlug.get(row.institutionSlug) ?? bySlug.get(slugify(row.institution));
    if (uni === undefined) {
      unmatched.push(row);
      continue;
    }
    uni.ranks[rankingId] = row.rank;
    uni.units = { ...uni.units, [rankingId]: row.unit };
    matched.push(row);
  }
  return { matched, unmatched };
}

async function main(argv: string[]): Promise<void> {
  const args = argv.filter((a) => !a.startsWith("--"));
  const year = args[0];
  const rankingId = args[1];
  if (year === undefined || rankingId === undefined) {
    console.error("usage: pnpm ingest-grsssd <year> <ranking-id> [--write]");
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`https://www.shanghairanking.com/rankings/grsssd/${year}`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`grsssd/${year}: HTTP ${res.status}`);
  const rows = parseRows(await res.text());

  const data = datasetSchema.parse(JSON.parse(readFileSync(DATA_PATH, "utf8")));
  const { matched, unmatched } = applyRows(data, rankingId, rows);

  console.log(`\n  grsssd/${year} → ${rankingId}: ${rows.length} ranked units\n`);
  console.log(`  ${matched.length} matched to institutions already held:`);
  for (const m of matched.toSorted((a, b) => a.rank - b.rank)) {
    console.log(`    ${String(m.rank).padStart(3)}  ${m.institution} — ${m.unit}`);
  }
  console.log(`\n  ${unmatched.length} unmatched (parent institution not in the Index)`);

  if (argv.includes("--write")) {
    writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log("\n  ✓ wrote placements and unit names\n");
  } else {
    console.log("\n  (dry run — pass --write to record)\n");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main(process.argv.slice(2));
}
