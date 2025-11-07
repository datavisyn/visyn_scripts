const { call, isFormatSeparate } = require('./utils');

module.exports = {
  command: 'lint [strings...]',
  describe: 'Lint a repository using ESLint',
  builder: (yargs) =>
    yargs
      .option('cache', {
        default: true,
        type: 'boolean',
      })
      .option('fix', {
        default: false,
        type: 'boolean',
      })
      .option('quiet', {
        default: false,
        type: 'boolean',
      })
      .option('format', {
        // For now, enable format in the CI only. Otherwise, we would have to add the prettier VSCode plugin and adapt workflows for everyone.
        default: isFormatSeparate(),
        type: 'boolean',
      }),
  handler: (args) => {
    if (args.format) {
      // Run prettier separately as it's much faster with the oxc plugin, and the eslint-plugin-prettier doesn't use that apparently.
      call(
        'prettier',
        `prettier ${args.fix ? '--write' : '--check'} --experimental-cli ${(args.strings || []).join(' ')} "src/**/*.ts{,x}" "tests/**/*.ts{,x}" "playwright/**/*.ts{,x}"`,
      );
    }

    call(
      'eslint',
      `${args.cache ? '--cache' : ''} ${args.fix ? '--fix' : ''} ${args.quiet ? '--quiet' : ''} --cache-location node_modules/.cache/eslint --no-error-on-unmatched-pattern ${(args.strings || []).join(' ')} "src/**/*.ts{,x}" "tests/**/*.ts{,x}" "playwright/**/*.ts{,x}"`,
    );
  },
};
