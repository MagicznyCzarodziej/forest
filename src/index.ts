#!/usr/bin/env node
import { Command } from 'commander';
import { runForest } from './application/runForest';
const program = new Command();

void program.name('forest').action(runForest).parseAsync(process.argv);
