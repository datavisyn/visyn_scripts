const { call } = require('./utils');

module.exports = {
  command: 'docs [strings...]',
  describe: 'Generate docs of a repository using typedoc',
  handler: (args) => {
    call('typedoc', `--options ./typedoc.js ${(args.strings || []).join(' ')} src/**.ts`);
  },
};
