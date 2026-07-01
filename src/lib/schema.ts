import { z } from "zod";

/** Broad family a ranking belongs to, used only to group the source list. */
export const rankingCategorySchema = z.enum(["overall", "subject", "sdg", "thematic"]);

/** Metadata describing one ranking publication (e.g. QS 2026). */
export const rankingMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  edition: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  retrieved: z.string().min(1),
  /**
   * What the placement is *for*, phrased to follow "in the world" — e.g.
   * "Philosophy", "climate action (SDG 13)", "universities under 50 years old".
   * Absent for an overall, whole-of-institution world ranking.
   */
  scope: z.string().min(1).optional(),
  /** Ranking family, for grouping the source list. Defaults to "overall". */
  category: rankingCategorySchema.optional(),
});

/** One institution and its placement in each ranking. */
export const universitySchema = z.object({
  name: z.string().min(1),
  shortName: z.string().optional(),
  country: z.string().min(1),
  city: z.string().optional(),
  ranks: z.record(z.string(), z.number().int().positive()),
});

export const datasetSchema = z.object({
  rankings: z.array(rankingMetaSchema).min(1),
  universities: z.array(universitySchema).min(1),
});

export type RankingCategory = z.infer<typeof rankingCategorySchema>;
export type RankingMeta = z.infer<typeof rankingMetaSchema>;
export type University = z.infer<typeof universitySchema>;
export type Dataset = z.infer<typeof datasetSchema>;

/**
 * The qualifier appended to "in the world" for a ranking, e.g. " for Philosophy".
 * Empty for an overall ranking, so the claim reads simply "in the world".
 */
export function scopeSuffix(ranking: RankingMeta): string {
  return ranking.scope ? ` for ${ranking.scope}` : "";
}

/** A geographic grouping used by the index page's region filter buttons. */
export type Region = "australia" | "usa" | "uk" | "europe" | "asia" | "other";

/**
 * Countries that make up each filterable region. The UK is deliberately kept
 * out of "europe" so the two buttons don't overlap. The lists are broader than
 * the countries currently in the dataset so a newly added institution lands in
 * the right bucket without a code change. Anything unlisted (Canada, New
 * Zealand, the Middle East, Latin America) falls through to "other" and stays
 * reachable via the "All" button or the search box.
 */
const REGION_COUNTRIES: Record<Exclude<Region, "other">, readonly string[]> = {
  australia: ["Australia"],
  usa: ["United States"],
  uk: ["United Kingdom"],
  europe: [
    "Germany",
    "Netherlands",
    "Switzerland",
    "France",
    "Sweden",
    "Belgium",
    "Italy",
    "Ireland",
    "Denmark",
    "Austria",
    "Spain",
    "Portugal",
    "Norway",
    "Finland",
    "Poland",
    "Czechia",
    "Greece",
    "Luxembourg",
    "Iceland",
    "Estonia",
  ],
  asia: [
    "China",
    "Japan",
    "Hong Kong",
    "South Korea",
    "Singapore",
    "Malaysia",
    "Taiwan",
    "India",
    "Thailand",
    "Indonesia",
    "Macau",
  ],
};

/** The region a country belongs to for the index page's filter buttons. */
export function regionOf(country: string): Region {
  for (const [region, countries] of Object.entries(REGION_COUNTRIES)) {
    if (countries.includes(country)) return region as Region;
  }
  return "other";
}

/** Region filter buttons for the index page, in display order. */
export const regionFilters: readonly { key: Region | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "australia", label: "Australia" },
  { key: "usa", label: "USA" },
  { key: "uk", label: "UK" },
  { key: "europe", label: "Europe" },
  { key: "asia", label: "Asia" },
];

/** Turn an institution name into a clean URL slug. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The single best (lowest-numbered) placement an institution can claim. */
export interface BestRank {
  ranking: RankingMeta;
  rank: number;
}

/**
 * Find an institution's strongest verified placement among the supplied
 * rankings. Ties are broken by the order rankings are supplied, so the result
 * is deterministic.
 */
export function bestRank(uni: University, rankings: readonly RankingMeta[]): BestRank | null {
  let best: BestRank | null = null;
  for (const ranking of rankings) {
    const rank = uni.ranks[ranking.id];
    if (rank === undefined) continue;
    if (best === null || rank < best.rank) {
      best = { ranking, rank };
    }
  }
  return best;
}

/** Every placement an institution holds, ordered best-first. */
export function rankProfile(uni: University, rankings: readonly RankingMeta[]): BestRank[] {
  return rankings
    .filter((ranking) => uni.ranks[ranking.id] !== undefined)
    .map((ranking) => ({ ranking, rank: uni.ranks[ranking.id]! }))
    .toSorted((a, b) => a.rank - b.rank);
}

/** Ordinal suffix for a positive integer: 1 -> "1st", 30 -> "30th". */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
