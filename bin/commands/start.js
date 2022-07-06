const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'start [strings...]',
  describe: 'Start webpack serve',
  handler: (args) => {
    const configPath = resolve(__dirname, '../../config/webpack.config.js');
    call(`webpack serve --mode development --config ${configPath} --progress ${(args.strings || []).join(' ')}`);
  },
};
