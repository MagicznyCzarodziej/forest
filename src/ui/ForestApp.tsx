import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Text, useInput } from 'ink';
import { FullscreenShell } from './layout/FullscreenShell';
import { repositoriesSubtitle, screenFooter, screenSubtitle } from './layout/screen-chrome';
import type { BootstrapResult } from '../application/bootstrap';
import type { RepositoryCatalogEntry, WorktreeEntry } from '../domain/types';
import { buildCloneUrl, detectGitProtocol } from '../github/clone-url';
import { cloneRepository } from '../git/clone-repository';
import { convertLegacyRepository } from '../git/convert-repository';
import { createWorktreeFromBare } from '../git/create-worktree';
import { DEFAULT_BRANCH, detectDefaultBranchFromBare } from '../git/default-branch';
import { bareRepositoryPath } from '../repositories/repository-structure';
import { openInIdea } from '../idea/open-in-idea';
import { popScreen, pushScreen, currentScreen, type ScreenState } from '../navigation/screen-stack';
import { buildRepositoryCatalog } from '../repositories/repository-catalog';
import { buildWorktreeList } from '../worktrees/worktree-catalog';
import { listRemoteBranches, scanWorktrees } from '../worktrees/scan-worktrees';
import { sortBranches } from '../branches/branch-picker';
import { RepositoryPickerScreen } from './screens/RepositoryPickerScreen';
import { WorktreePickerScreen } from './screens/WorktreePickerScreen';
import { BranchPickerScreen } from './screens/BranchPickerScreen';
import { ConfirmPrompt } from './components/ConfirmPrompt';
import { ProgressView } from './components/ProgressView';

interface ForestAppProps {
  bootstrap: BootstrapResult;
}

function initialStack(start: BootstrapResult['startContext']): ScreenState[] {
  if (start.screen === 'worktrees') {
    return [
      { type: 'repositories' },
      {
        type: 'worktrees',
        repositoryName: start.repositoryName,
        repositoryPath: start.repositoryPath,
      },
    ];
  }
  return [{ type: 'repositories' }];
}

export function ForestApp({ bootstrap }: ForestAppProps) {
  const [stack, setStack] = useState<ScreenState[]>(() => initialStack(bootstrap.startContext));
  const [repositories, setRepositories] = useState(bootstrap.repositories);
  const [worktrees, setWorktrees] = useState<WorktreeEntry[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [catalogRepositoryPath, setCatalogRepositoryPath] = useState<string | null>(null);
  const catalogRequestRef = useRef(0);
  const [confirmChoice, setConfirmChoice] = useState<'yes' | 'no'>('yes');
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [openingWorktreePath, setOpeningWorktreePath] = useState<string | null>(null);
  const [githubList, setGithubList] = useState<'ready' | 'loading' | 'error'>(
    bootstrap.remoteListFresh ? 'ready' : 'loading',
  );

  useEffect(() => {
    if (bootstrap.remoteListFresh) {
      return;
    }
    let cancelled = false;
    void bootstrap
      .refreshRemoteRepositories()
      .then((remoteRepositoryNames) => {
        if (cancelled) {
          return;
        }
        setRepositories(buildRepositoryCatalog(remoteRepositoryNames, bootstrap.localRepositories));
        setGithubList('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setGithubList('error');
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
    async (repositoryName: string, repositoryPath: string) => {
      const raw = await scanWorktrees(
        repositoryPath,
        repositoryName,
        bootstrap.stateStore,
        bootstrap.config.repositoryWorktreeSeparator,
      );
      const remote = await listRemoteBranches(repositoryPath, true);
      let defaultBr: string;
      try {
        defaultBr = await detectDefaultBranchFromBare(bareRepositoryPath(repositoryPath));
      } catch {
        defaultBr = remote.includes(DEFAULT_BRANCH)
          ? DEFAULT_BRANCH
          : (remote[0] ?? DEFAULT_BRANCH);
      }
      const nextWorktrees = buildWorktreeList({
        repositoryName,
        defaultBranch: defaultBr,
        worktrees: raw,
      });
      return {
        worktrees: nextWorktrees,
        branches: sortBranches(remote, defaultBr),
      };
    },
    [bootstrap.config.repositoryWorktreeSeparator, bootstrap.stateStore],
  );

  const loadRepositoryCatalog = useCallback(
    async (repositoryName: string, repositoryPath: string) => {
      const request = ++catalogRequestRef.current;
      const catalog = await refreshWorktrees(repositoryName, repositoryPath);
      if (request !== catalogRequestRef.current) {
        return;
      }
      setWorktrees(catalog.worktrees);
      setBranches(catalog.branches);
      setCatalogRepositoryPath(repositoryPath);
    },
    [refreshWorktrees],
  );

  const catalogRepositoryName =
    screen.type === 'worktrees' || screen.type === 'branches' ? screen.repositoryName : '';
  const catalogScreenPath =
    screen.type === 'worktrees' || screen.type === 'branches' ? screen.repositoryPath : '';
  const catalogReady = catalogScreenPath !== '' && catalogRepositoryPath === catalogScreenPath;

  useEffect(() => {
    if (!catalogRepositoryName || !catalogScreenPath) {
      return;
    }
    void loadRepositoryCatalog(catalogRepositoryName, catalogScreenPath);
  }, [catalogRepositoryName, catalogScreenPath, loadRepositoryCatalog]);

  const goBack = () => setStack((s) => popScreen(s, stackFloor));

  const runProgress = async (title: string, action: () => Promise<void>) => {
    setProgressLines([]);
    setStack((s) => pushScreen(s, { type: 'progress', title, message: '' }));
    try {
      await action();
    } catch (error) {
      appendProgress(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const openRepositoryFlow = async (repository: RepositoryCatalogEntry) => {
    if (!repository.clonedLocally) {
      setStack((s) => pushScreen(s, { type: 'confirm-clone', repositoryName: repository.name }));
      return;
    }
    if (repository.structure === 'legacy' && repository.path) {
      setStack((s) =>
        pushScreen(s, {
          type: 'confirm-convert',
          repositoryName: repository.name,
          repositoryPath: repository.path!,
        }),
      );
      return;
    }
    await bootstrap.stateStore.touchRepository(repository.name);
    setRepositories((list) =>
      list.map((r) => (r.name === repository.name ? { ...r, lastOpenedAt: Date.now() } : r)),
    );
    setStack((s) =>
      pushScreen(s, {
        type: 'worktrees',
        repositoryName: repository.name,
        repositoryPath: repository.path!,
      }),
    );
  };

  const handleClone = async (repositoryName: string) => {
    const cloneUrl = buildCloneUrl(
      bootstrap.config.githubOwner,
      repositoryName,
      await detectGitProtocol(),
    );
    await runProgress(`Cloning ${repositoryName}`, async () => {
      const result = await cloneRepository({
        root: bootstrap.config.root,
        repositoryName,
        cloneUrl,
        repositoryWorktreeSeparator: bootstrap.config.repositoryWorktreeSeparator,
        onOutput: appendProgress,
      });
      await bootstrap.stateStore.touchRepository(repositoryName);
      setRepositories((list) =>
        list.map((r) =>
          r.name === repositoryName
            ? {
                ...r,
                clonedLocally: true,
                structure: 'standard',
                path: result.repositoryDir,
                lastOpenedAt: Date.now(),
              }
            : r,
        ),
      );
      setStack((s) => {
        let next = popScreen(s, stackFloor);
        next = popScreen(next, stackFloor);
        return pushScreen(next, {
          type: 'worktrees',
          repositoryName,
          repositoryPath: result.repositoryDir,
        });
      });
      await loadRepositoryCatalog(repositoryName, result.repositoryDir);
    });
  };

  const handleOpenLegacyWithoutConvert = async (repositoryName: string, repositoryPath: string) => {
    setStack((s) => popScreen(s, stackFloor));
    await bootstrap.stateStore.touchRepository(repositoryName);
    setRepositories((list) =>
      list.map((r) => (r.name === repositoryName ? { ...r, lastOpenedAt: Date.now() } : r)),
    );
    await openInIdea(repositoryPath);
  };

  const handleConvert = async (repositoryName: string, repositoryPath: string) => {
    const originUrl = buildCloneUrl(
      bootstrap.config.githubOwner,
      repositoryName,
      await detectGitProtocol(),
    );
    await runProgress(`Converting ${repositoryName}`, async () => {
      await convertLegacyRepository({
        repositoryPath,
        repositoryName,
        repositoryWorktreeSeparator: bootstrap.config.repositoryWorktreeSeparator,
        originUrl,
        onOutput: appendProgress,
      });
      setRepositories((list) =>
        list.map((r) => (r.name === repositoryName ? { ...r, structure: 'standard' } : r)),
      );
      setStack((s) => {
        let next = popScreen(s, stackFloor);
        next = popScreen(next, stackFloor);
        return pushScreen(next, { type: 'worktrees', repositoryName, repositoryPath });
      });
      await loadRepositoryCatalog(repositoryName, repositoryPath);
    });
  };

  const handleOpenWorktree = async (
    repositoryName: string,
    repositoryPath: string,
    worktree: WorktreeEntry,
  ) => {
    setOpeningWorktreePath(worktree.path);
    try {
      await bootstrap.stateStore.touchRepository(repositoryName);
      await bootstrap.stateStore.touchWorktree(worktree.path);
      await openInIdea(worktree.path);
      await loadRepositoryCatalog(repositoryName, repositoryPath);
    } finally {
      setOpeningWorktreePath(null);
    }
  };

  const handleCreateWorktree = async (
    repositoryName: string,
    repositoryPath: string,
    newBranchName: string,
    baseBranch: string,
  ) => {
    catalogRequestRef.current += 1;
    setCatalogRepositoryPath(null);
    await runProgress(`Creating ${newBranchName} from ${baseBranch}`, async () => {
      const result = await createWorktreeFromBare({
        repositoryPath,
        repositoryName,
        newBranchName,
        baseBranch,
        repositoryWorktreeSeparator: bootstrap.config.repositoryWorktreeSeparator,
        onOutput: appendProgress,
      });
      await bootstrap.stateStore.touchWorktree(result.worktreePath);
      setOpeningWorktreePath(result.worktreePath);
      setStack((s) => popScreen(popScreen(s, stackFloor), stackFloor));
      try {
        await openInIdea(result.worktreePath);
        await loadRepositoryCatalog(repositoryName, repositoryPath);
      } finally {
        setOpeningWorktreePath(null);
      }
    });
  };

  const confirmInputActive = screen.type === 'confirm-clone' || screen.type === 'confirm-convert';

  useInput(
    (input, key) => {
      const current = currentScreen(stack);
      if (current.type === 'confirm-clone' || current.type === 'confirm-convert') {
        if (key.leftArrow || key.rightArrow || key.tab) {
          setConfirmChoice((c) => (c === 'yes' ? 'no' : 'yes'));
        }
        if (input.toLowerCase() === 'y') setConfirmChoice('yes');
        if (input.toLowerCase() === 'n') setConfirmChoice('no');
        if (key.escape) {
          setStack((s) => popScreen(s, stackFloor));
          return;
        }
        if (key.return) {
          if (confirmChoice === 'no') {
            if (current.type === 'confirm-convert') {
              void handleOpenLegacyWithoutConvert(current.repositoryName, current.repositoryPath);
            } else {
              setStack((s) => popScreen(s, stackFloor));
            }
            return;
          }
          if (current.type === 'confirm-clone') {
            void handleClone(current.repositoryName);
          } else {
            void handleConvert(current.repositoryName, current.repositoryPath);
          }
        }
      }
    },
    { isActive: confirmInputActive },
  );

  let content: ReactNode;

  if (screen.type === 'repositories') {
    content = (
      <RepositoryPickerScreen
        repositories={repositories}
        onSelect={(repository) => void openRepositoryFlow(repository)}
        onEscape={goBack}
        emptyMessage={githubList === 'loading' ? 'Loading from GitHub…' : undefined}
      />
    );
  } else if (screen.type === 'worktrees') {
    content = (
      <WorktreePickerScreen
        key={screen.repositoryPath}
        worktrees={catalogReady ? worktrees : []}
        openingWorktreePath={openingWorktreePath}
        onOpenWorktree={(wt) =>
          void handleOpenWorktree(screen.repositoryName, screen.repositoryPath, wt)
        }
        onCreateFromQuery={(newBranchName) =>
          setStack((s) =>
            pushScreen(s, {
              type: 'branches',
              repositoryName: screen.repositoryName,
              repositoryPath: screen.repositoryPath,
              newBranchName,
            }),
          )
        }
        onEscape={goBack}
        emptyMessage={catalogReady ? 'No matching worktrees — Enter to create one' : 'Loading…'}
      />
    );
  } else if (screen.type === 'branches') {
    content = (
      <BranchPickerScreen
        key={`${screen.repositoryPath}\0${screen.newBranchName}`}
        branches={catalogReady ? branches : []}
        initialQuery=""
        emptyMessage={catalogReady ? 'No matching branches' : 'Loading…'}
        onSelectBranch={(baseBranch) =>
          void handleCreateWorktree(
            screen.repositoryName,
            screen.repositoryPath,
            screen.newBranchName,
            baseBranch,
          )
        }
        onEscape={goBack}
      />
    );
  } else if (screen.type === 'confirm-clone') {
    content = (
      <ConfirmPrompt
        title={`Clone ${screen.repositoryName}?`}
        message="This repository is not on disk yet."
        selected={confirmChoice}
      />
    );
  } else if (screen.type === 'confirm-convert') {
    content = (
      <ConfirmPrompt
        title={`Convert ${screen.repositoryName}?`}
        message="Legacy layout detected. Convert to .bare + worktrees structure?"
        selected={confirmChoice}
      />
    );
  } else if (screen.type === 'progress') {
    content = <ProgressView title={screen.title} lines={progressLines} />;
  } else {
    content = <Text>Unknown screen</Text>;
  }

  const footer = screenFooter(screen);

  return (
    <FullscreenShell
      subtitle={
        screen.type === 'repositories' ? repositoriesSubtitle(githubList) : screenSubtitle(screen)
      }
      footer={footer ?? undefined}
    >
      {content}
    </FullscreenShell>
  );
}
