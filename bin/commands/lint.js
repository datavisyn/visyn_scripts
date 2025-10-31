const { call } = require('./utils');

module.exports = {
  command: 'lint [strings...]',
  describe: 'Lint a repository using ESLint',
  builder: (yargs) =>
    yargs.option('cache', {
      default: true,
      type: 'boolean',
    }),
  handler: (args) => {
    call(
      'eslint',
      `${args.cache ? '--cache' : ''} --no-error-on-unmatched-pattern ${(args.strings || []).join(' ')} "src/**/*.ts{,x}" "tests/**/*.ts{,x}" "playwright/**/*.ts{,x}"`,
    );
  },
};
