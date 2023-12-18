const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'bundle [strings...]',
  describe: 'Bundles a workspace or a repository',
  handler: (args) => {
    const configPath = resolve(__dirname, '../../config/rspack.config.js');
    call('rspack', `build --c "${configPath}" ${(args.strings || []).join(' ')}`, {
      env: {
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    });
  },
};
