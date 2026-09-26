import { describe, expect, it } from "vitest";
import { buildCloneUrl } from "../../src/github/clone-url.js";

describe("buildCloneUrl", () => {
  it("builds ssh url from owner login regardless of kind", () => {
    expect(buildCloneUrl({ kind: "user", login: "octocat" }, "hello")).toBe(
      "git@github.com:octocat/hello.git",
    );
    expect(buildCloneUrl({ kind: "organization", login: "acme" }, "app")).toBe(
      "git@github.com:acme/app.git",
    );
  });
});
