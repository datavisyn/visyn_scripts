const { call } = require('./utils');

module.exports = {
  command: 'storybook [strings...]',
  describe: 'Start storybook',
  handler: (args) => {
    call('storybook', `${(args.strings || []).join(' ')}`);
  },
};
