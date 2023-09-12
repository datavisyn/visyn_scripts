const { resolve } = require('path');
const { call } = require('./utils');

console.log("rspack")

module.exports = {
  command: 'rsbuild [strings...]',
  describe: 'Build a workspace using rspack',
  handler: (args) => {
    console.log("rspack handler")
    const configPath = resolve(__dirname, '../../config/rspack.config.js');
    call('rspack', `build --c "${configPath}" ${(args.strings || []).join(' ')}`)
    

    console.log(configPath);
    //const configPath = resolve(__dirname, '../../config/webpack.config.js');
    //call('webpack', `--config "${configPath}" ${(args.strings || []).join(' ')}`, {
    //  env: {
    //    NODE_OPTIONS: '--max-old-space-size=4096',
    //  },
    //});
  },
};
