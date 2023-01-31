#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from "yargs/helpers";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});


// Use yargs as command parser by adding subcommands
yargs(hideBin(process.argv))
  .parserConfiguration({ 'unknown-options-as-args': true })
  .usage('$0 <command>')
  .command((await import('./commands/build.js')).default)
  .command((await import('./commands/clean.js')).default)
  .command((await import('./commands/compile.js')).default)
  .command((await import('./commands/copy.js')).default)
  .command((await import('./commands/docs.js')).default)
  .command((await import('./commands/lint.js')).default)
  // .command((await import('./commands/product-build.cjs')).default)
  .command((await import('./commands/start.js')).default)
  .command((await import('./commands/test.js')).default)
  // .command((await import('./commands/workspace-clone.js')).default)
  // .command((await import('./commands/workspace-update.js')).default)
  .demandCommand(1, 'must provide a valid command')
  .showHelpOnFail(true)
  .parse();
