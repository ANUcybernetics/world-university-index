import { describe, expect, it } from "vitest";
import type { Dataset } from "../src/lib/schema";
import { audit, normalise } from "./update-rankings";

const base: Dataset = {
  rankings: [
    {
      id: "qs",
      name: "QS",
      shortName: "QS",
      edition: "2026",
      publisher: "p",
      url: "https://qs.test",
      retrieved: "x",
    },
    {
      id: "the",
      name: "THE",
      shortName: "THE",
      edition: "2026",
      publisher: "p",
      url: "https://the.test",
      retrieved: "x",
    },
  ],
  universities: [
    { name: "Zeta University", country: "Australia", ranks: { the: 50, qs: 10 } },
    { name: "Alpha University", country: "Australia", ranks: { qs: 5 } },
  ],
};

describe("normalise", () => {
  it("sorts institutions by name", () => {
    const out = normalise(base);
    expect(out.universities.map((u) => u.name)).toEqual(["Alpha University", "Zeta University"]);
  });

  it("reorders rank keys to match ranking declaration order", () => {
    const out = normalise(base);
    const zeta = out.universities.find((u) => u.name === "Zeta University")!;
    expect(Object.keys(zeta.ranks)).toEqual(["qs", "the"]);
  });

  it("preserves rank values", () => {
    const out = normalise(base);
    const zeta = out.universities.find((u) => u.name === "Zeta University")!;
    expect(zeta.ranks).toEqual({ qs: 10, the: 50 });
  });
});

describe("audit", () => {
  it("returns no issues for a clean dataset", () => {
    expect(audit(base)).toEqual([]);
  });

  it("flags an unknown ranking reference as an error", () => {
    const bad: Dataset = {
      ...base,
      universities: [{ name: "Bad University", country: "Australia", ranks: { nope: 1 } }],
    };
    const issues = audit(bad);
    expect(issues).toContainEqual({
      level: "error",
      message: 'Bad University references unknown ranking "nope"',
    });
  });

  it("flags slug collisions as an error", () => {
    const clash: Dataset = {
      ...base,
      universities: [
        { name: "The University!", country: "Australia", ranks: { qs: 1 } },
        { name: "The University", country: "Australia", ranks: { qs: 2 } },
      ],
    };
    expect(audit(clash).some((i) => i.message.startsWith("slug collision"))).toBe(true);
  });

  it("warns about institutions with no ranks", () => {
    const empty: Dataset = {
      ...base,
      universities: [{ name: "Empty University", country: "Australia", ranks: {} }],
    };
    expect(audit(empty)).toContainEqual({
      level: "warning",
      message: "Empty University has no recorded ranks and will be hidden",
    });
  });
});
