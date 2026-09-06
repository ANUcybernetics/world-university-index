import { describe, expect, it } from "vitest";
import {
  bestRank,
  ordinal,
  rankProfile,
  regionOf,
  slugify,
  type RankingMeta,
  type University,
} from "./schema";
import {
  citations,
  citationsBy,
  citationsOf,
  citationsOfProduct,
  isIndexed,
  citingInstitutions,
  dataset,
  isCited,
  rankedUniversities,
  unitFor,
  universityBySlug,
} from "./rankings";

const TEST_RANKINGS: RankingMeta[] = [
  {
    id: "alpha",
    name: "Alpha",
    shortName: "A",
    edition: "1",
    publisher: "p",
    url: "https://a.test",
    retrieved: "x",
  },
  {
    id: "beta",
    name: "Beta",
    shortName: "B",
    edition: "1",
    publisher: "p",
    url: "https://b.test",
    retrieved: "x",
  },
  {
    id: "gamma",
    name: "Gamma",
    shortName: "G",
    edition: "1",
    publisher: "p",
    url: "https://g.test",
    retrieved: "x",
  },
];

describe("slugify", () => {
  it("lowercases and hyphenates names", () => {
    expect(slugify("Australian National University")).toBe("australian-national-university");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("Université   d'Aix-Marseille!")).toBe("universite-d-aix-marseille");
  });

  it("produces a unique slug for every institution in the dataset", () => {
    const slugs = dataset.universities.map((u) => slugify(u.name));
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("ordinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [30, "30th"],
    [101, "101st"],
    [113, "113th"],
  ])("formats %i as %s", (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});

describe("regionOf", () => {
  it.each([
    ["Australia", "australia"],
    ["United States", "usa"],
    ["United Kingdom", "uk"],
    ["Germany", "europe"],
    ["China", "asia"],
    ["Malaysia", "asia"],
  ])("maps %s to %s", (country, region) => {
    expect(regionOf(country)).toBe(region);
  });

  it("keeps the UK out of Europe so the two buttons don't overlap", () => {
    expect(regionOf("United Kingdom")).not.toBe("europe");
  });

  it("falls back to 'other' for unlisted countries", () => {
    expect(regionOf("Canada")).toBe("other");
    expect(regionOf("Brazil")).toBe("other");
  });
});

describe("bestRank", () => {
  it("returns the lowest-numbered placement across rankings", () => {
    const uni: University = {
      name: "Test U",
      country: "Testland",
      ranks: { alpha: 40, beta: 12, gamma: 88 },
    };
    const best = bestRank(uni, TEST_RANKINGS);
    expect(best?.rank).toBe(12);
    expect(best?.ranking.id).toBe("beta");
  });

  it("returns null when the institution has no recorded ranks", () => {
    const uni: University = { name: "Nowhere", country: "Testland", ranks: {} };
    expect(bestRank(uni, TEST_RANKINGS)).toBeNull();
  });

  it("breaks ties by supplied ranking order, deterministically", () => {
    const uni: University = {
      name: "Tie U",
      country: "Testland",
      ranks: { beta: 50, gamma: 50 },
    };
    // beta is supplied before gamma, so it wins the tie.
    expect(bestRank(uni, TEST_RANKINGS)?.ranking.id).toBe("beta");
  });
});

describe("rankProfile", () => {
  it("orders an institution's placements best-first", () => {
    const uni: University = {
      name: "Profile U",
      country: "Testland",
      ranks: { alpha: 90, beta: 10, gamma: 45 },
    };
    expect(rankProfile(uni, TEST_RANKINGS).map((p) => p.rank)).toEqual([10, 45, 90]);
  });

  it("omits rankings the institution does not appear in", () => {
    const uni: University = {
      name: "Sparse U",
      country: "Testland",
      ranks: { alpha: 5 },
    };
    const profile = rankProfile(uni, TEST_RANKINGS);
    expect(profile).toHaveLength(1);
    expect(profile[0]!.ranking.id).toBe("alpha");
  });
});

describe("rankedUniversities", () => {
  const entries = rankedUniversities();

  it("includes every dataset institution that has at least one rank", () => {
    const expected = dataset.universities.filter((u) => Object.keys(u.ranks).length > 0).length;
    expect(entries).toHaveLength(expected);
  });

  it("is sorted by best rank ascending", () => {
    const ranks = entries.map((e) => e.best.rank);
    const sorted = ranks.toSorted((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });

  it("round-trips slug -> university", () => {
    for (const e of entries) {
      expect(universityBySlug(e.slug)?.name).toBe(e.university.name);
    }
  });

  it("reports a verified source ranking for every headline figure", () => {
    const ids = new Set(dataset.rankings.map((r) => r.id));
    for (const e of entries) {
      expect(ids).toContain(e.best.ranking.id);
      expect(e.university.ranks[e.best.ranking.id]).toBe(e.best.rank);
    }
  });
});

describe("dataset integrity", () => {
  it("only references ranking ids that exist", () => {
    const ids = new Set(dataset.rankings.map((r) => r.id));
    for (const uni of dataset.universities) {
      for (const id of Object.keys(uni.ranks)) {
        expect(ids).toContain(id);
      }
    }
  });

  it("records at least one Australian institution", () => {
    expect(dataset.universities.some((u) => u.country === "Australia")).toBe(true);
  });
});

describe("citations", () => {
  it("accepts institutions from outside the dataset, and flags which are inside", () => {
    const names = new Set(dataset.universities.map((u) => u.name));
    for (const c of citations) {
      expect(isIndexed(c.university)).toBe(names.has(c.university));
    }
    // The point of the widened model: outside institutions vouch for an index
    // just as well, and most of the world's universities are outside.
    expect(citations.some((c) => !isIndexed(c.university))).toBe(true);
  });

  it("names a ranking and a product that exist, where it names them at all", () => {
    const ids = new Set(dataset.rankings.map((r) => r.id));
    const products = new Set(dataset.rankings.map((r) => r.shortName));
    for (const c of citations) {
      if (c.ranking !== undefined) expect(ids).toContain(c.ranking);
      if (c.product !== undefined) expect(products).toContain(c.product);
    }
  });

  it("counts a claim about any edition as vouching for the index", () => {
    const withProduct = citations.filter((c) => c.product !== undefined && c.ranking === undefined);
    expect(withProduct.length).toBeGreaterThan(0);
    for (const c of withProduct) {
      expect(citationsOfProduct(c.product!)).toContain(c);
      const table = dataset.rankings.find((r) => r.shortName === c.product)!;
      expect(isCited(table.id)).toBe(true);
    }
  });

  it("quotes rather than summarises: every claim carries verbatim text and a source", () => {
    for (const c of citations) {
      expect(c.quote.trim().length).toBeGreaterThan(0);
      expect(c.quote.length).toBeLessThanOrEqual(300);
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  it("indexes each citation under both the institution and the table", () => {
    for (const c of citations) {
      const uni = dataset.universities.find((u) => u.name === c.university);
      if (uni !== undefined) expect(citationsBy(uni)).toContain(c);
      if (c.ranking !== undefined) {
        expect(citationsOf(c.ranking)).toContain(c);
        expect(isCited(c.ranking)).toBe(true);
        expect(citingInstitutions(c.ranking)).toContain(c.university);
      }
    }
  });

  it("treats an index nobody has quoted as uncited", () => {
    const uncited = dataset.rankings.find(
      (r) => citationsOf(r.id).length === 0 && citationsOfProduct(r.shortName).length === 0,
    );
    expect(uncited).toBeDefined();
    expect(isCited(uncited!.id)).toBe(false);
    expect(citingInstitutions(uncited!.id)).toEqual([]);
  });
});

describe("ranked units", () => {
  it("names a unit only for a table the institution actually places in", () => {
    const ids = new Set(dataset.rankings.map((r) => r.id));
    for (const uni of dataset.universities) {
      for (const [rankingId, unit] of Object.entries(uni.units ?? {})) {
        expect(ids).toContain(rankingId);
        expect(uni.ranks[rankingId]).toBeDefined();
        expect(unit.trim().length).toBeGreaterThan(0);
        expect(unitFor(uni, rankingId)).toBe(unit);
      }
    }
  });

  it("leaves whole-institution tables without a unit", () => {
    const overall = dataset.rankings.find((r) => r.shortName === "QS" && r.scope === undefined)!;
    for (const uni of dataset.universities) {
      expect(unitFor(uni, overall.id)).toBeUndefined();
    }
  });

  it("records a unit for the ranking that is explicitly of schools and departments", () => {
    const grsssd = dataset.rankings.filter((r) => r.shortName === "ARWU GRSSSD");
    expect(grsssd.length).toBeGreaterThan(0);
    const withUnits = dataset.universities.filter((u) =>
      grsssd.some((r) => unitFor(u, r.id) !== undefined),
    );
    expect(withUnits.length).toBeGreaterThan(0);
  });
});
