import rawData from "../data/rankings.json";
import {
  bestRank as bestRankOf,
  datasetSchema,
  isOverall,
  rankProfile as rankProfileOf,
  slugify,
  type BestRank,
  type Dataset,
  type RankingMeta,
  type University,
} from "./schema";

export * from "./schema";

/** Parsed once at module load — fail fast on malformed data. */
export const dataset: Dataset = datasetSchema.parse(rawData);

const rankingsById = new Map(dataset.rankings.map((r) => [r.id, r]));
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
