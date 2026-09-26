import type { GitHubOwner, GitHubOwnerKind } from "../domain/github-owner.js";
import { ConfigError } from "./config-error.js";

function parseKind(value: unknown): GitHubOwnerKind {
  if (value === "organization") {
    return "organization";
  }
  if (value === "user") {
    return "user";
  }
  throw new ConfigError('githubOwner.kind must be "organization" or "user"');
}

export function parseGitHubOwnerFromConfig(parsed: Record<string, unknown>): GitHubOwner {
  const githubOwner = parsed.githubOwner;
  if (!githubOwner || typeof githubOwner !== "object") {
    throw new ConfigError('Config must include "githubOwner": { kind, login }');
  }

  const record = githubOwner as Record<string, unknown>;
  if (typeof record.login !== "string" || !record.login.trim()) {
    throw new ConfigError('githubOwner.login must be a non-empty string');
  }

  return {
    kind: parseKind(record.kind),
    login: record.login.trim(),
  };
}
