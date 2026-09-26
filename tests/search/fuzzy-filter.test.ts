import { describe, expect, it } from "vitest";
import { fuzzyFilter, fuzzyScore } from "../../src/search/fuzzy-filter.js";

describe("fuzzyScore", () => {
  it("returns higher score for consecutive character matches", () => {
    expect(fuzzyScore("forest", "for")).toBeGreaterThan(fuzzyScore("fxoryst", "for"));
  });

  it("returns zero when query characters are missing", () => {
    expect(fuzzyScore("abc", "xyz")).toBe(0);
  });

  it("matches subsequence with typos allowed via gaps", () => {
    expect(fuzzyScore("forest-cli", "frst")).toBeGreaterThan(0);
  });
});

describe("fuzzyFilter", () => {
  const items = [
    { id: "1", label: "forest-cli" },
    { id: "2", label: "forest-app" },
    { id: "3", label: "backend-api" },
    { id: "4", label: "mobile-ios" },
  ];

  it("returns all items when query is empty", () => {
    expect(fuzzyFilter(items, "", (i) => i.label)).toHaveLength(4);
  });

  it("filters by name substring-style fuzzy match", () => {
    const result = fuzzyFilter(items, "forest", (i) => i.label);
    expect(result.map((i) => i.label)).toEqual(["forest-cli", "forest-app"]);
  });

  it("allows typo-tolerant matching", () => {
    const result = fuzzyFilter(items, "bakend", (i) => i.label);
    expect(result.map((i) => i.label)).toContain("backend-api");
  });

  it("sorts by score descending", () => {
    const result = fuzzyFilter(items, "for", (i) => i.label);
    expect(result[0]?.label).toMatch(/^forest/);
  });
});
