import { z } from "zod";

/** Metadata describing one ranking publication (e.g. QS 2026). */
export const rankingMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  edition: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  retrieved: z.string().min(1),
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

export type RankingMeta = z.infer<typeof rankingMetaSchema>;
export type University = z.infer<typeof universitySchema>;
export type Dataset = z.infer<typeof datasetSchema>;

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
