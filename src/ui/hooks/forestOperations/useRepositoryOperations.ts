import { useCallback } from 'react';
import type { RepositoryCatalogEntry } from '../../../domain/types';
import { cloneRepository } from '../../../infrastructure/git/clone-repository';
import { convertLegacyRepository } from '../../../infrastructure/git/convert-repository';
import { buildCloneUrl, detectGitProtocol } from '../../../infrastructure/github/clone-url';
import { gitHubRepositoryExists } from '../../../infrastructure/github/repository-exists';
import { openInIdea } from '../../../infrastructure/idea/openInIdea';
import {
  finishConfirmFlowToWorktrees,
  popOverlayScreens,
  popScreen,
  pushScreen,
} from '../../navigation/navigation';
import { useForest } from '../useForest';
import type { OperationDeps } from './types';

const STACK_FLOOR = 1;

function pushMessageScreen(setStack: OperationDeps['setStack'], title: string, body: string): void {
  setStack((stack) =>
    pushScreen(popOverlayScreens(stack, STACK_FLOOR), { type: 'message', title, body }),
  );
}

export function useRepositoryOperations({
  setStack,
  runProgress,
  appendProgress,
  repositoryList,
  worktreeCatalog,
}: OperationDeps) {
  const { config, stateStore } = useForest();

  const openRepository = useCallback(
    async (repository: RepositoryCatalogEntry) => {
      if (!repository.clonedLocally) {
        const check = await runProgress(`Checking ${repository.name}`, async () => {
          const exists = await gitHubRepositoryExists(config.githubOwner, repository.name);
          if (!exists) {
            throw new Error(
              `Repository ${config.githubOwner.login}/${repository.name} was not found on GitHub.`,
            );
          }
        });

        if (!check.success) {
          pushMessageScreen(
            setStack,
            'Repository unavailable',
            check.error ?? 'Could not verify repository.',
          );
          return;
        }

        setStack((stack) =>
          pushScreen(popScreen(stack), {
            type: 'confirm-clone',
            repositoryName: repository.name,
          }),
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
    },
    [config.githubOwner, repositoryList, runProgress, setStack, stateStore],
  );

  const clone = useCallback(
    async (repositoryName: string) => {
      const cloneUrl = buildCloneUrl(config.githubOwner, repositoryName, await detectGitProtocol());
      const result = await runProgress(`Cloning ${repositoryName}`, async () => {
        const cloneResult = await cloneRepository({
          root: config.root,
          repositoryName,
          cloneUrl,
          repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
          onOutput: appendProgress,
        });
        await stateStore.touchRepository(repositoryName);
        repositoryList.markCloned(repositoryName, cloneResult.repositoryDir);
        setStack((stack) =>
          finishConfirmFlowToWorktrees(
            stack,
            repositoryName,
            cloneResult.repositoryDir,
            STACK_FLOOR,
          ),
        );
        await worktreeCatalog.load(repositoryName, cloneResult.repositoryDir);
      });

      if (!result.success) {
        pushMessageScreen(
          setStack,
          `Could not clone ${repositoryName}`,
          result.error ?? 'Clone failed.',
        );
      }
    },
    [
      appendProgress,
      config.githubOwner,
      config.repositoryWorktreeSeparator,
      config.root,
      repositoryList,
      runProgress,
      setStack,
      stateStore,
      worktreeCatalog,
    ],
  );

  const openLegacyWithoutConvert = useCallback(
    async (repositoryName: string, repositoryPath: string) => {
      setStack((stack) => popScreen(stack, STACK_FLOOR));
      await stateStore.touchRepository(repositoryName);
      repositoryList.markOpened(repositoryName);
      await openInIdea(repositoryPath);
    },
    [repositoryList, setStack, stateStore],
  );

  const convert = useCallback(
    async (repositoryName: string, repositoryPath: string) => {
      const originUrl = buildCloneUrl(
        config.githubOwner,
        repositoryName,
        await detectGitProtocol(),
      );
      await runProgress(`Converting ${repositoryName}`, async () => {
        await convertLegacyRepository({
          repositoryPath,
          repositoryName,
          repositoryWorktreeSeparator: config.repositoryWorktreeSeparator,
          originUrl,
          onOutput: appendProgress,
        });
        repositoryList.markConverted(repositoryName);
        setStack((stack) =>
          finishConfirmFlowToWorktrees(stack, repositoryName, repositoryPath, STACK_FLOOR),
        );
        await worktreeCatalog.load(repositoryName, repositoryPath);
      });
    },
    [
      appendProgress,
      config.githubOwner,
      config.repositoryWorktreeSeparator,
      repositoryList,
      runProgress,
      setStack,
      worktreeCatalog,
    ],
  );

  return {
    openRepository,
    clone,
    openLegacyWithoutConvert,
    convert,
  };
}
