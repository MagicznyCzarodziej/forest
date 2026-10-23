#!/usr/bin/env node
import { Command } from 'commander';
import { runCloneCommand } from './application/runCloneCommand';
import { runForest } from './application/runForest';

const program = new Command();

program.name('forest');

program
  .command('clone')
  .description('Clone a GitHub repository into the forest layout (bare repo + default worktree)')
  .argument('<repository>', 'repository name under the configured GitHub owner')
  .action(async (repository: string) => {
    await runCloneCommand(repository);
  });

program.description('Browse repositories and manage git worktrees').action(async () => {
  await runForest();
});

void program.parseAsync(process.argv);
