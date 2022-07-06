const { call } = require('./utils');

module.exports = {
  command: 'lint [strings...]',
  describe: 'Lint a repository using ESLint',
  builder: (yargs) => yargs.option('cache', {
    default: true,
    type: 'boolean',
  }),
  handler: (args) => {
    call(`eslint ${args.cache ? '--cache' : ''} ${(args.strings || []).join(' ')} "src/**/*.ts{,x}" "tests/**/*.ts{,x}"`);
  },
};
