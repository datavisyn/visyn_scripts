const { resolve } = require('path');
const { call } = require('./utils');

module.exports = {
  command: 'build [strings...]',
  describe: 'Build a workspace using webpack',
  builder: (yargs) => yargs.option('mode', {
    default: 'production',
    type: 'string',
  }),
  handler: (args) => {
    const configPath = resolve(
      __dirname,
      '../../config/',
      args.mode.startsWith('dev') ? 'webpack.dev.js' : 'webpack.prod.js',
    );
    call(`webpack --mode ${args.mode} --config ${configPath} ${(args.strings || []).join(' ')}`);
  },
};
