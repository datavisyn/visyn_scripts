#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

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
  .command(require('./commands/build'))
  .command(require('./commands/copy'))
  .command(require('./commands/compile'))
  .command(require('./commands/docs'))
  .command(require('./commands/lint'))
  .command(require('./commands/test'))
  .demandCommand(1, 'must provide a valid command')
  .showHelpOnFail(true)
  .parse();
