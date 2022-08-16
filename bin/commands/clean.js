const { call } = require('./utils');

module.exports = {
  command: 'clean [strings...]',
  describe: 'Clean files and folders using rimraf',
  handler: (args) => {
    call('rimraf', (args.strings || []).join(' '));
  },
};
