import { describe, expect, it } from "vitest";
import { listReposApiPath } from "../../src/github/repo-list-provider.js";

describe("listReposApiPath", () => {
  it("uses orgs endpoint for organizations", () => {
    expect(
      listReposApiPath({ kind: "organization", login: "acme" }),
    ).toBe("orgs/acme/repos");
  });

  it("uses users endpoint for users", () => {
    expect(
      listReposApiPath({ kind: "user", login: "octocat" }),
    ).toBe("users/octocat/repos");
  });
});
