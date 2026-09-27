import { useCallback, useState } from 'react';
import type { WorktreeEntry } from '../../../domain/types';
import { createWorktreeFromBare } from '../../../infrastructure/git/create-worktree';
import { openInIdea } from '../../../infrastructure/idea/open-in-idea';
import { popOverlayScreens } from '../../navigation/navigation';
import { useForest } from '../useForest';
import type { OperationDeps } from './types';

const STACK_FLOOR = 1;

export function useWorktreeOperations({
  setStack,
  runProgress,
  appendProgress,
  worktreeCatalog,
}: OperationDeps) {
  const { config, stateStore } = useForest();
  const [openingWorktreePath, setOpeningWorktreePath] = useState<string | null>(null);

  const openWorktree = useCallback(
    async (repositoryName: string, repositoryPath: string, worktree: WorktreeEntry) => {
      setOpeningWorktreePath(worktree.path);

      try {
        await stateStore.touchRepository(repositoryName);
        await stateStore.touchWorktree(worktree.path);
        await openInIdea(worktree.path);
        await worktreeCatalog.load(repositoryName, repositoryPath); // Trigger reload after updating last used time
      } finally {
        setOpeningWorktreePath(null);
      }
    },
    [stateStore, worktreeCatalog],
  );

  const createWorktree = useCallback(
    async (
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
        setStack((stack) => popOverlayScreens(stack, STACK_FLOOR));

        try {
          await openInIdea(result.worktreePath);
          await worktreeCatalog.load(repositoryName, repositoryPath);
        } finally {
          setOpeningWorktreePath(null);
        }
      });
    },
    [
      appendProgress,
      config.repositoryWorktreeSeparator,
      runProgress,
      setStack,
      stateStore,
      worktreeCatalog,
    ],
  );

  return {
    openingWorktreePath,
    openWorktree,
    createWorktree,
  };
}
