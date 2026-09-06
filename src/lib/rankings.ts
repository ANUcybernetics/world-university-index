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
const productNames = new Set(dataset.rankings.map((r) => r.shortName));

// Citations point across files, which no single schema can check. An unknown
// ranking or product is a typo and fails the build; an unknown institution is
// not, since most citing institutions are outside this dataset by design.
for (const c of citations) {
  if (c.ranking !== undefined && !rankingsById.has(c.ranking)) {
    throw new Error(`citation cites unknown ranking "${c.ranking}" (${c.url})`);
  }
  if (c.product !== undefined && !productNames.has(c.product)) {
    throw new Error(`citation cites unknown ranking product "${c.product}" (${c.url})`);
  }
}

const citationsByRanking = new Map<string, Citation[]>();
const citationsByProduct = new Map<string, Citation[]>();
const citationsByUniversity = new Map<string, Citation[]>();
for (const c of citations) {
  if (c.ranking !== undefined) {
    const list = citationsByRanking.get(c.ranking) ?? [];
    list.push(c);
    citationsByRanking.set(c.ranking, list);
  }
  const product = c.product ?? (c.ranking === undefined ? undefined : rankingsById.get(c.ranking)?.shortName);
  if (product !== undefined) {
    const list = citationsByProduct.get(product) ?? [];
    list.push(c);
    citationsByProduct.set(product, list);
  }
  const byUni = citationsByUniversity.get(c.university) ?? [];
  byUni.push(c);
  citationsByUniversity.set(c.university, byUni);
}

/** Whether a citing institution has a profile page here. Most do not. */
export function isIndexed(institution: string): boolean {
  return universityNames.has(institution);
}

/**
 * Every claim citing this ranking's product, whatever the edition — the test of
 * whether the index has currency, as opposed to this particular year's table.
 */
export function citationsOfProduct(shortName: string): readonly Citation[] {
  return citationsByProduct.get(shortName) ?? [];
}

/**
 * The faculty, school or department that actually earned an institution's
 * placement in a table, where the table ranks units rather than institutions.
 * Absent for the great majority of tables, which rank whole institutions.
 */
export function unitFor(uni: University, rankingId: string): string | undefined {
  return uni.units?.[rankingId];
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
 * Whether any institution has been recorded citing this ranking's product — the
 * test of whether an index has entered the world, as distinct from existing.
 * Product-level rather than edition-level: an institution quoting the 2020
 * edition is evidence about the index, not about the year.
 */
export function isCited(rankingId: string): boolean {
  const product = rankingsById.get(rankingId)?.shortName;
  return citationsByRanking.has(rankingId) || (product !== undefined && citationsByProduct.has(product));
}

/** Every institution recorded citing this index, deduplicated, in first-seen order. */
export function citingInstitutions(rankingId: string): string[] {
  const product = rankingsById.get(rankingId)?.shortName;
  const all = [...citationsOf(rankingId), ...(product ? citationsOfProduct(product) : [])];
  return [...new Set(all.map((c) => c.university))];
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
