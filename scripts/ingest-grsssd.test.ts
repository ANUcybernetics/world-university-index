import { describe, expect, it } from "vitest";
import { applyRows, parseRows, type UnitRow } from "./ingest-grsssd";
import type { Dataset } from "../src/lib/schema";

// Trimmed from the live table. The shape that matters: the parent institution
// arrives as a /universities/<slug> link and the ranked unit as its own
// sub-name element, so neither has to be matched by hand.
const FIXTURE = `
<tr>
  <td><div class="ranking">1</div></td>
  <td>
    <div class="link-container"><a href="/universities/deakin-university"><span class="univ-name">
      Deakin University
    </span></a></div>
    <span class="tooltiptext">Deakin University</span>
    <div class="sub-name"><div class="link-container"><span class="univ-name">
      School of Exercise and Nutrition Sciences
    </span></div></div>
  </td>
  <td>331.6</td>
</tr>
<tr>
  <td><div class="ranking">5</div></td>
  <td>
    <div class="link-container"><a href="/universities/university-of-copenhagen"><span class="univ-name">
      University of Copenhagen
    </span></a></div>
    <div class="sub-name"><div class="link-container"><span class="univ-name">
      Department of Nutrition, Exercise &amp; Sports
    </span></div></div>
  </td>
  <td>290.1</td>
</tr>
`;

describe("parseRows", () => {
  const rows = parseRows(FIXTURE);

  it("reads the rank, the parent institution and the ranked unit", () => {
    expect(rows).toEqual([
      {
        rank: 1,
        institutionSlug: "deakin-university",
        institution: "Deakin University",
        unit: "School of Exercise and Nutrition Sciences",
      },
      {
        rank: 5,
        institutionSlug: "university-of-copenhagen",
        institution: "University of Copenhagen",
        unit: "Department of Nutrition, Exercise & Sports",
      },
    ]);
  });

  it("skips rows that carry no unit rather than inventing one", () => {
    expect(
      parseRows(`<tr><td>1</td><td><a href="/universities/x"><span>X</span></a></td></tr>`),
    ).toEqual([]);
  });
});

const fixtureDataset = (): Dataset => ({
    rankings: [
      {
        id: "grsssd-sport-2025",
        name: "Sport",
        shortName: "S",
        edition: "2025",
        publisher: "p",
        url: "https://s.test",
        retrieved: "x",
      },
    ],
  universities: [{ name: "Deakin University", country: "Australia", ranks: {} }],
});

describe("applyRows", () => {
  it("records the rank against the institution and keeps the unit beside it", () => {
    const data = fixtureDataset();
    const { matched, unmatched } = applyRows(data, "grsssd-sport-2025", parseRows(FIXTURE));
    expect(matched).toHaveLength(1);
    expect(unmatched.map((u: UnitRow) => u.institution)).toEqual(["University of Copenhagen"]);
    const deakin = data.universities[0]!;
    expect(deakin.ranks["grsssd-sport-2025"]).toBe(1);
    expect(deakin.units?.["grsssd-sport-2025"]).toBe("School of Exercise and Nutrition Sciences");
  });

  it("leaves units already recorded for other tables alone", () => {
    const data = fixtureDataset();
    data.universities[0]!.units = { "grsssd-sport-2024": "An Earlier School" };
    applyRows(data, "grsssd-sport-2025", parseRows(FIXTURE));
    expect(data.universities[0]!.units).toEqual({
      "grsssd-sport-2024": "An Earlier School",
      "grsssd-sport-2025": "School of Exercise and Nutrition Sciences",
    });
  });
});
