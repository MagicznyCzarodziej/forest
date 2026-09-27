import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Text, useInput } from "ink";
import { FullscreenShell } from "./layout/FullscreenShell.js";
import { reposSubtitle, screenFooter, screenSubtitle } from "./layout/screen-chrome.js";
import type { BootstrapResult } from "../application/bootstrap.js";
import type { RepoCatalogEntry, WorktreeEntry } from "../domain/types.js";
import { buildCloneUrl, detectGitProtocol } from "../github/clone-url.js";
import { cloneRepository } from "../git/clone-repository.js";
import { convertLegacyRepository } from "../git/convert-repository.js";
import { createWorktreeFromBare } from "../git/create-worktree.js";
import { DEFAULT_BRANCH, detectDefaultBranchFromBare } from "../git/default-branch.js";
import { bareRepoPath } from "../repos/repo-structure.js";
import { openInIdea } from "../idea/open-in-idea.js";
import { popScreen, pushScreen, currentScreen, type ScreenState } from "../navigation/screen-stack.js";
import { buildRepoCatalog } from "../repos/repo-catalog.js";
import { buildWorktreeList } from "../worktrees/worktree-catalog.js";
import { listRemoteBranches, scanWorktrees } from "../worktrees/scan-worktrees.js";
import { sortBranches } from "../branches/branch-picker.js";
import { RepoPickerScreen } from "./screens/RepoPickerScreen.js";
import { WorktreePickerScreen } from "./screens/WorktreePickerScreen.js";
import { BranchPickerScreen } from "./screens/BranchPickerScreen.js";
import { ConfirmPrompt } from "./components/ConfirmPrompt.js";
import { ProgressView } from "./components/ProgressView.js";

interface ForestAppProps {
  bootstrap: BootstrapResult;
}

function initialStack(start: BootstrapResult["startContext"]): ScreenState[] {
  if (start.screen === "worktrees") {
    return [{ type: "worktrees", repoName: start.repoName, repoPath: start.repoPath }];
  }
  return [{ type: "repos" }];
}

export function ForestApp({ bootstrap }: ForestAppProps) {
  const [stack, setStack] = useState<ScreenState[]>(() => initialStack(bootstrap.startContext));
  const [repos, setRepos] = useState(bootstrap.repos);
  const [worktrees, setWorktrees] = useState<WorktreeEntry[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [catalogRepoPath, setCatalogRepoPath] = useState<string | null>(null);
  const catalogRequest = useRef(0);
  const [confirmChoice, setConfirmChoice] = useState<"yes" | "no">("yes");
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [openingWorktreePath, setOpeningWorktreePath] = useState<string | null>(null);
  const [githubList, setGithubList] = useState<"ready" | "loading" | "error">(
    bootstrap.remoteListFresh ? "ready" : "loading",
  );

  useEffect(() => {
    if (bootstrap.remoteListFresh) {
      return;
    }
    let cancelled = false;
    void bootstrap
      .refreshRemoteRepos()
      .then((remoteRepoNames) => {
        if (cancelled) {
          return;
        }
        setRepos(buildRepoCatalog({ remoteRepoNames, localRepos: bootstrap.localRepos }));
        setGithubList("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setGithubList("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  const screen = currentScreen(stack);
  const stackFloor = 1;

  const appendProgress = (line: string) => {
    setProgressLines((lines) => [...lines.slice(-200), line]);
  };

  const refreshWorktrees = useCallback(
    async (repoName: string, repoPath: string) => {
      const raw = await scanWorktrees(
        repoPath,
        repoName,
        bootstrap.stateStore,
        bootstrap.config.repoSlugSeparator,
      );
      const remote = await listRemoteBranches(repoPath, true);
      let defaultBr = DEFAULT_BRANCH;
      try {
        defaultBr = await detectDefaultBranchFromBare(bareRepoPath(repoPath));
      } catch {
        defaultBr = remote.includes(DEFAULT_BRANCH) ? DEFAULT_BRANCH : remote[0] ?? DEFAULT_BRANCH;
      }
      const nextWorktrees = buildWorktreeList({
        repoName,
        defaultBranch: defaultBr,
        worktrees: raw,
      });
      return {
        worktrees: nextWorktrees,
        branches: sortBranches(remote, defaultBr),
      };
    },
    [bootstrap.stateStore],
  );

  const loadRepoCatalog = useCallback(
    async (repoName: string, repoPath: string) => {
      const request = ++catalogRequest.current;
      const catalog = await refreshWorktrees(repoName, repoPath);
      if (request !== catalogRequest.current) {
        return;
      }
      setWorktrees(catalog.worktrees);
      setBranches(catalog.branches);
      setCatalogRepoPath(repoPath);
    },
    [refreshWorktrees],
  );

  const catalogRepoName =
    screen.type === "worktrees" || screen.type === "branches" ? screen.repoName : "";
  const catalogScreenPath =
    screen.type === "worktrees" || screen.type === "branches" ? screen.repoPath : "";
  const catalogReady = catalogScreenPath !== "" && catalogRepoPath === catalogScreenPath;

  useEffect(() => {
    if (!catalogRepoName || !catalogScreenPath) {
      return;
    }
    void loadRepoCatalog(catalogRepoName, catalogScreenPath);
  }, [catalogRepoName, catalogScreenPath, loadRepoCatalog]);

  const goBack = () => setStack((s) => popScreen(s, stackFloor));

  const runProgress = async (title: string, action: () => Promise<void>) => {
    setProgressLines([]);
    setStack((s) => pushScreen(s, { type: "progress", title, message: "" }));
    try {
      await action();
    } catch (error) {
      appendProgress(error instanceof Error ? error.message : "Operation failed");
    }
  };

  const openRepoFlow = async (repo: RepoCatalogEntry) => {
    if (!repo.clonedLocally) {
      setStack((s) => pushScreen(s, { type: "confirm-clone", repoName: repo.name }));
      return;
    }
    if (repo.structure === "legacy" && repo.path) {
      setStack((s) =>
        pushScreen(s, { type: "confirm-convert", repoName: repo.name, repoPath: repo.path! }),
      );
      return;
    }
    await bootstrap.stateStore.touchRepo(repo.name);
    setRepos((list) =>
      list.map((r) =>
        r.name === repo.name ? { ...r, lastOpenedAt: Date.now() } : r,
      ),
    );
    setStack((s) =>
      pushScreen(s, { type: "worktrees", repoName: repo.name, repoPath: repo.path! }),
    );
  };

  const handleClone = async (repoName: string) => {
    const cloneUrl = buildCloneUrl(
      bootstrap.config.githubOwner,
      repoName,
      await detectGitProtocol(),
    );
    await runProgress(`Cloning ${repoName}`, async () => {
      const result = await cloneRepository({
        root: bootstrap.config.root,
        repoName,
        cloneUrl,
        repoSlugSeparator: bootstrap.config.repoSlugSeparator,
        onOutput: appendProgress,
      });
      await bootstrap.stateStore.touchRepo(repoName);
      setRepos((list) =>
        list.map((r) =>
          r.name === repoName
            ? {
                ...r,
                clonedLocally: true,
                structure: "standard",
                path: result.repoDir,
                lastOpenedAt: Date.now(),
              }
            : r,
        ),
      );
      setStack((s) => {
        let next = popScreen(s, stackFloor);
        next = popScreen(next, stackFloor);
        return pushScreen(next, {
          type: "worktrees",
          repoName,
          repoPath: result.repoDir,
        });
      });
      await loadRepoCatalog(repoName, result.repoDir);
    });
  };

  const handleOpenLegacyWithoutConvert = async (repoName: string, repoPath: string) => {
    setStack((s) => popScreen(s, stackFloor));
    await bootstrap.stateStore.touchRepo(repoName);
    setRepos((list) =>
      list.map((r) =>
        r.name === repoName ? { ...r, lastOpenedAt: Date.now() } : r,
      ),
    );
    await openInIdea(repoPath);
  };

  const handleConvert = async (repoName: string, repoPath: string) => {
    const originUrl = buildCloneUrl(
      bootstrap.config.githubOwner,
      repoName,
      await detectGitProtocol(),
    );
    await runProgress(`Converting ${repoName}`, async () => {
      await convertLegacyRepository({
        repoPath,
        repoName,
        repoSlugSeparator: bootstrap.config.repoSlugSeparator,
        originUrl,
        onOutput: appendProgress,
      });
      setRepos((list) =>
        list.map((r) =>
          r.name === repoName ? { ...r, structure: "standard" } : r,
        ),
      );
      setStack((s) => {
        let next = popScreen(s, stackFloor);
        next = popScreen(next, stackFloor);
        return pushScreen(next, { type: "worktrees", repoName, repoPath });
      });
      await loadRepoCatalog(repoName, repoPath);
    });
  };

  const handleOpenWorktree = async (
    repoName: string,
    repoPath: string,
    worktree: WorktreeEntry,
  ) => {
    setOpeningWorktreePath(worktree.path);
    try {
      await bootstrap.stateStore.touchRepo(repoName);
      await bootstrap.stateStore.touchWorktree(worktree.path);
      await openInIdea(worktree.path);
      await loadRepoCatalog(repoName, repoPath);
    } finally {
      setOpeningWorktreePath(null);
    }
  };

  const handleCreateWorktree = async (
    repoName: string,
    repoPath: string,
    newBranchName: string,
    baseBranch: string,
  ) => {
    catalogRequest.current += 1;
    setCatalogRepoPath(null);
    await runProgress(`Creating ${newBranchName} from ${baseBranch}`, async () => {
      const result = await createWorktreeFromBare({
        repoPath,
        repoName,
        newBranchName,
        baseBranch,
        repoSlugSeparator: bootstrap.config.repoSlugSeparator,
        onOutput: appendProgress,
      });
      await bootstrap.stateStore.touchWorktree(result.worktreePath);
      setOpeningWorktreePath(result.worktreePath);
      setStack((s) => popScreen(popScreen(s, stackFloor), stackFloor));
      try {
        await openInIdea(result.worktreePath);
        await loadRepoCatalog(repoName, repoPath);
      } finally {
        setOpeningWorktreePath(null);
      }
    });
  };

  useInput((input, key) => {
    const current = currentScreen(stack);
    if (current.type === "confirm-clone" || current.type === "confirm-convert") {
      if (key.leftArrow || key.rightArrow || key.tab) {
        setConfirmChoice((c) => (c === "yes" ? "no" : "yes"));
      }
      if (input.toLowerCase() === "y") setConfirmChoice("yes");
      if (input.toLowerCase() === "n") setConfirmChoice("no");
      if (key.escape) {
        setStack((s) => popScreen(s, stackFloor));
        return;
      }
      if (key.return) {
        if (confirmChoice === "no") {
          if (current.type === "confirm-convert") {
            void handleOpenLegacyWithoutConvert(current.repoName, current.repoPath);
          } else {
            setStack((s) => popScreen(s, stackFloor));
          }
          return;
        }
        if (current.type === "confirm-clone") {
          void handleClone(current.repoName);
        } else {
          void handleConvert(current.repoName, current.repoPath);
        }
      }
    }
  });

  let content: ReactNode;

  if (screen.type === "repos") {
    content = (
      <RepoPickerScreen
        repos={repos}
        onSelect={(repo) => void openRepoFlow(repo)}
        onEscape={goBack}
        emptyMessage={githubList === "loading" ? "Loading from GitHub…" : undefined}
      />
    );
  } else if (screen.type === "worktrees") {
    content = (
      <WorktreePickerScreen
        key={screen.repoPath}
        worktrees={catalogReady ? worktrees : []}
        openingWorktreePath={openingWorktreePath}
        onOpenWorktree={(wt) =>
          void handleOpenWorktree(screen.repoName, screen.repoPath, wt)
        }
        onCreateFromQuery={(newBranchName) =>
          setStack((s) =>
            pushScreen(s, {
              type: "branches",
              repoName: screen.repoName,
              repoPath: screen.repoPath,
              newBranchName,
            }),
          )
        }
        onEscape={goBack}
        emptyMessage={catalogReady ? "No matching worktrees — Enter to create one" : "Loading…"}
      />
    );
  } else if (screen.type === "branches") {
    content = (
      <BranchPickerScreen
        key={`${screen.repoPath}\0${screen.newBranchName}`}
        branches={catalogReady ? branches : []}
        initialQuery=""
        emptyMessage={catalogReady ? "No matching branches" : "Loading…"}
        onSelectBranch={(baseBranch) =>
          void handleCreateWorktree(
            screen.repoName,
            screen.repoPath,
            screen.newBranchName,
            baseBranch,
          )
        }
        onEscape={goBack}
      />
    );
  } else if (screen.type === "confirm-clone") {
    content = (
      <ConfirmPrompt
        title={`Clone ${screen.repoName}?`}
        message="This repository is not on disk yet."
        selected={confirmChoice}
      />
    );
  } else if (screen.type === "confirm-convert") {
    content = (
      <ConfirmPrompt
        title={`Convert ${screen.repoName}?`}
        message="Legacy layout detected. Convert to .bare + worktrees structure?"
        selected={confirmChoice}
      />
    );
  } else if (screen.type === "progress") {
    content = <ProgressView title={screen.title} lines={progressLines} />;
  } else {
    content = <Text>Unknown screen</Text>;
  }

  const footer = screenFooter(screen);

  return (
    <FullscreenShell
      subtitle={screen.type === "repos" ? reposSubtitle(githubList) : screenSubtitle(screen)}
      footer={footer ?? undefined}
    >
      {content}
    </FullscreenShell>
  );
}
