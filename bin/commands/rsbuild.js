const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'rsbuild [strings...]',
  describe: 'Build a workspace using rspack',
  handler: (args) => {
    const configPath = resolve(__dirname, '../../config/rspack.config.js');
    call('rspack', `build --c "${configPath}" ${(args.strings || []).join(' ')}`);
  },
};
