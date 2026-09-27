#!/usr/bin/env node
import { Command } from 'commander';
import { runForest } from './cli/run-forest';
const program = new Command();

void program.name('forest').action(runForest).parseAsync(process.argv);
