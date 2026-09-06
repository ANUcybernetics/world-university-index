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
  /**
   * The population a placement is *actually* measured against, e.g. "the United
   * Kingdom", "Canada" — set for a national/regional league table. Recorded as
   * the honest provenance (see `PROVENANCE.md`), but deliberately NOT surfaced
   * in the claim: the site reports a national placement deadpan as "Nth in the
   * world" like any other, leaving the source line (e.g. "CUG 2027") as the only
   * tell. Absent for a genuine world ranking.
   */
  universe: z.string().min(1).optional(),
  /** Ranking family, for grouping the source list. Defaults to "overall". */
  category: rankingCategorySchema.optional(),
});

/** One institution and its placement in each ranking. */
export const universitySchema = z.object({
  name: z.string().min(1),
  shortName: z.string().optional(),
  country: z.string().min(1),
  city: z.string().optional(),
  /**
   * Research Organization Registry identifier, e.g.
   * "https://ror.org/019wvm592". Not used for display: it exists so that a name
   * appearing in one publisher's table can be matched to the same institution
   * in another's, which naive string matching gets wrong in both directions
   * ("University of Wollongong" vs "University of Wollongong in Dubai";
   * "Northwestern University" vs "Lyceum-Northwestern University"). Absent for
   * institutions ROR does not list.
   */
  ror: z.url().regex(/^https:\/\/ror\.org\/0[a-z0-9]{8}$/).optional(),
  ranks: z.record(z.string(), z.number().int().positive()),
});

/**
 * One published instance of an institution citing a ranking: the backlink that
 * makes a ranking count. An index nobody has ever quoted is a spreadsheet; one
 * a university has put on its own website is, by that fact alone, an index that
 * matters to somebody. Obscurity is not a disqualification — a citation of a
 * ranking almost nobody has heard of is the most eloquent kind.
 */
export const citationSchema = z.object({
  /**
   * The citing institution. Matched to `universities` by name where possible,
   * but deliberately not restricted to it: a ranking is vouched for by whoever
   * quotes it, and most of the world's universities are not in this dataset.
   * An institution we don't hold still supplies evidence about the index.
   */
  university: z.string().min(1),
  /**
   * The exact ranking table cited, where the claim names one we hold. Often
   * unset: institutions cite editions going back years, and the Index holds
   * only some of them.
   */
  ranking: z.string().min(1).optional(),
  /**
   * The ranking product cited, by `shortName` (e.g. "RUR"). Carries the claim
   * when the specific edition isn't one we hold, which is the common case —
   * evidence about an index rarely arrives conveniently attached to the
   * edition in front of us.
   */
  product: z.string().min(1).optional(),
  /** The page carrying the claim, on the institution's own domain where possible. */
  url: z.url(),
  /**
   * The claim as published, verbatim. Quoted, never paraphrased and never
   * tidied: the institution's own words are the whole point, and a short
   * attributed quotation is what keeps this fair. Capped to keep it a pull
   * quote rather than a reproduction.
   */
  quote: z.string().min(1).max(300),
  retrieved: z.string().min(1),
  /** Archive capture, for when the institution restructures the claim away. */
  archive: z.url().optional(),
});

export const citationsFileSchema = z.object({
  citations: z.array(citationSchema),
});

export const datasetSchema = z.object({
  rankings: z.array(rankingMetaSchema).min(1),
  universities: z.array(universitySchema).min(1),
});

export type RankingCategory = z.infer<typeof rankingCategorySchema>;
export type Citation = z.infer<typeof citationSchema>;
export type CitationsFile = z.infer<typeof citationsFileSchema>;
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

/**
 * Whether a ranking is a whole-of-institution overall ranking, as opposed to a
 * subject, SDG or thematic one. The category defaults to "overall" when absent.
 */
export function isOverall(ranking: RankingMeta): boolean {
  return (ranking.category ?? "overall") === "overall";
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
