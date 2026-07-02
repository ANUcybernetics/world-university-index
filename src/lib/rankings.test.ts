import { describe, expect, it } from "vitest";
import {
  bestRank,
  isWorldRanking,
  ordinal,
  placementPhrase,
  rankProfile,
  regionOf,
  slugify,
  type RankingMeta,
  type University,
} from "./schema";
import { dataset, rankedUniversities, universityBySlug } from "./rankings";

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

describe("placementPhrase", () => {
  const base: RankingMeta = {
    id: "x",
    name: "X",
    shortName: "X",
    edition: "1",
    publisher: "p",
    url: "https://x.test",
    retrieved: "x",
  };

  it("reads 'in the world' for an overall world ranking", () => {
    expect(placementPhrase(base)).toBe("in the world");
    expect(isWorldRanking(base)).toBe(true);
  });

  it("appends the subject scope for a world subject ranking", () => {
    expect(placementPhrase({ ...base, scope: "Philosophy" })).toBe("in the world for Philosophy");
  });

  it("reads 'in {universe}' for a national ranking and marks it non-world", () => {
    const national = { ...base, universe: "the United Kingdom" };
    expect(placementPhrase(national)).toBe("in the United Kingdom");
    expect(isWorldRanking(national)).toBe(false);
  });
});

describe("rankedUniversities", () => {
  const entries = rankedUniversities();

  it("includes every dataset institution that has at least one world rank", () => {
    // The headline is a world placement, so an institution ranked only in
    // national tables would (correctly) not appear.
    const worldIds = new Set(dataset.rankings.filter(isWorldRanking).map((r) => r.id));
    const expected = dataset.universities.filter((u) =>
      Object.keys(u.ranks).some((id) => worldIds.has(id)),
    ).length;
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
