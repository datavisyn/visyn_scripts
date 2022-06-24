const { call } = require("./utils");

module.exports = {
    command: "compile",
    describe: 'Build a repository using typescript',
    builder: (yargs) =>
      yargs.option("watch", {
        default: false,
        type: "boolean",
      }),
    handler: (args) => {
        call(`tsc ${args.watch ? "-w" : ""}`);
    },
  };
