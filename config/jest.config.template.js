// test dependencies that require transformation
let pluginsToTransform = [
  // datavisyn
  'tdp_*',
  'phovea_*',
  'visyn_*',
  'lineupjs',
  // d3
  'd3*',
  'internmap',
  'delaunator',
  'robust-predicates',
].join('|');

if (pluginsToTransform.length > 0) {
  /**  Attention: Negative Lookahead! This regex adds the specified repos to a
   * whitelist that holds plugins that are excluded from the transformIgnorePatterns.
   * This means that pluginsToTransform should contain all repos that export ts files.
   * They can only be handled by the transformation. */
  pluginsToTransform = `(?!${pluginsToTransform})`;
}

/**
 * TODO check if we can process inline webpack loaders (e.g. as found in https://github.com/phovea/phovea_ui/blob/master/src/_bootstrap.ts)
 * see also https://jestjs.io/docs/en/webpack#mocking-css-modules
 */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|ts|tsx)$': '@swc/jest',
    '\\.xml$': 'jest-raw-loader',
  },
  testRegex: '(.*(test|spec))\\.(tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['src'],
  resolver: 'visyn_scripts/config/jest_export_maps_resolver.js',
  transformIgnorePatterns: [`../node_modules/${pluginsToTransform}`, `node_modules/${pluginsToTransform}`],
  globals: {
    __VERSION__: 'TEST_VERSION',
    __APP_CONTEXT__: 'TEST_CONTEXT',
  },
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass|png|jpg|gif|svg|html)$': 'identity-obj-proxy',
  },
};
