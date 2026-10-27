#!/usr/bin/env -S tsx
/**
 * Ingest one ranking table, from any publisher, into the dataset.
 *
 * Fetching is host-specific (see `sources.md`) and happens elsewhere; this
 * script takes the result as a normalised table file —
 *
 *   { "meta": <RankingMeta>, "rows": [{ "rank": 1, "name": "...", "country": "..." }] }
 *
 * — with every ranked row in publisher order, bands at their lower bound.
 *
 * What it does, in order:
 *   1. adds the table's metadata entry if the dataset doesn't have it yet
 *   2. matches each row to an institution already held: by name against our
 *      name and every name ROR records for the institution (labels, aliases),
 *      and, for rows inside the admission bar, by resolving the publisher's
 *      name through ROR and matching on the identifier
 *   3. admits each unmatched row inside the admission bar (default: top 50,
 *      the membership rule in `sources.md`) as a new institution, taking its
 *      name, city and ROR id from ROR — but only when ROR chose the match (or
 *      names it exactly), its country agrees with the publisher's, so a row is
 *      never attached to a namesake on another continent, and it is a
 *      university or medical school rather than an institute that shares the
 *      name
 *   4. reports the rows inside the bar it could neither match nor admit, for
 *      a human to resolve
 *
 * Publisher names ROR can't resolve are mapped by hand in
 * `ror-overrides.json` (publisher name → ROR id); the id is still resolved
 * and country-checked before it's trusted.
 *
 * ROR lookups are cached in `.cache/ror.json`, since the same institutions
 * recur across every table and ROR is a small public service.
 *
 * Usage:
 *   pnpm ingest-table <table.json>...            dry run
 *   pnpm ingest-table <table.json>... --write    record placements and admissions
 *   pnpm ingest-table <table.json>... --admit 0  match only, admit nobody
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { z } from "zod";
import { datasetSchema, rankingMetaSchema, type Dataset, type University } from "../src/lib/schema";
import { normaliseName } from "./ingest-the";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolvePath(HERE, "../src/data/rankings.json");
const CACHE_PATH = resolvePath(HERE, "../.cache/ror.json");
const OVERRIDES_PATH = resolvePath(HERE, "ror-overrides.json");
const ENDPOINT = "https://api.ror.org/v2/organizations";
const UA = { "user-agent": "world-university-index (https://github.com/ANUcybernetics)" };

export const tableFileSchema = z.object({
  meta: rankingMetaSchema,
  rows: z.array(
    z.object({
      rank: z.number().int().positive(),
      name: z.string().min(1),
      country: z.string(),
    }),
  ),
});
export type TableFile = z.infer<typeof tableFileSchema>;
export type Row = TableFile["rows"][number];

/** An organisation as ROR describes it, trimmed to what matching needs. */
export interface RorOrg {
  id: string;
  name: string;
  names: string[];
  countryCode: string;
  city?: string;
  /** ROR organisation types, e.g. "education", "facility". */
  types: string[];
}

/** A ROR affiliation lookup: the best candidate and whether ROR chose it. */
export interface RorHit {
  org: RorOrg;
  chosen: boolean;
}

export interface Ror {
  affiliation(name: string): Promise<RorHit | null>;
  record(id: string): Promise<RorOrg | null>;
}

/** Display names where ours differ from the CLDR English name. */
const COUNTRY_NAME_OVERRIDES: Record<string, string> = {
  HK: "Hong Kong",
  MO: "Macau",
  TR: "Turkey",
  PS: "Palestine",
  CZ: "Czechia",
};

/** How publishers spell countries that CLDR spells differently. */
const COUNTRY_SYNONYMS: Record<string, string> = {
  "china mainland": "CN",
  "mainland china": "CN",
  "hong kong sar": "HK",
  "hong kong sar china": "HK",
  "macao sar": "MO",
  "macao sar china": "MO",
  macao: "MO",
  "chinese taipei": "TW",
  korea: "KR",
  "republic of korea": "KR",
  "korea republic of": "KR",
  "korea south": "KR",
  turkey: "TR",
  "united states of america": "US",
  usa: "US",
  us: "US",
  uk: "GB",
  "russian federation": "RU",
  iran: "IR",
  "iran islamic republic of": "IR",
  "viet nam": "VN",
  "czech republic": "CZ",
  palestine: "PS",
  "state of palestine": "PS",
  "palestinian territory": "PS",
  "the netherlands": "NL",
  "brunei darussalam": "BN",
  "syrian arab republic": "SY",
  "lao pdr": "LA",
  "cote d ivoire": "CI",
  "ivory coast": "CI",
  "north macedonia": "MK",
  "bosnia herzegovina": "BA",
  "trinidad tobago": "TT",
  "northern cyprus": "CY",
  "kingdom of saudi arabia": "SA",
  ksa: "SA",
  uae: "AE",
  "china hong kong": "HK",
  "china taiwan": "TW",
  "china macau": "MO",
  "china macao": "MO",
};

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

const countryKey = (name: string): string =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z]+/g, " ")
    .trim();

/** Retired codes CLDR still names after a current country ("DD" is "Germany"). */
const RETIRED_CODES = new Set([
  "AN",
  "BU",
  "CS",
  "DD",
  "FX",
  "NT",
  "SU",
  "TP",
  "UK",
  "YD",
  "YU",
  "ZR",
]);

const CODES_BY_NAME: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      const name = displayNames.of(code);
      if (RETIRED_CODES.has(code) || name === undefined || name === code) continue;
      map.set(countryKey(name), code);
    }
  }
  for (const [code, name] of Object.entries(COUNTRY_NAME_OVERRIDES))
    map.set(countryKey(name), code);
  for (const [name, code] of Object.entries(COUNTRY_SYNONYMS)) map.set(countryKey(name), code);
  return map;
})();

/** ISO 3166 alpha-2 code for a country name as a publisher prints it, if known. */
export function countryCode(name: string): string | undefined {
  return CODES_BY_NAME.get(countryKey(name));
}

/**
 * Whether a publisher's country code admits an institution's. Some tables
 * list Hong Kong and Macau universities under "China".
 */
export function sameCountry(publisher: string, institution: string): boolean {
  return (
    publisher === institution ||
    (publisher === "CN" && (institution === "HK" || institution === "MO"))
  );
}

/** The country name the dataset uses for an ISO code. */
export function countryName(code: string): string {
  return COUNTRY_NAME_OVERRIDES[code] ?? displayNames.of(code) ?? code;
}

function orgFromRor(org: {
  id: string;
  types?: string[];
  names: { value: string; types?: string[] }[];
  locations?: { geonames_details?: { country_code?: string; name?: string } }[];
}): RorOrg {
  const geo = org.locations?.[0]?.geonames_details;
  return {
    id: org.id,
    name:
      org.names.find((n) => n.types?.includes("ror_display"))?.value ?? org.names[0]?.value ?? "",
    // Acronyms are left out on purpose: "UPM" names universities in Spain and
    // Malaysia and "UCL" one in London and one in Louvain, and a name match is
    // trusted on a country check alone.
    names: org.names.filter((n) => !n.types?.includes("acronym")).map((n) => n.value),
    countryCode: geo?.country_code ?? "",
    city: geo?.name,
    types: org.types ?? [],
  };
}

/** GET a ROR endpoint, waiting out its rate limit; null for an unknown id. */
async function get(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    // eslint-disable-next-line no-await-in-loop
    const res = await fetch(url, { headers: UA });
    if (res.status === 429 && attempt < 5) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 30_000));
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`ROR ${url}: HTTP ${res.status}`);
    return res.json();
  }
}

/** The live ROR API, with an on-disk cache shared across runs. */
export function liveRor(cachePath = CACHE_PATH): Ror & { save(): void } {
  const cache: Record<string, unknown> = existsSync(cachePath)
    ? (JSON.parse(readFileSync(cachePath, "utf8")) as Record<string, unknown>)
    : {};
  async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (key in cache) return cache[key] as T;
    const value = await load();
    cache[key] = value;
    return value;
  }
  return {
    affiliation: (name) =>
      cached(`affiliation:${name}`, async () => {
        const body = (await get(`${ENDPOINT}?affiliation=${encodeURIComponent(name)}`)) as {
          items?: { chosen?: boolean; organization: Parameters<typeof orgFromRor>[0] }[];
        } | null;
        const top = body?.items?.[0];
        return top === undefined
          ? null
          : { org: orgFromRor(top.organization), chosen: top.chosen === true };
      }),
    record: (id) =>
      cached(`record:${id}`, async () => {
        const body = (await get(id.replace("https://ror.org/", `${ENDPOINT}/`))) as
          | Parameters<typeof orgFromRor>[0]
          | null;
        return body === null ? null : orgFromRor(body);
      }),
    save() {
      mkdirSync(dirname(cachePath), { recursive: true });
      writeFileSync(cachePath, `${JSON.stringify(cache)}\n`);
    },
  };
}

/**
 * ROR types an admitted institution may carry. "healthcare" lets in the
 * academic medical centres that rank as universities (MD Anderson, Mayo
 * Clinic) while keeping out the institutes and facilities ROR sometimes offers
 * for a university's name.
 */
const ADMISSIBLE_TYPES = new Set(["education", "healthcare"]);

export interface IngestResult {
  matched: { name: string; rank: number; via: "name" | "ror" }[];
  admitted: { name: string; rank: number; country: string; as: string }[];
  unresolved: { row: Row; reason: string }[];
}

/**
 * Why a ROR hit can't be trusted for a row, or null when it can. The country
 * must agree, and ROR must have chosen the match or named it exactly.
 */
function rejection(row: Row, expected: string | undefined, hit: RorHit): string | null {
  if (expected === undefined) return `unknown country "${row.country}"`;
  if (!sameCountry(expected, hit.org.countryCode)) {
    return `ROR suggests "${hit.org.name}" in ${hit.org.countryCode}, publisher says ${expected}`;
  }
  if (!hit.chosen && normaliseName(hit.org.name) !== normaliseName(row.name)) {
    return `ROR unsure; best "${hit.org.name}" (${hit.org.id})`;
  }
  return null;
}

/**
 * Apply one table to the dataset in place. `admit` is the admission bar: rows
 * ranked at or above it that match nobody we hold are admitted as new
 * institutions when ROR can vouch for them. `overrides` maps a publisher's
 * name for an institution to its ROR id, for the names ROR's matching can't
 * settle; each is still resolved and country-checked like any other hit.
 */
export async function ingestTable(
  data: Dataset,
  table: TableFile,
  ror: Ror,
  admit: number,
  overrides: Record<string, string> = {},
): Promise<IngestResult> {
  const id = table.meta.id;
  if (!data.rankings.some((r) => r.id === id)) data.rankings.push(table.meta);

  const byName = new Map<string, University>();
  const byRor = new Map<string, University>();
  const index = (uni: University, names: string[]): void => {
    for (const n of names) {
      const key = normaliseName(n);
      // A name two institutions share identifies neither.
      if (byName.has(key) && byName.get(key) !== uni) byName.delete(key);
      else byName.set(key, uni);
    }
    if (uni.ror !== undefined) byRor.set(uni.ror, uni);
  };
  for (const uni of data.universities) {
    // eslint-disable-next-line no-await-in-loop
    const record = uni.ror === undefined ? null : await ror.record(uni.ror);
    index(uni, [uni.name, ...(record?.names ?? [])]);
  }

  const result: IngestResult = { matched: [], admitted: [], unresolved: [] };
  const placed = new Map<University, number>();
  const place = (uni: University, row: Row): boolean => {
    const prior = placed.get(uni);
    if (prior !== undefined) {
      // Two rows resolving to one institution: keep the better and say so.
      result.unresolved.push({
        row,
        reason: `second row for ${uni.name} (already placed ${prior})`,
      });
      if (prior <= row.rank) return false;
    }
    placed.set(uni, row.rank);
    uni.ranks[id] = row.rank;
    return true;
  };

  for (const row of table.rows) {
    const expected = countryCode(row.country);
    let uni = byName.get(normaliseName(row.name));
    // Names recur across countries: "University of Newcastle" is in Australia,
    // "Newcastle University" in England, and ROR lists each as the other's alias.
    const held = uni === undefined ? undefined : countryCode(uni.country);
    if (expected !== undefined && held !== undefined && !sameCountry(expected, held)) {
      uni = undefined;
    }
    if (uni !== undefined) {
      if (place(uni, row)) result.matched.push({ name: uni.name, rank: row.rank, via: "name" });
      continue;
    }
    if (row.rank > admit) continue;

    // Candidates in order of trust: a hand-checked override, then ROR's own
    // matching with the country in the query (ROR uses it to pick between
    // namesakes: "University of Georgia" is also a university in Tbilisi),
    // then without it (which ROR sometimes handles better).
    const queries = [
      ...(expected === undefined ? [] : [`${row.name}, ${countryName(expected)}`]),
      row.name,
    ];
    const override = overrides[row.name];
    let accepted: RorOrg | undefined;
    let reason = "no ROR hit";
    for (const candidate of [override, ...queries]) {
      if (candidate === undefined) continue;
      const hit =
        candidate === override
          ? // eslint-disable-next-line no-await-in-loop
            await ror.record(candidate).then((org) => (org === null ? null : { org, chosen: true }))
          : // eslint-disable-next-line no-await-in-loop
            await ror.affiliation(candidate);
      if (hit === null) continue;
      const why = rejection(row, expected, hit);
      if (why === null) {
        accepted = hit.org;
        break;
      }
      reason = why;
    }
    if (accepted === undefined) {
      result.unresolved.push({ row, reason });
      continue;
    }

    uni = byRor.get(accepted.id);
    if (uni !== undefined) {
      if (place(uni, row)) result.matched.push({ name: uni.name, rank: row.rank, via: "ror" });
    } else if (!accepted.types.some((t) => ADMISSIBLE_TYPES.has(t))) {
      result.unresolved.push({
        row,
        reason: `ROR suggests "${accepted.name}", which is neither a university nor a medical school`,
      });
    } else {
      const fresh: University = {
        name: accepted.name,
        country: countryName(accepted.countryCode),
        ...(accepted.city === undefined ? {} : { city: accepted.city }),
        ror: accepted.id,
        ranks: {},
      };
      data.universities.push(fresh);
      index(fresh, [fresh.name, row.name, ...accepted.names]);
      place(fresh, row);
      result.admitted.push({
        name: fresh.name,
        rank: row.rank,
        country: fresh.country,
        as: row.name,
      });
    }
  }
  return result;
}

async function main(argv: string[]): Promise<void> {
  const files = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--admit");
  if (files.length === 0) {
    console.error("usage: pnpm ingest-table <table.json>... [--admit N] [--write]");
    process.exitCode = 1;
    return;
  }
  const admitIndex = argv.indexOf("--admit");
  const admit = admitIndex === -1 ? 50 : Number(argv[admitIndex + 1]);

  const data = datasetSchema.parse(JSON.parse(readFileSync(DATA_PATH, "utf8")));
  const ror = liveRor();
  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) as Record<string, string>;
  try {
    for (const file of files) {
      const table = tableFileSchema.parse(JSON.parse(readFileSync(file, "utf8")));
      // Tables in one run build on each other: an institution admitted from
      // the first is matched, not re-admitted, by the second.
      // eslint-disable-next-line no-await-in-loop
      const { matched, admitted, unresolved } = await ingestTable(
        data,
        table,
        ror,
        admit,
        overrides,
      );
      console.log(
        `\n  ${table.meta.id}: ${table.rows.length} rows — ${matched.length} matched, ` +
          `${admitted.length} admitted, ${unresolved.length} unresolved`,
      );
      for (const a of admitted)
        console.log(
          `    + ${String(a.rank).padStart(3)}  ${a.name} (${a.country})` +
            (a.as === a.name ? "" : `  ← "${a.as}"`),
        );
      for (const u of unresolved) {
        console.log(
          `    ? ${String(u.row.rank).padStart(3)}  ${u.row.name} (${u.row.country}) — ${u.reason}`,
        );
      }
    }
  } finally {
    ror.save();
  }

  if (argv.includes("--write")) {
    writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log("\n  ✓ wrote dataset (run update-rankings --write to normalise)\n");
  } else {
    console.log("\n  (dry run — pass --write to record)\n");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main(process.argv.slice(2));
}
