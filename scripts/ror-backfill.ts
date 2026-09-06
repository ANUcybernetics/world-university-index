#!/usr/bin/env -S tsx
/**
 * Attach a ROR identifier to every institution that doesn't have one.
 *
 * Institution names differ between publishers, and naive string matching fails
 * in both directions: it misses "UNSW Sydney" against "University of New South
 * Wales", and it happily matches "Northwestern University" to "Lyceum-
 * Northwestern University". ROR (CC0, ~27k education organisations) is the
 * registry that settles which institution a table row actually refers to, so
 * every institution here carries its ROR id and new tables are joined on that
 * rather than on a name.
 *
 * A match is accepted when the country agrees and either ROR chose it or the
 * display name is ours exactly. Everything else is printed for review rather
 * than guessed at — a wrong ROR id is worse than none, because later expansion
 * joins on it silently.
 *
 * Ids resolved by hand (or by an agent) are pasted in and then re-checked with
 * `--check`, which resolves each stored id against ROR and confirms the country
 * still agrees. Proposing an id and trusting an id are separate steps on
 * purpose: the proposal can come from anywhere, the trust comes from ROR.
 *
 * Usage:
 *   pnpm ror-backfill          report what would be attached (read-only)
 *   pnpm ror-backfill --write  attach the confident matches
 *   pnpm ror-backfill --check  re-resolve every stored id and verify it
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { datasetSchema, type University } from "../src/lib/schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(HERE, "../src/data/rankings.json");
const ENDPOINT = "https://api.ror.org/v2/organizations";

/** ROR's country names differ from ours in a handful of places. */
const COUNTRY_ALIASES: Record<string, string> = {
  Netherlands: "The Netherlands",
  Czechia: "Czech Republic",
  Macau: "Macao",
};

/** Compare institution names ignoring case, accents, punctuation and a leading "The". */
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface RorMatch {
  id: string;
  name: string;
  country: string;
  chosen: boolean;
  score: number;
}

async function lookup(name: string): Promise<RorMatch | null> {
  const url = `${ENDPOINT}?affiliation=${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    headers: { "user-agent": "world-university-index (https://github.com/ANUcybernetics)" },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    items?: {
      chosen?: boolean;
      score?: number;
      organization: {
        id: string;
        names: { value: string; types?: string[] }[];
        locations?: { geonames_details?: { country_name?: string } }[];
      };
    }[];
  };
  const top = body.items?.[0];
  if (top === undefined) return null;
  const org = top.organization;
  const display = org.names.find((n) => n.types?.includes("ror_display"))?.value;
  return {
    id: org.id,
    name: display ?? org.names[0]?.value ?? "",
    country: org.locations?.[0]?.geonames_details?.country_name ?? "",
    chosen: top.chosen === true,
    score: top.score ?? 0,
  };
}

/**
 * Whether a ROR hit is trustworthy enough to attach without a human looking.
 * The country must always agree. Beyond that, either ROR chose the match
 * itself, or the display name is ours exactly — ROR declines to choose when
 * several records score alike, which happens for names as unambiguous as "New
 * York University", and an exact name plus an exact country is not a guess.
 */
export function isConfident(uni: University, match: RorMatch): boolean {
  const expected = COUNTRY_ALIASES[uni.country] ?? uni.country;
  if (match.country !== expected) return false;
  return match.chosen || normaliseName(match.name) === normaliseName(uni.name);
}

/** Resolve one stored id and confirm it still names an institution in our country. */
async function resolveId(id: string): Promise<RorMatch | null> {
  const res = await fetch(id.replace("https://ror.org/", `${ENDPOINT}/`), {
    headers: { "user-agent": "world-university-index (https://github.com/ANUcybernetics)" },
  });
  if (!res.ok) return null;
  const org = (await res.json()) as {
    id: string;
    names: { value: string; types?: string[] }[];
    locations?: { geonames_details?: { country_name?: string } }[];
  };
  return {
    id: org.id,
    name: org.names.find((n) => n.types?.includes("ror_display"))?.value ?? "",
    country: org.locations?.[0]?.geonames_details?.country_name ?? "",
    chosen: true,
    score: 1,
  };
}

async function check(data: ReturnType<typeof datasetSchema.parse>): Promise<void> {
  const withId = data.universities.filter((u) => u.ror !== undefined);
  console.log(`\n  Re-resolving ${withId.length} stored ROR ids\n`);
  let bad = 0;
  for (const uni of withId) {
    // eslint-disable-next-line no-await-in-loop
    const match = await resolveId(uni.ror!);
    const expected = COUNTRY_ALIASES[uni.country] ?? uni.country;
    if (match === null) {
      console.log(`    ✗ ${uni.name} — ${uni.ror} does not resolve`);
      bad += 1;
    } else if (match.country !== expected) {
      console.log(
        `    ✗ ${uni.name} (${uni.country}) — ${uni.ror} is "${match.name}" in ${match.country}`,
      );
      bad += 1;
    }
  }
  console.log(bad === 0 ? "\n  ✓ every stored id resolves to the right country\n" : `\n  ✗ ${bad} bad\n`);
  if (bad > 0) process.exitCode = 1;
}

async function main(argv: string[]): Promise<void> {
  const write = argv.includes("--write");
  const data = datasetSchema.parse(JSON.parse(readFileSync(DATA_PATH, "utf8")));

  if (argv.includes("--check")) {
    await check(data);
    return;
  }

  const pending = data.universities.filter((u) => u.ror === undefined);
  console.log(`\n  ${pending.length} institutions without a ROR id\n`);

  let attached = 0;
  const unresolved: string[] = [];
  for (const uni of pending) {
    // Sequential on purpose: ROR is a small public service and this is a
    // one-off backfill, not a hot path.
    // eslint-disable-next-line no-await-in-loop
    const match = await lookup(uni.name);
    if (match !== null && isConfident(uni, match)) {
      uni.ror = match.id;
      attached += 1;
      if (match.name !== uni.name) {
        console.log(`    ~ ${uni.name}\n        ${match.id}  "${match.name}"`);
      }
    } else {
      unresolved.push(uni.name);
      console.log(
        `    ? ${uni.name} (${uni.country})` +
          (match === null
            ? " — no ROR hit"
            : ` — best: "${match.name}" (${match.country}) score ${match.score}`),
      );
    }
  }

  console.log(`\n  ${attached} attached, ${unresolved.length} left for review`);
  if (write) {
    writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
    console.log("  ✓ wrote dataset\n");
  } else {
    console.log("  (dry run — pass --write to attach)\n");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main(process.argv.slice(2));
}
