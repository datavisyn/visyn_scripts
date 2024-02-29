const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'start [strings...]',
  describe: 'Start dev server',
  handler: (args) => {
    const configPath = resolve(__dirname, '../../config/rspack.config.js');
    call('rspack', `serve --mode development --c "${configPath}" ${(args.strings || []).join(' ')}`);
  },
};
