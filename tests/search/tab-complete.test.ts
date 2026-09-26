import { describe, expect, it } from "vitest";
import { tabCompleteAdvance } from "../../src/search/tab-complete.js";

function completeOnce(query: string, candidates: string[]): string {
  return tabCompleteAdvance(query, candidates, null).query;
}

describe("tabCompleteAdvance", () => {
  it("returns unchanged query when no candidates match", () => {
    expect(completeOnce("zzz", ["alpha", "beta"])).toBe("zzz");
  });

  it("completes to full name when exactly one match", () => {
    expect(completeOnce("back", ["backend-api", "forest-cli"])).toBe("backend-api");
  });

  it("completes to longest common prefix when multiple matches", () => {
    expect(completeOnce("forest", ["forest-cli", "forest-app"])).toBe("forest-");
  });

  it("does not shorten the query", () => {
    expect(completeOnce("forest-cli", ["forest-cli", "forest-app"])).toBe("forest-cli");
  });

  it("uses fuzzy matching for candidate set", () => {
    expect(completeOnce("frst", ["forest-cli", "mobile"])).toBe("forest-cli");
  });

  const repos = ["lumi", "luminark", "backend"];

  it("extends to common prefix on first tab", () => {
    const first = tabCompleteAdvance("lum", repos, null);
    expect(first.query).toBe("lumi");
    expect(first.state?.baseQuery).toBe("lum");
  });

  it("cycles to next match on second tab", () => {
    const first = tabCompleteAdvance("lum", repos, null);
    const second = tabCompleteAdvance(first.query, repos, first.state);
    expect(second.query).toBe("luminark");
  });

  it("cycles back on third tab", () => {
    let state = tabCompleteAdvance("lum", repos, null);
    state = tabCompleteAdvance(state.query, repos, state.state);
    const third = tabCompleteAdvance(state.query, repos, state.state);
    expect(third.query).toBe("lumi");
  });
});
