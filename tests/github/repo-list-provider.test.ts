import { describe, expect, it } from "vitest";
import { parseRepoNameLines, repoNamesGraphql } from "../../src/github/repo-list-provider.js";

describe("repoNamesGraphql", () => {
  it("pages organization repository names", () => {
    const { query, jq } = repoNamesGraphql({ kind: "organization", login: "acme" });
    expect(query).toContain("organization(login: $login)");
    expect(query).toContain("repositories(first: 100, after: $endCursor");
    expect(query).toContain("nodes { name }");
    expect(query).toContain("pageInfo { hasNextPage endCursor }");
    expect(query).not.toContain("acme");
    expect(jq).toBe(".data.organization.repositories.nodes[] | select(. != null) | .name");
  });

  it("pages user repository names", () => {
    const { query, jq } = repoNamesGraphql({ kind: "user", login: "octocat" });
    expect(query).toContain("user(login: $login)");
    expect(query).not.toContain("octocat");
    expect(jq).toBe(".data.user.repositories.nodes[] | select(. != null) | .name");
  });
});

describe("parseRepoNameLines", () => {
  it("drops blank lines", () => {
    expect(parseRepoNameLines("alpha\n\nbeta\n")).toEqual(["alpha", "beta"]);
  });
});
