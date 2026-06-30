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
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { datasetSchema, slugify, bestRank, type Dataset } from "../src/lib/schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(HERE, "../src/data/rankings.json");

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

interface Issue {
  level: "error" | "warning";
  message: string;
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

function main(argv: string[]): void {
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

  const issues = audit(data);
  for (const i of issues) {
    console.error(`  ${i.level === "error" ? "✗" : "!"} ${i.message}`);
  }
  if (issues.some((i) => i.level === "error")) {
    console.error("\n✗ integrity check failed");
    process.exitCode = 1;
    return;
  }

  report(data);

  if (argv.includes("--write")) {
    const normalised = normalise(data);
    writeFileSync(DATA_PATH, `${JSON.stringify(normalised, null, 2)}\n`);
    console.log("\n  ✓ wrote normalised dataset");
  }

  console.log("\n  ✓ dataset valid\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2));
}
