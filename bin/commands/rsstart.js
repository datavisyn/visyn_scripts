const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'rsstart [strings...]',
  describe: 'Start webpack serve',
  handler: () => {
    const configPath = resolve(__dirname, '../../config/rspack.config.js');
    call('rspack', `serve --mode development --c "${configPath}"`);
  },
};
