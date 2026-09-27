import { useCallback, useEffect, useState } from 'react';
import { buildRepositoryCatalog } from '../../domain/repositories/repository-catalog';
import { useForest } from './useForest';

export type GitHubListStatus = 'ready' | 'loading' | 'error';

export function useRepositoryList() {
  const {
    repositories: initialRepositories,
    localRepositories,
    remoteListFresh,
    refreshRemoteRepositories,
  } = useForest();
  const [repositories, setRepositories] = useState(initialRepositories);
  const [githubListStatus, setGithubListStatus] = useState<GitHubListStatus>(
    remoteListFresh ? 'ready' : 'loading',
  );

  useEffect(() => {
    if (remoteListFresh) {
      return;
    }

    let cancelled = false;
    void refreshRemoteRepositories()
      .then((remoteRepositoryNames) => {
        if (cancelled) {
          return;
        }
        setRepositories(buildRepositoryCatalog(remoteRepositoryNames, localRepositories));
        setGithubListStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setGithubListStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [localRepositories, refreshRemoteRepositories, remoteListFresh]);

  const markOpened = useCallback((repositoryName: string) => {
    setRepositories((list) =>
      list.map((repository) =>
        repository.name === repositoryName
          ? { ...repository, lastOpenedAt: Date.now() }
          : repository,
      ),
    );
  }, []);

  const markCloned = useCallback((repositoryName: string, repositoryPath: string) => {
    setRepositories((list) =>
      list.map((repository) =>
        repository.name === repositoryName
          ? {
              ...repository,
              clonedLocally: true,
              structure: 'standard',
              path: repositoryPath,
              lastOpenedAt: Date.now(),
            }
          : repository,
      ),
    );
  }, []);

  const markConverted = useCallback((repositoryName: string) => {
    setRepositories((list) =>
      list.map((repository) =>
        repository.name === repositoryName ? { ...repository, structure: 'standard' } : repository,
      ),
    );
  }, []);

  return {
    repositories,
    githubListStatus,
    markOpened,
    markCloned,
    markConverted,
  };
}
