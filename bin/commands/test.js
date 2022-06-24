const { call } = require('./utils');

module.exports = {
  command: 'test [strings...]',
  describe: 'Test a repository using Jest',
  builder: (yargs) => yargs.option('passWithNoTests', {
    default: true,
    type: 'boolean',
  }),
  handler: (args) => {
    call(`jest ${args.passWithNoTests ? '--passWithNoTests' : ''} ${(args.strings || []).join(' ')}`);
  },
};
