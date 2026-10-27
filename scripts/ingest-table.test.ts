import { describe, expect, it } from "vitest";
import { countryCode, ingestTable, type Ror, type RorOrg, type TableFile } from "./ingest-table";
import type { Dataset } from "../src/lib/schema";

const ORGS: RorOrg[] = [
  {
    id: "https://ror.org/03r8z3t63",
    name: "UNSW Sydney",
    names: ["UNSW Sydney", "University of New South Wales"],
    countryCode: "AU",
    city: "Sydney",
    types: ["education"],
  },
  {
    id: "https://ror.org/00eae9z71",
    name: "University of Newcastle Australia",
    names: ["University of Newcastle Australia", "University of Newcastle", "Newcastle University"],
    countryCode: "AU",
    city: "Newcastle",
    types: ["education"],
  },
  {
    id: "https://ror.org/0020x6414",
    name: "Hong Kong Polytechnic University",
    names: ["Hong Kong Polytechnic University"],
    countryCode: "HK",
    city: "Hong Kong",
    types: ["education"],
  },
  {
    id: "https://ror.org/04t5xt781",
    name: "Northeastern University",
    names: ["Northeastern University"],
    countryCode: "US",
    city: "Boston",
    types: ["education"],
  },
  {
    id: "https://ror.org/03awzbc87",
    name: "Northeastern University",
    names: ["Northeastern University"],
    countryCode: "CN",
    city: "Shenyang",
    types: ["education"],
  },
  {
    id: "https://ror.org/01hym1a89",
    name: "Maison des Sciences de Paris-Saclay",
    names: ["Maison des Sciences de Paris-Saclay"],
    countryCode: "FR",
    types: ["facility"],
  },
];

/** A stand-in for ROR whose affiliation matching is a lookup table. */
function fakeRor(affiliations: Record<string, { id: string; chosen: boolean }>): Ror {
  const byId = new Map(ORGS.map((o) => [o.id, o]));
  return {
    affiliation: async (name) => {
      const hit = affiliations[name];
      return hit === undefined ? null : { org: byId.get(hit.id)!, chosen: hit.chosen };
    },
    record: async (id) => byId.get(id) ?? null,
  };
}

function dataset(): Dataset {
  return {
    rankings: [
      {
        id: "qs-2026",
        name: "QS",
        shortName: "QS",
        edition: "2026",
        publisher: "QS",
        url: "https://example.org",
        retrieved: "2026-07-01",
      },
    ],
    universities: [
      {
        name: "University of New South Wales",
        country: "Australia",
        ror: "https://ror.org/03r8z3t63",
        ranks: { "qs-2026": 20 },
      },
      {
        name: "University of Newcastle",
        country: "Australia",
        ror: "https://ror.org/00eae9z71",
        ranks: { "qs-2026": 179 },
      },
    ],
  };
}

function table(rows: TableFile["rows"]): TableFile {
  return {
    meta: {
      id: "test-2026",
      name: "Test Ranking",
      shortName: "Test",
      edition: "2026",
      publisher: "Test",
      url: "https://example.org/test",
      retrieved: "2026-10-27",
    },
    rows,
  };
}

describe("ingestTable", () => {
  it("adds the table and matches a held institution under any name ROR records for it", async () => {
    const data = dataset();
    const result = await ingestTable(
      data,
      table([{ rank: 7, name: "UNSW Sydney", country: "Australia" }]),
      fakeRor({}),
      50,
    );
    expect(data.rankings.map((r) => r.id)).toContain("test-2026");
    expect(data.universities[0]!.ranks["test-2026"]).toBe(7);
    expect(result.matched).toEqual([
      { name: "University of New South Wales", rank: 7, via: "name" },
    ]);
  });

  it("doesn't credit a namesake in another country", async () => {
    const data = dataset();
    await ingestTable(
      data,
      table([
        { rank: 201, name: "Newcastle University", country: "United Kingdom" },
        { rank: 401, name: "University of Newcastle", country: "Australia" },
      ]),
      fakeRor({}),
      50,
    );
    expect(data.universities[1]!.ranks["test-2026"]).toBe(401);
  });

  it("admits an unmatched row inside the bar, named and placed by ROR", async () => {
    const data = dataset();
    const result = await ingestTable(
      data,
      table([{ rank: 3, name: "The Hong Kong Polytechnic University", country: "China" }]),
      fakeRor({
        "The Hong Kong Polytechnic University, China": {
          id: "https://ror.org/0020x6414",
          chosen: true,
        },
      }),
      50,
    );
    expect(result.admitted).toHaveLength(1);
    expect(data.universities.at(-1)).toEqual({
      name: "Hong Kong Polytechnic University",
      country: "Hong Kong",
      city: "Hong Kong",
      ror: "https://ror.org/0020x6414",
      ranks: { "test-2026": 3 },
    });
  });

  it("admits nobody below the bar", async () => {
    const data = dataset();
    await ingestTable(
      data,
      table([{ rank: 51, name: "The Hong Kong Polytechnic University", country: "Hong Kong" }]),
      fakeRor({
        "The Hong Kong Polytechnic University, Hong Kong": {
          id: "https://ror.org/0020x6414",
          chosen: true,
        },
      }),
      50,
    );
    expect(data.universities).toHaveLength(2);
  });

  it("refuses a ROR match in the wrong country, and falls back to the bare name", async () => {
    const data = dataset();
    const result = await ingestTable(
      data,
      table([{ rank: 10, name: "Northeastern University", country: "United States" }]),
      fakeRor({
        "Northeastern University, United States": { id: "https://ror.org/03awzbc87", chosen: true },
        "Northeastern University": { id: "https://ror.org/04t5xt781", chosen: true },
      }),
      50,
    );
    expect(result.admitted.map((a) => a.country)).toEqual(["United States"]);
    expect(data.universities.at(-1)!.city).toBe("Boston");
  });

  it("refuses a guess ROR didn't choose, and an organisation that isn't a university", async () => {
    const data = dataset();
    const result = await ingestTable(
      data,
      table([
        { rank: 6, name: "Northeastern University (Shenyang)", country: "China" },
        { rank: 13, name: "Paris-Saclay University", country: "France" },
      ]),
      fakeRor({
        "Northeastern University (Shenyang), China": {
          id: "https://ror.org/03awzbc87",
          chosen: false,
        },
        "Paris-Saclay University, France": { id: "https://ror.org/01hym1a89", chosen: true },
      }),
      50,
    );
    expect(result.admitted).toEqual([]);
    expect(result.unresolved.map((u) => u.row.name)).toEqual([
      "Northeastern University (Shenyang)",
      "Paris-Saclay University",
    ]);
  });

  it("takes a hand-checked override over ROR's matching", async () => {
    const data = dataset();
    const result = await ingestTable(
      data,
      table([{ rank: 6, name: "Northeastern University (Shenyang)", country: "China" }]),
      fakeRor({}),
      50,
      { "Northeastern University (Shenyang)": "https://ror.org/03awzbc87" },
    );
    expect(result.admitted).toEqual([
      {
        name: "Northeastern University",
        rank: 6,
        country: "China",
        as: "Northeastern University (Shenyang)",
      },
    ]);
  });
});

describe("countryCode", () => {
  it("reads the spellings publishers actually use", () => {
    expect(countryCode("USA")).toBe("US");
    expect(countryCode("China-Hong Kong")).toBe("HK");
    expect(countryCode("Chinese Taipei")).toBe("TW");
    expect(countryCode("Germany")).toBe("DE");
    expect(countryCode("France")).toBe("FR");
    expect(countryCode("Türkiye")).toBe("TR");
  });
});
