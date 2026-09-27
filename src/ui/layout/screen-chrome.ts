import type { ScreenState } from "../../navigation/screen-stack.js";

export function reposSubtitle(githubList: "ready" | "loading" | "error"): string {
  if (githubList === "loading") {
    return "Repositories · Loading from GitHub…";
  }
  if (githubList === "error") {
    return "Repositories · Could not load GitHub repositories";
  }
  return "Repositories";
}

export function screenSubtitle(screen: ScreenState): string {
  switch (screen.type) {
    case "repos":
      return reposSubtitle("ready");
    case "worktrees":
      return `${screen.repoName} · Worktrees`;
    case "branches":
      return `${screen.repoName} · Create ${screen.newBranchName} from a branch`;
    case "confirm-clone":
      return "Clone repository";
    case "confirm-convert":
      return "Convert layout";
    case "progress":
      return screen.title;
    default:
      return "";
  }
}

export function screenFooter(screen: ScreenState): string | undefined {
  if (screen.type === "confirm-clone" || screen.type === "confirm-convert") {
    return "←→ choose · Y/N · Enter confirm · Esc cancel";
  }
  if (screen.type === "progress") {
    return "Working…";
  }
  return undefined;
}
