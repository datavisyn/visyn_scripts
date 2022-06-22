#!/usr/bin/env node
"use strict";
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { execSync } = require("child_process");

const [, , ...args] = process.argv;

require("yargs")
  .usage("$0 command")
  .command({
    command: "compile",
    builder: (yargs) =>
      yargs
        .option("watch", {
          default: false,
          type: "boolean",
        }),
    handler: (args) => {
      execSync(`tsc ${args.watch ? '-w' : ''}`, {
        stdio: "inherit",
      });
    },
  })
  .command({
    command: "build",
    builder: (yargs) =>
      yargs
        .option("mode", {
          default: "production",
          type: "string",
        }),
    handler: (args) => {
      const configPath = require('path').resolve(__dirname, '../config/', args.mode.startsWith("dev") ? 'webpack.dev.js' : 'webpack.prod.js')
      execSync(`webpack --mode ${args.mode} --config ${configPath}`, {
        stdio: "inherit",
      });
    },
  })
  .command({
    command: "lint",
    builder: (yargs) =>
      yargs
        .option("fix", {
          default: false,
          type: "boolean",
        }),
    handler: (args) => {
      execSync(
        `eslint ${
          args.fix ? "--fix" : ""
        } --cache src/**/*.ts{,x} tests/**/*.ts{,x}`,
        {
          stdio: "inherit",
        }
      );
    },
  })
  .command({
    command: "test",
    builder: (yargs) =>
      yargs
        .option("watch", {
          default: false,
          type: "boolean",
        }),
    handler: (args) => {
      execSync(`jest  --passWithNoTests -w 1 ${args.watch ? '--watch' : ''}`, {
        stdio: "inherit",
      });
    },
  })
  .command({
    command: "docs",
    handler: () => {
      execSync(`typedoc --options ./typedoc.js src/**.ts`, {
        stdio: "inherit",
      });
    },
  })
  .demandCommand(1, "must provide a valid command").argv;

/*
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", (err) => {
  throw err;
});

const spawn = require("cross-spawn");

const [,, script, ...args] = process.argv;
const nodeArgs = [];

const result = spawn.sync(
  process.execPath,
  nodeArgs
    .concat(require.resolve("../scripts/" + script))
    .concat(args),
  { stdio: "inherit" }
);
if (result.signal) {
  if (result.signal === "SIGKILL") {
    console.log(
      "The build failed because the process exited too early. " +
        "This probably means the system ran out of memory or someone called " +
        "`kill -9` on the process."
    );
  } else if (result.signal === "SIGTERM") {
    console.log(
      "The build failed because the process exited too early. " +
        "Someone might have called `kill` or `killall`, or the system could " +
        "be shutting down."
    );
  }
  process.exit(1);
}
process.exit(result.status);
*/
