const { call } = require("./utils");

module.exports = {
  command: "test",
  describe: 'Test a repository using Jest',
  builder: (yargs) =>
    yargs.option("watch", {
      default: false,
      type: "boolean",
    }),
  handler: (args) => {
    call(`jest --passWithNoTests -w 1 ${args.watch ? "--watch" : ""}`);
  },
};
