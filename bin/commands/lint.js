const { call } = require("./utils");

module.exports = {
  command: "lint",
  describe: "Lint a repository using ESLint",
  builder: (yargs) =>
    yargs.option("fix", {
      default: false,
      type: "boolean",
    }),
  handler: (args) => {
    call(
      `eslint ${
        args.fix ? "--fix" : ""
      } --cache src/**/*.ts{,x} tests/**/*.ts{,x}`
    );
  },
};
