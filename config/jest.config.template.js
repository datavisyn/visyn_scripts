const pluginsNotToTransform = [
  // Disable the transform for d3v3, as it otherwise leads to "Cannot read property 'document' of undefined": https://stackoverflow.com/a/35560440
  'd3v3',
].join('|');

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|ts|tsx|mjs|mts)$': [
      '@swc/jest',
      {
        // Exactly the same configuration as in the webpack.config.js
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
        },
      },
    ],
    '\\.xml$': 'jest-raw-loader',
  },
  testRegex: '(.*(test|spec))\\.(tsx?)$',
  testPathIgnorePatterns: ['playwright'],
  coveragePathIgnorePatterns: ['playwright'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePaths: ['src'],
  resolver: 'visyn_scripts/config/jest_export_maps_resolver.js',
  transformIgnorePatterns: [`../node_modules/${pluginsNotToTransform}`, `node_modules/${pluginsNotToTransform}`],
  globals: {
    __VERSION__: 'TEST_VERSION',
    __APP_CONTEXT__: 'TEST_CONTEXT',
  },
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass|png|jpg|gif|svg|html)$': 'identity-obj-proxy',
    // Add tslib alias as otherwise we get a TypeError: Cannot destructure property '__extends' of '_tslib.default' as it is undefined.
    tslib: 'tslib/tslib.es6.js',
  },
};
