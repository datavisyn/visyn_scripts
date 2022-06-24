const { call } = require("./utils");

module.exports = {
  command: "docs",
  describe: 'Generate docs of a repository using typedoc',
  handler: () => {
    call(`typedoc --options ./typedoc.js src/**.ts`);
  },
};
