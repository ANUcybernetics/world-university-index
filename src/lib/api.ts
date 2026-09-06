/**
 * Machine-readable views of the dataset.
 *
 * The Index is assembled by joining tables from publishers who each name the
 * same institution differently, so it publishes the identifier it wishes they
 * had: every institution carries its ROR id, and anyone merging this data with
 * their own can join on that rather than repeating our name-matching problem.
 *
 * These are pure functions over the dataset, taking the site origin as an
 * argument rather than reading it from the environment, so they can be tested
 * without a server and without Astro's globals.
 */
import { citations, citationsOf, dataset, isIndexed, rankProfile } from "./rankings";
import { bestRank, slugify, type Citation, type RankingMeta, type University } from "./schema";

/** Join a site origin and a site-absolute path into one absolute URL. */
export function absolute(origin: string, path: string): string {
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface InstitutionPayload {
  name: string;
  shortName?: string;
  country: string;
  city?: string;
  /** ROR identifier, absent for institutions ROR does not list. */
  ror?: string;
  slug: string;
  url: string;
  /** The single most flattering placement, which is what the site reports. */
  best: { ranking: string; name: string; edition: string; scope?: string; rank: number };
  placements: { ranking: string; rank: number; unit?: string }[];
}

export interface IndexPayload {
  id: string;
  name: string;
  shortName: string;
  edition: string;
  publisher: string;
  url: string;
  scope?: string;
  universe?: string;
  category: string;
  /** Institutions the Index records in this table. */
  placements: number;
  /** Published claims citing this exact table. */
  citations: number;
}

export interface CitationPayload {
  university: string;
  /** Profile URL, present only where the citing institution is one we list. */
  universityUrl?: string;
  ranking?: string;
  product?: string;
  url: string;
  quote: string;
  retrieved: string;
  archive?: string;
}

function institutionOf(uni: University, origin: string): InstitutionPayload | null {
  const best = bestRank(uni, dataset.rankings);
  if (best === null) return null;
  const slug = slugify(uni.name);
  return {
    name: uni.name,
    ...(uni.shortName === undefined ? {} : { shortName: uni.shortName }),
    country: uni.country,
    ...(uni.city === undefined ? {} : { city: uni.city }),
    ...(uni.ror === undefined ? {} : { ror: uni.ror }),
    slug,
    url: absolute(origin, `/${slug}`),
    best: {
      ranking: best.ranking.id,
      name: best.ranking.name,
      edition: best.ranking.edition,
      ...(best.ranking.scope === undefined ? {} : { scope: best.ranking.scope }),
      rank: best.rank,
    },
    placements: rankProfile(uni).map((p) => ({
      ranking: p.ranking.id,
      rank: p.rank,
      // Present only where the table ranks units: the placement was won by this
      // faculty or department, not by the institution as a whole.
      ...(uni.units?.[p.ranking.id] === undefined ? {} : { unit: uni.units[p.ranking.id] }),
    })),
  };
}

export function institutionsPayload(origin: string): {
  count: number;
  institutions: InstitutionPayload[];
} {
  const institutions = dataset.universities
    .map((u) => institutionOf(u, origin))
    .filter((i): i is InstitutionPayload => i !== null)
    .toSorted((a, b) => a.best.rank - b.best.rank || a.name.localeCompare(b.name));
  return { count: institutions.length, institutions };
}

export function indicesPayload(origin: string): { count: number; indices: IndexPayload[] } {
  const indices = dataset.rankings.map((r: RankingMeta): IndexPayload => {
    return {
      id: r.id,
      name: r.name,
      shortName: r.shortName,
      edition: r.edition,
      publisher: r.publisher,
      url: absolute(origin, `/indices/${r.id}`),
      ...(r.scope === undefined ? {} : { scope: r.scope }),
      ...(r.universe === undefined ? {} : { universe: r.universe }),
      category: r.category ?? "overall",
      placements: dataset.universities.filter((u) => u.ranks[r.id] !== undefined).length,
      citations: citationsOf(r.id).length,
    };
  });
  return { count: indices.length, indices };
}

export function citationsPayload(origin: string): {
  count: number;
  citations: CitationPayload[];
} {
  const out = citations.map((c: Citation): CitationPayload => {
    return {
      university: c.university,
      ...(isIndexed(c.university)
        ? { universityUrl: absolute(origin, `/${slugify(c.university)}`) }
        : {}),
      ...(c.ranking === undefined ? {} : { ranking: c.ranking }),
      ...(c.product === undefined ? {} : { product: c.product }),
      url: c.url,
      quote: c.quote,
      retrieved: c.retrieved,
      ...(c.archive === undefined ? {} : { archive: c.archive }),
    };
  });
  return { count: out.length, citations: out };
}

/**
 * schema.org description of one institution, embedded in its profile page so
 * the page is machine-readable in place. `identifier` and `sameAs` both carry
 * the ROR id: the first states what the institution *is*, the second points at
 * the record that says so.
 */
export function institutionJsonLd(uni: University, origin: string): Record<string, unknown> {
  const slug = slugify(uni.name);
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: uni.name,
    url: absolute(origin, `/${slug}`),
    ...(uni.ror === undefined ? {} : { identifier: uni.ror, sameAs: [uni.ror] }),
    address: {
      "@type": "PostalAddress",
      ...(uni.city === undefined ? {} : { addressLocality: uni.city }),
      addressCountry: uni.country,
    },
  };
}
