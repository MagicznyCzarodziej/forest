import type { RepositoryCatalogEntry, WorktreeEntry } from '../../domain/types';
import type { ScreenState } from '../navigation/screen-stack';
import { FullscreenShell } from '../layout/FullscreenShell';
import { repositoriesSubtitle, screenFooter, screenSubtitle } from '../layout/screen-chrome';
import type { GitHubListStatus } from '../hooks/useRepositoryList';
import { BranchPickerScreen } from './BranchPickerScreen';
import { ConfirmationScreen } from './ConfirmationScreen';
import { RepositoryPickerScreen } from './RepositoryPickerScreen';
import { WorktreePickerScreen } from './WorktreePickerScreen';
import { ProgressView } from '../components/ProgressView';

interface ForestScreenActions {
  openRepository: (repository: RepositoryCatalogEntry) => Promise<void>;
  clone: (repositoryName: string) => Promise<void>;
  openLegacyWithoutConvert: (repositoryName: string, repositoryPath: string) => Promise<void>;
  convert: (repositoryName: string, repositoryPath: string) => Promise<void>;
  openWorktree: (
    repositoryName: string,
    repositoryPath: string,
    worktree: WorktreeEntry,
  ) => Promise<void>;
  createWorktree: (
    repositoryName: string,
    repositoryPath: string,
    newBranchName: string,
    baseBranch: string,
  ) => Promise<void>;
}

interface ForestScreenProps {
  screen: ScreenState;
  repositories: RepositoryCatalogEntry[];
  githubListStatus: GitHubListStatus;
  worktrees: WorktreeEntry[];
  branches: string[];
  catalogReady: boolean;
  openingWorktreePath: string | null;
  progressLines: string[];
  actions: ForestScreenActions;
  onShowBranches: (repositoryName: string, repositoryPath: string, newBranchName: string) => void;
  onBack: () => void;
}

function ScreenContent({
  screen,
  repositories,
  githubListStatus,
  worktrees,
  branches,
  catalogReady,
  openingWorktreePath,
  progressLines,
  actions,
  onShowBranches,
  onBack,
}: ForestScreenProps) {
  switch (screen.type) {
    case 'repositories':
      return (
        <RepositoryPickerScreen
          repositories={repositories}
          onSelect={(repository) => void actions.openRepository(repository)}
          onEscape={onBack}
          emptyMessage={githubListStatus === 'loading' ? 'Loading from GitHub…' : undefined}
        />
      );
    case 'worktrees':
      return (
        <WorktreePickerScreen
          key={screen.repositoryPath}
          worktrees={catalogReady ? worktrees : []}
          openingWorktreePath={openingWorktreePath}
          onOpenWorktree={(worktree) =>
            void actions.openWorktree(screen.repositoryName, screen.repositoryPath, worktree)
          }
          onCreateFromQuery={(newBranchName) =>
            onShowBranches(screen.repositoryName, screen.repositoryPath, newBranchName)
          }
          onEscape={onBack}
          emptyMessage={catalogReady ? 'No matching worktrees — Enter to create one' : 'Loading…'}
        />
      );
    case 'branches':
      return (
        <BranchPickerScreen
          key={`${screen.repositoryPath}\0${screen.newBranchName}`}
          branches={catalogReady ? branches : []}
          initialQuery=""
          emptyMessage={catalogReady ? 'No matching branches' : 'Loading…'}
          onSelectBranch={(baseBranch) =>
            void actions.createWorktree(
              screen.repositoryName,
              screen.repositoryPath,
              screen.newBranchName,
              baseBranch,
            )
          }
          onEscape={onBack}
        />
      );
    case 'confirm-clone':
      return (
        <ConfirmationScreen
          title={`Clone ${screen.repositoryName}?`}
          message="This repository is not on disk yet."
          onConfirm={() => void actions.clone(screen.repositoryName)}
          onDecline={onBack}
          onCancel={onBack}
        />
      );
    case 'confirm-convert':
      return (
        <ConfirmationScreen
          title={`Convert ${screen.repositoryName}?`}
          message="Legacy layout detected. Convert to .bare + worktrees structure?"
          onConfirm={() => void actions.convert(screen.repositoryName, screen.repositoryPath)}
          onDecline={() =>
            void actions.openLegacyWithoutConvert(screen.repositoryName, screen.repositoryPath)
          }
          onCancel={onBack}
        />
      );
    case 'progress':
      return <ProgressView title={screen.title} lines={progressLines} />;
  }
}

export function ForestScreen(props: ForestScreenProps) {
  const { screen, githubListStatus } = props;
  return (
    <FullscreenShell
      subtitle={
        screen.type === 'repositories'
          ? repositoriesSubtitle(githubListStatus)
          : screenSubtitle(screen)
      }
      footer={screenFooter(screen)}
    >
      <ScreenContent {...props} />
    </FullscreenShell>
  );
}
