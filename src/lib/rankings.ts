import rawCitations from "../data/citations.json";
import rawData from "../data/rankings.json";
import {
  bestRank as bestRankOf,
  citationsFileSchema,
  datasetSchema,
  isOverall,
  rankProfile as rankProfileOf,
  slugify,
  type BestRank,
  type Citation,
  type Dataset,
  type RankingMeta,
  type University,
} from "./schema";

export * from "./schema";

/** Parsed once at module load — fail fast on malformed data. */
export const dataset: Dataset = datasetSchema.parse(rawData);

/**
 * Published claims in which an institution cites a ranking. Kept in its own
 * file: it refreshes on a different cadence to the figures, and grows by
 * research rather than by the annual publication cycle.
 */
export const citations: readonly Citation[] = citationsFileSchema.parse(rawCitations).citations;

const rankingsById = new Map(dataset.rankings.map((r) => [r.id, r]));
// The headline is the single most flattering placement across every table,
// national league tables included — all reported deadpan as "Nth in the world"
// (a ranking's `universe` records the truth but isn't surfaced). "Overall"
// narrows to whole-of-institution rankings, national tables among them.
const overallRankings = dataset.rankings.filter(isOverall);

/** An institution's strongest placement across the loaded dataset. */
export function bestRank(uni: University): BestRank | null {
  return bestRankOf(uni, dataset.rankings);
}

/** An institution's strongest placement among the overall rankings only. */
export function bestOverallRank(uni: University): BestRank | null {
  return bestRankOf(uni, overallRankings);
}

/** An institution's full placement profile across the loaded dataset. */
export function rankProfile(uni: University): BestRank[] {
  return rankProfileOf(uni, dataset.rankings);
}

export function rankingById(id: string): RankingMeta | undefined {
  return rankingsById.get(id);
}

const universityNames = new Set(dataset.universities.map((u) => u.name));

// Citations point across files, which no single schema can check. Fail at load
// rather than rendering a page that quietly drops a quote.
for (const c of citations) {
  if (!universityNames.has(c.university)) {
    throw new Error(`citation cites unknown institution "${c.university}" (${c.url})`);
  }
  if (c.ranking !== undefined && !rankingsById.has(c.ranking)) {
    throw new Error(`citation cites unknown ranking "${c.ranking}" (${c.url})`);
  }
}

const citationsByRanking = new Map<string, Citation[]>();
const citationsByUniversity = new Map<string, Citation[]>();
for (const c of citations) {
  if (c.ranking !== undefined) {
    const list = citationsByRanking.get(c.ranking) ?? [];
    list.push(c);
    citationsByRanking.set(c.ranking, list);
  }
  const byUni = citationsByUniversity.get(c.university) ?? [];
  byUni.push(c);
  citationsByUniversity.set(c.university, byUni);
}

/** Published claims citing a particular ranking table. */
export function citationsOf(rankingId: string): readonly Citation[] {
  return citationsByRanking.get(rankingId) ?? [];
}

/** Published claims in which an institution cites any ranking. */
export function citationsBy(uni: University): readonly Citation[] {
  return citationsByUniversity.get(uni.name) ?? [];
}

/**
 * Whether any institution has been recorded citing this ranking — the test of
 * whether a table has entered the world, as distinct from merely existing.
 */
export function isCited(rankingId: string): boolean {
  return citationsByRanking.has(rankingId);
}

/** Institutions that have cited a ranking, deduplicated, in dataset order. */
export function citingInstitutions(rankingId: string): University[] {
  const names = new Set(citationsOf(rankingId).map((c) => c.university));
  return dataset.universities.filter((u) => names.has(u.name));
}

export interface UniversityEntry {
  university: University;
  slug: string;
  best: BestRank;
  /** Strongest overall placement, or null if it appears only in narrower rankings. */
  bestOverall: BestRank | null;
}

/**
 * All institutions that have at least one verified placement, each paired with
 * its slug and best rank, ordered by best rank ascending (most impressive
 * claim first). Ties are broken alphabetically only to keep the build stable and
 * the no-JS view sensible; the index page reshuffles each tied group on load so
 * genuinely tied institutions aren't presented in a fixed order.
 */
export function rankedUniversities(): UniversityEntry[] {
  return dataset.universities
    .map((university) => ({
      university,
      slug: slugify(university.name),
      best: bestRank(university),
      bestOverall: bestOverallRank(university),
    }))
    .filter((e): e is UniversityEntry => e.best !== null)
    .toSorted(
      (a, b) => a.best.rank - b.best.rank || a.university.name.localeCompare(b.university.name),
    );
}

export function universityBySlug(slug: string): University | undefined {
  return dataset.universities.find((u) => slugify(u.name) === slug);
}
