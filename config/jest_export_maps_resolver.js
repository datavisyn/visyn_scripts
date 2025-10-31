// temporary workaround while we wait for https://github.com/facebook/jest/issues/9771
// eslint-disable-next-line import-x/no-extraneous-dependencies
const resolver = require('enhanced-resolve').create.sync({
  conditionNames: ['require', 'node', 'default', 'import'],
  extensions: ['.js', '.json', '.node', '.ts', '.tsx'],
});

module.exports = (request, options) => resolver(options.basedir, request);
