import { describe, expect, it } from "vitest";
import { parseGitHubOwnerFromConfig } from "../../src/config/parse-github-owner.js";
import { ConfigError } from "../../src/config/config-error.js";

describe("parseGitHubOwnerFromConfig", () => {
  it("parses a user owner", () => {
    expect(
      parseGitHubOwnerFromConfig({
        githubOwner: { kind: "user", login: "octocat" },
      }),
    ).toEqual({
      kind: "user",
      login: "octocat",
    });
  });

  it("parses an organization owner", () => {
    expect(
      parseGitHubOwnerFromConfig({
        githubOwner: { kind: "organization", login: "acme" },
      }),
    ).toEqual({
      kind: "organization",
      login: "acme",
    });
  });

  it("throws when no owner is configured", () => {
    expect(() => parseGitHubOwnerFromConfig({})).toThrow(ConfigError);
  });

  it("throws when kind is missing", () => {
    expect(() =>
      parseGitHubOwnerFromConfig({ githubOwner: { login: "octocat" } }),
    ).toThrow(ConfigError);
  });
});
