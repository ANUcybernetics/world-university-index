#!/usr/bin/env -S tsx
/**
 * Validate, integrity-check and normalise the rankings dataset.
 *
 * The major international rankings (QS, THE, ARWU, U.S. News, CWUR) do not
 * publish a single clean, openly-licensed machine-readable feed: their tables
 * are rendered client-side and their terms restrict bulk reuse. So the dataset
 * here is curated by hand from the published tables, and this script's job is to
 * keep it honest — schema-valid, internally consistent, and stably ordered —
 * rather than to scrape live.
 *
 * Usage:
 *   pnpm update-rankings            validate + report (read-only)
 *   pnpm update-rankings --write    also rewrite the file, normalised & sorted
 *   pnpm update-rankings --sources  print where each ranking is published
 *   pnpm update-rankings --links    check that every citation URL still resolves
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import {
  citationsFileSchema,
  datasetSchema,
  slugify,
  bestRank,
  type Citation,
  type Dataset,
} from "../src/lib/schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(HERE, "../src/data/rankings.json");
const CITATIONS_PATH = resolve(HERE, "../src/data/citations.json");

/** Reorder each institution's ranks to match the ranking declaration order and
 * sort institutions by name, for stable, reviewable diffs. */
export function normalise(data: Dataset): Dataset {
  const order = data.rankings.map((r) => r.id);
  const universities = [...data.universities]
    .map((u) => {
      const ranks: Record<string, number> = {};
      for (const id of order) {
        if (u.ranks[id] !== undefined) ranks[id] = u.ranks[id]!;
      }
      return { ...u, ranks };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
  return { ...data, rankings: data.rankings, universities };
}

/** Sort citations by institution, then by the table cited, for stable diffs. */
export function normaliseCitations(citations: Citation[]): Citation[] {
  return [...citations].toSorted(
    (a, b) =>
      a.university.localeCompare(b.university) || (a.ranking ?? "").localeCompare(b.ranking ?? ""),
  );
}

interface Issue {
  level: "error" | "warning";
  message: string;
}

/**
 * Citations live in their own file and point back into the dataset, so nothing
 * but a cross-file check catches a citation whose institution was renamed or
 * whose ranking id was retired.
 */
export function auditCitations(data: Dataset, citations: Citation[]): Issue[] {
  const issues: Issue[] = [];
  const names = new Set(data.universities.map((u) => u.name));
  const ids = new Set(data.rankings.map((r) => r.id));
  const seen = new Set<string>();

  for (const c of citations) {
    if (!names.has(c.university)) {
      issues.push({
        level: "error",
        message: `citation names unknown institution "${c.university}" (${c.url})`,
      });
    }
    if (c.ranking !== undefined && !ids.has(c.ranking)) {
      issues.push({
        level: "error",
        message: `citation names unknown ranking "${c.ranking}" (${c.url})`,
      });
    }
    const key = `${c.university}\u0000${c.url}\u0000${c.quote}`;
    if (seen.has(key)) {
      issues.push({ level: "warning", message: `duplicate citation: ${c.university} ${c.url}` });
    }
    seen.add(key);

    // A claim that names no table still counts as evidence for the institution,
    // but it can't vouch for an index, so flag it as work left to do.
    if (c.ranking === undefined) {
      issues.push({
        level: "warning",
        message: `citation not attributed to a table: ${c.university} (${c.url})`,
      });
    }
  }
  return issues;
}

/** Cross-reference checks beyond what the schema can express. */
export function audit(data: Dataset): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set(data.rankings.map((r) => r.id));

  const seenIds = new Set<string>();
  for (const r of data.rankings) {
    if (seenIds.has(r.id)) {
      issues.push({ level: "error", message: `duplicate ranking id: ${r.id}` });
    }
    seenIds.add(r.id);
  }

  const seenSlugs = new Map<string, string>();
  for (const u of data.universities) {
    const slug = slugify(u.name);
    const clash = seenSlugs.get(slug);
    if (clash) {
      issues.push({
        level: "error",
        message: `slug collision "${slug}": ${clash} vs ${u.name}`,
      });
    }
    seenSlugs.set(slug, u.name);

    for (const id of Object.keys(u.ranks)) {
      if (!ids.has(id)) {
        issues.push({
          level: "error",
          message: `${u.name} references unknown ranking "${id}"`,
        });
      }
    }
    if (Object.keys(u.ranks).length === 0) {
      issues.push({
        level: "warning",
        message: `${u.name} has no recorded ranks and will be hidden`,
      });
    }
  }
  return issues;
}

function reportCitations(data: Dataset, citations: Citation[]): void {
  const cited = new Map<string, number>();
  for (const c of citations) {
    if (c.ranking === undefined) continue;
    cited.set(c.ranking, (cited.get(c.ranking) ?? 0) + 1);
  }
  console.log(
    `\n  ${citations.length} published claims citing ${cited.size} of ${data.rankings.length} tables` +
      ` (${new Set(citations.map((c) => c.university)).size} institutions on the record)\n`,
  );
  const byCount = [...cited.entries()].toSorted((a, b) => b[1] - a[1]).slice(0, 8);
  for (const [id, n] of byCount) {
    const r = data.rankings.find((x) => x.id === id);
    const scope = r?.scope ? ` — ${r.scope}` : "";
    console.log(`    ${String(n).padStart(2)}x  ${r?.shortName ?? id} ${r?.edition ?? ""}${scope}`);
  }
}

function report(data: Dataset): void {
  const australian = data.universities.filter((u) => u.country === "Australia");
  console.log(
    `\n  ${data.universities.length} institutions across ${data.rankings.length} ranking systems` +
      ` (${australian.length} Australian)\n`,
  );

  for (const r of data.rankings) {
    const covered = data.universities.filter((u) => u.ranks[r.id] !== undefined).length;
    console.log(
      `    ${r.shortName.padEnd(8)} ${r.edition.padEnd(10)} ${String(covered).padStart(3)} institutions  ${r.url}`,
    );
  }

  console.log("\n  Strongest headline placements:");
  const ranked = data.universities
    .map((u) => ({ u, best: bestRank(u, data.rankings) }))
    .filter(
      (
        e,
      ): e is {
        u: (typeof data.universities)[number];
        best: NonNullable<ReturnType<typeof bestRank>>;
      } => e.best !== null,
    )
    .toSorted((a, b) => a.best.rank - b.best.rank)
    .slice(0, 5);
  for (const { u, best } of ranked) {
    console.log(
      `    #${String(best.rank).padStart(3)}  ${u.name} (${best.ranking.shortName} ${best.ranking.edition})`,
    );
  }
}

function printSources(data: Dataset): void {
  console.log("\n  Ranking sources (curated from the published tables):\n");
  for (const r of data.rankings) {
    console.log(`    ${r.name} — ${r.edition}`);
    console.log(`      ${r.publisher}`);
    console.log(`      ${r.url}\n`);
  }
}

/**
 * Citations are the one part of the dataset that rots on its own: university
 * news sites are restructured constantly, and a claim whose link 404s is a
 * claim nobody can check. Opt-in, since it hits the network.
 */
async function checkLinks(citations: Citation[]): Promise<void> {
  console.log(`\n  Checking ${citations.length} citation URLs...\n`);
  let dead = 0;
  for (const c of citations) {
    let status: string;
    try {
      // Sequential on purpose: this walks a list of university press sites, and
      // firing the whole set at once is how you get rate-limited by all of them.
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(c.url, {
        method: "GET",
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 (compatible; world-university-index link check)" },
      });
      status = String(res.status);
      // A bot-blocked page is not a dead page: the archive copy is what matters.
      if (!res.ok && res.status !== 403 && res.status !== 406) dead += 1;
    } catch {
      status = "unreachable";
      dead += 1;
    }
    const flag = status === "200" ? " " : "!";
    console.log(
      `  ${flag} ${status.padEnd(11)} ${c.university}${c.archive ? " (archived)" : ""}\n      ${c.url}`,
    );
  }
  console.log(
    dead === 0
      ? "\n  ✓ every citation URL resolves\n"
      : `\n  ! ${dead} citation URL(s) need an archive link or a replacement\n`,
  );
}

function main(argv: string[]): void {
  const rawCitations: unknown = JSON.parse(readFileSync(CITATIONS_PATH, "utf8"));
  const parsedCitations = citationsFileSchema.safeParse(rawCitations);
  if (!parsedCitations.success) {
    console.error("✗ citations failed schema validation:\n");
    console.error(parsedCitations.error.message);
    process.exitCode = 1;
    return;
  }
  const citations = parsedCitations.data.citations;

  const raw: unknown = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  const parsed = datasetSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("✗ dataset failed schema validation:\n");
    console.error(parsed.error.message);
    process.exitCode = 1;
    return;
  }
  const data = parsed.data;

  if (argv.includes("--sources")) {
    printSources(data);
    return;
  }

  if (argv.includes("--links")) {
    void checkLinks(citations);
    return;
  }

  const issues = [...audit(data), ...auditCitations(data, citations)];
  for (const i of issues) {
    console.error(`  ${i.level === "error" ? "✗" : "!"} ${i.message}`);
  }
  if (issues.some((i) => i.level === "error")) {
    console.error("\n✗ integrity check failed");
    process.exitCode = 1;
    return;
  }

  report(data);
  reportCitations(data, citations);

  if (argv.includes("--write")) {
    const normalised = normalise(data);
    writeFileSync(DATA_PATH, `${JSON.stringify(normalised, null, 2)}\n`);
    writeFileSync(
      CITATIONS_PATH,
      `${JSON.stringify({ citations: normaliseCitations(citations) }, null, 2)}\n`,
    );
    console.log("\n  ✓ wrote normalised dataset and citations");
  }

  console.log("\n  ✓ dataset valid\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2));
}
