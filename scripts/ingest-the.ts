#!/usr/bin/env -S tsx
/**
 * Ingest one Times Higher Education table into the dataset.
 *
 * THE ships every ranking table as a JSON payload under
 * `/json/ranking_tables/<table>/<year>` (see `sources.md`), which makes it the
 * cheapest source to expand from: one request yields a whole table rather than
 * one institution at a time. The table path is printed in the page source of
 * the corresponding `/rankings/...` page.
 *
 * What it does, in order:
 *   1. fetches the table and takes the top N rows (default 50, the inclusion bar)
 *   2. matches each row to an institution we already hold, first by name and
 *      then, for the rest, by resolving the publisher's name through ROR and
 *      matching on the identifier — THE calls UNSW "UNSW Sydney" and we call it
 *      "University of New South Wales", which no amount of string normalising
 *      will reconcile
 *   3. reports rows it could not match — those are candidate new institutions,
 *      to be researched and ROR-resolved before they are added
 *
 * It never invents an institution. Adding one is a separate, deliberate step,
 * because a row matched to the wrong institution is worse than a missing row
 * and only a human or an agent looking at the publisher's own table can tell
 * the difference.
 *
 * Usage:
 *   pnpm ingest-the sdg1_rankings/2025 the-impact-sdg1-2025
 *   pnpm ingest-the sdg1_rankings/2025 the-impact-sdg1-2025 --write
 *   pnpm ingest-the sdg1_rankings/2025 the-impact-sdg1-2025 --top 100
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { datasetSchema, type Dataset } from "../src/lib/schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolvePath(HERE, "../src/data/rankings.json");
const BASE = "https://www.timeshighereducation.com/json/ranking_tables";

/** Compare institution names ignoring case, accents, punctuation and a leading "The". */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^the\s+/, "")
    .replace(/\buniversiti\b/, "university")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The lower bound of a THE rank, which may be banded ("101–200") or tied
 * ("=41"). Banded results are recorded at the lower bound throughout the
 * dataset, consistent with reporting each institution's strongest defensible
 * position. Returns null for "Reporter" and other unranked rows.
 */
export function lowerBound(rank: string): number | null {
  const match = /(\d+)/.exec(rank.replace(/[=]/g, ""));
  return match === null ? null : Number(match[1]);
}

interface Row {
  rank: number;
  name: string;
  location: string;
}

async function fetchTable(table: string): Promise<Row[]> {
  const res = await fetch(`${BASE}/${table}`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  const body = (await res.json()) as {
    data?: { rank?: string; name: string; location?: string }[];
  };
  const rows: Row[] = [];
  for (const r of body.data ?? []) {
    const rank = lowerBound(r.rank ?? "");
    if (rank === null) continue;
    rows.push({ rank, name: r.name, location: r.location ?? "" });
  }
  return rows;
}

/** Ask ROR which institution a publisher's row actually refers to. */
async function rorFor(name: string): Promise<string | null> {
  const res = await fetch(
    `https://api.ror.org/v2/organizations?affiliation=${encodeURIComponent(name)}`,
    { headers: { "user-agent": "world-university-index (https://github.com/ANUcybernetics)" } },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as { items?: { chosen?: boolean; organization: { id: string } }[] };
  const chosen = body.items?.find((i) => i.chosen === true);
  return chosen?.organization.id ?? null;
}

export async function applyRows(
  data: Dataset,
  rankingId: string,
  rows: Row[],
): Promise<{ matched: { name: string; rank: number; via: string }[]; unmatched: Row[] }> {
  const byName = new Map(data.universities.map((u) => [normaliseName(u.name), u]));
  const byRor = new Map(
    data.universities.filter((u) => u.ror !== undefined).map((u) => [u.ror!, u]),
  );
  const matched: { name: string; rank: number; via: string }[] = [];
  const unmatched: Row[] = [];
  for (const row of rows) {
    let uni = byName.get(normaliseName(row.name));
    let via = "name";
    if (uni === undefined) {
      // eslint-disable-next-line no-await-in-loop
      const ror = await rorFor(row.name);
      if (ror !== null) {
        uni = byRor.get(ror);
        via = "ror";
      }
    }
    if (uni === undefined) {
      unmatched.push(row);
      continue;
    }
    uni.ranks[rankingId] = row.rank;
    matched.push({ name: uni.name, rank: row.rank, via });
  }
  return { matched, unmatched };
}

async function main(argv: string[]): Promise<void> {
  const args = argv.filter((a) => !a.startsWith("--"));
  const table = args[0];
  const rankingId = args[1];
  if (table === undefined || rankingId === undefined) {
    console.error("usage: pnpm ingest-the <table/year> <ranking-id> [--top N] [--write]");
    process.exitCode = 1;
    return;
  }
  const topIndex = argv.indexOf("--top");
  const top = topIndex === -1 ? 50 : Number(argv[topIndex + 1] ?? 50);

  const data = datasetSchema.parse(JSON.parse(readFileSync(DATA_PATH, "utf8")));
  if (!data.rankings.some((r) => r.id === rankingId)) {
    console.error(
      `\n  ✗ no ranking "${rankingId}" in the dataset — add its metadata entry first\n`,
    );
    process.exitCode = 1;
    return;
  }

  const rows = (await fetchTable(table)).filter((r) => r.rank <= top);
  const { matched, unmatched } = await applyRows(data, rankingId, rows);

  console.log(`\n  ${table} → ${rankingId}: ${rows.length} rows in the top ${top}\n`);
  console.log(`  ${matched.length} matched to institutions already held:`);
  for (const m of matched.toSorted((a, b) => a.rank - b.rank)) {
    console.log(`    ${String(m.rank).padStart(3)}  ${m.name}${m.via === "ror" ? "  (matched via ROR)" : ""}`);
  }
  console.log(`\n  ${unmatched.length} unmatched — candidates for admission:`);
  for (const u of unmatched) {
    console.log(`    ${String(u.rank).padStart(3)}  ${u.name}  (${u.location})`);
  }

  if (argv.includes("--write")) {
    writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log("\n  ✓ wrote matched placements (run update-rankings --write to normalise)\n");
  } else {
    console.log("\n  (dry run — pass --write to record the matched placements)\n");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main(process.argv.slice(2));
}
