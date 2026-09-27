import { useState, type Dispatch, type SetStateAction } from 'react';
import type { RepositoryCatalogEntry, WorktreeEntry } from '../../domain/types';
import { cloneRepository } from '../../infrastructure/git/clone-repository';
import { convertLegacyRepository } from '../../infrastructure/git/convert-repository';
import { createWorktreeFromBare } from '../../infrastructure/git/create-worktree';
import { buildCloneUrl, detectGitProtocol } from '../../infrastructure/github/clone-url';
import { openInIdea } from '../../infrastructure/idea/open-in-idea';
import { popScreen, pushScreen, type ScreenState } from '../navigation/screen-stack';
import { useForest } from './useForest';
import { useRepositoryList } from './useRepositoryList';

const STACK_FLOOR = 1;

interface WorktreeCatalogActions {
  load: (repositoryName: string, repositoryPath: string) => Promise<void>;
  invalidate: () => void;
}

interface ForestOperationsOptions {
  setStack: Dispatch<SetStateAction<ScreenState[]>>;
  worktreeCatalog: WorktreeCatalogActions;
}

export function useForestOperations({ setStack, worktreeCatalog }: ForestOperationsOptions) {
  const { config, stateStore } = useForest();
  const repositoryList = useRepositoryList();
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [openingWorktreePath, setOpeningWorktreePath] = useState<string | null>(null);

  const appendProgress = (line: string) => {
    setProgressLines((lines) => [...lines.slice(-200), line]);
  };

  const runProgress = async (title: string, action: () => Promise<void>) => {
    setProgressLines([]);
    setStack((stack) => pushScreen(stack, { type: 'progress', title, message: '' }));
    try {
      await action();
    } catch (error) {
      appendProgress(error instanceof Error ? error.message : 'Operation failed');
    }
  };

  const openRepository = async (repository: RepositoryCatalogEntry) => {
    if (!repository.clonedLocally) {
      setStack((stack) =>
        pushScreen(stack, { type: 'confirm-clone', repositoryName: repository.name }),
      );
      return;
    }
    if (repository.structure === 'legacy' && repository.path) {
      setStack((stack) =>
        pushScreen(stack, {
          type: 'confirm-convert',
          repositoryName: repository.name,
          repositoryPath: repository.path!,
        }),
      );
      return;
    }

    await stateStore.touchRepository(repository.name);
    repositoryList.markOpened(repository.name);
    setStack((stack) =>
      pushScreen(stack, {
        type: 'worktrees',
        repositoryName: repository.name,
        repositoryPath: repository.path!,
      }),
    );
  };

  const clone = async (repositoryName: string) => {
    const cloneUrl = buildCloneUrl(config.githubOwner, repositoryName, await detectGitProtocol());
    await runProgress(`Cloning ${repositoryName}`, async () => {
      const result = await cloneRepository({
        root: config.root,
        repositoryName,
        cloneUrl,
        repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
        onOutput: appendProgress,
      });
      await stateStore.touchRepository(repositoryName);
      repositoryList.markCloned(repositoryName, result.repositoryDir);
      setStack((stack) => {
        const repositories = popScreen(popScreen(stack, STACK_FLOOR), STACK_FLOOR);
        return pushScreen(repositories, {
          type: 'worktrees',
          repositoryName,
          repositoryPath: result.repositoryDir,
        });
      });
      await worktreeCatalog.load(repositoryName, result.repositoryDir);
    });
  };

  const openLegacyWithoutConvert = async (repositoryName: string, repositoryPath: string) => {
    setStack((stack) => popScreen(stack, STACK_FLOOR));
    await stateStore.touchRepository(repositoryName);
    repositoryList.markOpened(repositoryName);
    await openInIdea(repositoryPath);
  };

  const convert = async (repositoryName: string, repositoryPath: string) => {
    const originUrl = buildCloneUrl(config.githubOwner, repositoryName, await detectGitProtocol());
    await runProgress(`Converting ${repositoryName}`, async () => {
      await convertLegacyRepository({
        repositoryPath,
        repositoryName,
        repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
        originUrl,
        onOutput: appendProgress,
      });
      repositoryList.markConverted(repositoryName);
      setStack((stack) => {
        const repositories = popScreen(popScreen(stack, STACK_FLOOR), STACK_FLOOR);
        return pushScreen(repositories, { type: 'worktrees', repositoryName, repositoryPath });
      });
      await worktreeCatalog.load(repositoryName, repositoryPath);
    });
  };

  const openWorktree = async (
    repositoryName: string,
    repositoryPath: string,
    worktree: WorktreeEntry,
  ) => {
    setOpeningWorktreePath(worktree.path);
    try {
      await stateStore.touchRepository(repositoryName);
      await stateStore.touchWorktree(worktree.path);
      await openInIdea(worktree.path);
      await worktreeCatalog.load(repositoryName, repositoryPath);
    } finally {
      setOpeningWorktreePath(null);
    }
  };

  const createWorktree = async (
    repositoryName: string,
    repositoryPath: string,
    newBranchName: string,
    baseBranch: string,
  ) => {
    worktreeCatalog.invalidate();
    await runProgress(`Creating ${newBranchName} from ${baseBranch}`, async () => {
      const result = await createWorktreeFromBare({
        repositoryPath,
        repositoryName,
        newBranchName,
        baseBranch,
        repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
        onOutput: appendProgress,
      });
      await stateStore.touchWorktree(result.worktreePath);
      setOpeningWorktreePath(result.worktreePath);
      setStack((stack) => popScreen(popScreen(stack, STACK_FLOOR), STACK_FLOOR));
      try {
        await openInIdea(result.worktreePath);
        await worktreeCatalog.load(repositoryName, repositoryPath);
      } finally {
        setOpeningWorktreePath(null);
      }
    });
  };

  return {
    repositories: repositoryList.repositories,
    githubListStatus: repositoryList.githubListStatus,
    progressLines,
    openingWorktreePath,
    openRepository,
    clone,
    openLegacyWithoutConvert,
    convert,
    openWorktree,
    createWorktree,
  };
}
