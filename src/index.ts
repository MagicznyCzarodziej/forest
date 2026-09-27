#!/usr/bin/env node
import { Command } from 'commander';
import { runForest } from './cli/run-forest.js';
const program = new Command();

program.name('forest').action(async () => {
  await runForest();
});

void program.parseAsync(process.argv);
