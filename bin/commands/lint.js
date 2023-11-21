const { call } = require('./utils');

module.exports = {
  command: 'lint [strings...]',
  describe: 'Lint a repository using ESLint',
  builder: (yargs) => yargs.option('cache', {
    default: true,
    type: 'boolean',
  }),
  handler: (args) => {
    // TODO: Remove --fix to ensure all linting errors are reported in CI. Disable until a codebase is fully migrated, as otherwise formatting causes merge conflicts.
    call('eslint', `--fix ${args.cache ? '--cache' : ''} --no-error-on-unmatched-pattern ${(args.strings || []).join(' ')} "src/**/*.ts{,x}" "tests/**/*.ts{,x}" "cypress/**/*.ts{,x}"`);
  },
};
