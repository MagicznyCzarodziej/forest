#!/usr/bin/env node
import { Command } from 'commander';
import { runForest } from './cli/run-forest';
const program = new Command();

program.name('forest').action(runForest);

void program.parseAsync(process.argv);
