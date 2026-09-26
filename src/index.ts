#!/usr/bin/env node
import { Command } from "commander";
import { runForest } from "./cli/run-forest.js";

const program = new Command();

program
  .name("forest")
  .description("Manage locally cloned repositories and git worktrees")
  .version("0.1.0")
  .action(async () => {
    await runForest();
  });

program.parseAsync(process.argv);
