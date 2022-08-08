const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'build [strings...]',
  describe: 'Build a workspace using webpack',
  handler: (args) => {
    const configPath = resolve(__dirname, '../../config/webpack.config.js');
    call(`webpack --config ${configPath} ${(args.strings || []).join(' ')}`, {
      env: {
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    });
  },
};
