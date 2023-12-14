const { call } = require('./utils');

module.exports = {
  command: 'lint [strings...]',
  describe: 'Lint a repository using Biome',
  builder: (yargs) =>
    yargs.option('fix', {
      default: false,
      type: 'boolean',
    }),
  handler: (args) => {
    'biome check  bin/**/*.js config/**/*.js tests/**/*.js';
    call(
      'biome',
      `check --max-diagnostics=200 --no-errors-on-unmatched ${args.fix ? '--apply-unsafe' : ''} ${(args.strings || []).join(
        ' ',
      )} "src/**/*.ts{,x}" "tests/**/*.ts{,x}" "cypress/**/*.ts{,x}"`,
    );
  },
};
