import { describe, expect, it } from "vitest";
import {
  absolute,
  citationsPayload,
  indicesPayload,
  institutionJsonLd,
  institutionsPayload,
} from "./api";
import { citations, dataset, isIndexed } from "./rankings";
import { slugify } from "./schema";

const ORIGIN = "https://example.test/world-university-index";

describe("absolute", () => {
  it("joins an origin and a path without doubling or dropping the slash", () => {
    expect(absolute("https://a.test/base", "/x")).toBe("https://a.test/base/x");
    expect(absolute("https://a.test/base/", "/x")).toBe("https://a.test/base/x");
    expect(absolute("https://a.test/base", "x")).toBe("https://a.test/base/x");
  });
});

describe("institutions payload", () => {
  const payload = institutionsPayload(ORIGIN);

  it("publishes every institution that has a placement, best-first", () => {
    const listed = dataset.universities.filter((u) => Object.keys(u.ranks).length > 0);
    expect(payload.count).toBe(listed.length);
    const ranks = payload.institutions.map((i) => i.best.rank);
    expect(ranks).toEqual([...ranks].toSorted((a, b) => a - b));
  });

  it("carries the ROR id through unchanged wherever the dataset holds one", () => {
    const byName = new Map(payload.institutions.map((i) => [i.name, i]));
    let withRor = 0;
    for (const uni of dataset.universities) {
      const entry = byName.get(uni.name);
      if (entry === undefined) continue;
      expect(entry.ror).toBe(uni.ror);
      if (uni.ror !== undefined) withRor += 1;
    }
    // The identifier is the point of the endpoint; if it stopped being emitted
    // the payload would still be valid JSON and silently useless.
    expect(withRor).toBeGreaterThan(0);
  });

  it("links each institution to its own page", () => {
    for (const i of payload.institutions) {
      expect(i.url).toBe(`${ORIGIN}/${i.slug}`);
      expect(i.slug).toBe(slugify(i.name));
    }
  });

  it("reports a best placement that appears in its own placement list", () => {
    for (const i of payload.institutions) {
      const best = i.placements.find((p) => p.ranking === i.best.ranking);
      expect(best?.rank).toBe(i.best.rank);
      expect(Math.min(...i.placements.map((p) => p.rank))).toBe(i.best.rank);
    }
  });

  it("carries the ranked unit where the table ranks units rather than institutions", () => {
    const withUnit = payload.institutions.flatMap((i) =>
      i.placements.filter((p) => p.unit !== undefined),
    );
    expect(withUnit.length).toBeGreaterThan(0);
    for (const i of payload.institutions) {
      for (const p of i.placements) {
        const uni = dataset.universities.find((u) => u.name === i.name)!;
        expect(p.unit).toBe(uni.units?.[p.ranking]);
      }
    }
  });

  it("serialises to JSON without loss", () => {
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});

describe("indices payload", () => {
  const payload = indicesPayload(ORIGIN);

  it("publishes every ranking table with a resolvable page", () => {
    expect(payload.count).toBe(dataset.rankings.length);
    for (const i of payload.indices) {
      expect(i.url).toBe(`${ORIGIN}/indices/${i.id}`);
      expect(i.category).toBeTruthy();
    }
  });

  it("counts placements and citations consistently with the dataset", () => {
    for (const i of payload.indices) {
      const placements = dataset.universities.filter((u) => u.ranks[i.id] !== undefined).length;
      expect(i.placements).toBe(placements);
      expect(i.citations).toBe(citations.filter((c) => c.ranking === i.id).length);
    }
  });
});

describe("citations payload", () => {
  const payload = citationsPayload(ORIGIN);

  it("publishes every claim verbatim", () => {
    expect(payload.count).toBe(citations.length);
    for (const [n, c] of payload.citations.entries()) {
      expect(c.quote).toBe(citations[n]!.quote);
      expect(c.url).toBe(citations[n]!.url);
    }
  });

  it("links only the citing institutions the Index actually lists", () => {
    for (const c of payload.citations) {
      if (isIndexed(c.university)) {
        expect(c.universityUrl).toBe(`${ORIGIN}/${slugify(c.university)}`);
      } else {
        expect(c.universityUrl).toBeUndefined();
      }
    }
    // Both cases have to be exercised or this test proves nothing.
    expect(payload.citations.some((c) => c.universityUrl !== undefined)).toBe(true);
    expect(payload.citations.some((c) => c.universityUrl === undefined)).toBe(true);
  });
});

describe("institution JSON-LD", () => {
  it("states the ROR id as both identity and source", () => {
    const uni = dataset.universities.find((u) => u.ror !== undefined)!;
    const ld = institutionJsonLd(uni, ORIGIN);
    expect(ld["@type"]).toBe("CollegeOrUniversity");
    expect(ld.identifier).toBe(uni.ror);
    expect(ld.sameAs).toEqual([uni.ror]);
    expect(ld.url).toBe(`${ORIGIN}/${slugify(uni.name)}`);
  });

  it("omits the identifier rather than inventing one", () => {
    const uni = dataset.universities.find((u) => u.ror === undefined);
    if (uni === undefined) return;
    const ld = institutionJsonLd(uni, ORIGIN);
    expect(ld).not.toHaveProperty("identifier");
    expect(ld).not.toHaveProperty("sameAs");
  });

  it("emits valid JSON for every institution", () => {
    for (const uni of dataset.universities) {
      expect(() => JSON.parse(JSON.stringify(institutionJsonLd(uni, ORIGIN)))).not.toThrow();
    }
  });
});
