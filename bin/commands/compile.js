const { call } = require('./utils');

module.exports = {
  command: 'compile [strings...]',
  describe: 'Build a repository using typescript',
  handler: (args) => {
    call('tsc', `${(args.strings || []).join(' ')}`);
  },
};
