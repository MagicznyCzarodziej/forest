import { describe, expect, it } from "vitest";
import { detectStartContext } from "../../src/repos/detect-context.js";

describe("detectStartContext", () => {
  const root = "/Users/dev";

  it("starts at repo list when cwd is outside root", () => {
    expect(detectStartContext("/tmp", root, null)).toEqual({ screen: "repos" });
  });

  it("starts at worktrees when cwd is inside a repo under root", () => {
    expect(
      detectStartContext("/Users/dev/my-repo/src/lib", root, {
        repoName: "my-repo",
        repoPath: "/Users/dev/my-repo",
      }),
    ).toEqual({
      screen: "worktrees",
      repoName: "my-repo",
      repoPath: "/Users/dev/my-repo",
    });
  });

  it("starts at repo list when cwd is under root but not in a repo", () => {
    expect(detectStartContext("/Users/dev", root, null)).toEqual({ screen: "repos" });
  });

  it("treats cwd equal to root as repo list", () => {
    expect(detectStartContext(root, root, null)).toEqual({ screen: "repos" });
  });
});
