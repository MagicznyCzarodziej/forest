import { describe, expect, it } from "vitest";
import { tabCompleteAdvance, tabCompleteHint } from "../../src/search/tab-complete.js";

const repos = [
  "table-rotating-blah",
  "table-rotating-garden",
  "table-fuzzy-mine",
  "tableau-seven",
  "random-goat",
];

describe("tabCompleteHint", () => {
  it("returns the suffix Tab would add for a shared-prefix extension", () => {
    expect(tabCompleteHint("ta", repos, null)).toBe("ble");
    expect(tabCompleteHint("table-r", repos, null)).toBe("otating-");
  });

  it("returns the rest of a single matching name", () => {
    expect(tabCompleteHint("ran", repos, null)).toBe("dom-goat");
  });

  it("returns empty when there is no completion", () => {
    expect(tabCompleteHint("zzz", repos, null)).toBe("");
    expect(tabCompleteHint("", repos, null)).toBe("");
  });

  it("is case-insensitive for the typed query", () => {
    expect(tabCompleteHint("TA", repos, null)).toBe("ble");
    expect(tabCompleteHint("TABLE-R", repos, null)).toBe("otating-");
    expect(tabCompleteHint("Ran", repos, null)).toBe("dom-goat");
  });

  it("follows the active Tab cycle state", () => {
    const first = tabCompleteAdvance("table-r", repos, null);
    expect(tabCompleteHint(first.query, repos, first.state)).toBe("blah");
  });
});

describe("tabCompleteAdvance", () => {
  it("extends to the longest prefix shared by every name that starts with the query", () => {
    expect(tabCompleteAdvance("ta", repos, null).query).toBe("table");
    expect(tabCompleteAdvance("table-r", repos, null).query).toBe("table-rotating-");
  });

  it("completes a single match to the full name", () => {
    expect(tabCompleteAdvance("tablea", repos, null).query).toBe("tableau-seven");
    expect(tabCompleteAdvance("ran", repos, null).query).toBe("random-goat");
  });

  it("leaves the query unchanged when nothing starts with it", () => {
    expect(tabCompleteAdvance("zzz", repos, null).query).toBe("zzz");
  });

  it("cycles the matching names after the shared prefix", () => {
    const first = tabCompleteAdvance("table-r", repos, null);
    expect(first.query).toBe("table-rotating-");

    const second = tabCompleteAdvance(first.query, repos, first.state);
    expect(second.query).toBe("table-rotating-blah");

    const third = tabCompleteAdvance(second.query, repos, second.state);
    expect(third.query).toBe("table-rotating-garden");

    const fourth = tabCompleteAdvance(third.query, repos, third.state);
    expect(fourth.query).toBe("table-rotating-blah");
  });

  it("moves to the next name when the query is already the first match", () => {
    const names = ["lumi", "luminark", "backend"];
    const first = tabCompleteAdvance("lumi", names, null);
    expect(first.query).toBe("luminark");
  });

  it("skips the first result when the query is already that name", () => {
    const names = ["lumi", "luminark", "backend"];
    const first = tabCompleteAdvance("lum", names, null);
    expect(first.query).toBe("lumi");

    const second = tabCompleteAdvance(first.query, names, first.state);
    expect(second.query).toBe("luminark");

    const third = tabCompleteAdvance(second.query, names, second.state);
    expect(third.query).toBe("lumi");
  });

  it("cycles every name that started with the original query", () => {
    const first = tabCompleteAdvance("ta", repos, null);
    const seen: string[] = [];
    let step = first;
    for (let i = 0; i < 4; i += 1) {
      step = tabCompleteAdvance(step.query, repos, step.state);
      seen.push(step.query);
    }
    expect(seen).toEqual([
      "table-fuzzy-mine",
      "table-rotating-blah",
      "table-rotating-garden",
      "tableau-seven",
    ]);
  });
});
