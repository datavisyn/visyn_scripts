/* eslint-disable no-param-reassign */
const path = require('path');

/**
 * @param {{ name: string; dirname: string; }} param0 Options
 * @returns {import('@storybook/react-webpack5').StorybookConfig}
 */
module.exports = ({ name, dirname }) => ({
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/preset-scss', 'storybook-addon-swc', '@storybook/addon-mdx-gfm'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  webpackFinal: async (config) => {
    config.module.rules = config.module.rules.flatMap((rule) => (rule.loader?.includes('swc-loader') ? [
      rule,
      {
        // In addition to the swc-loader rule from storybook, add a rule which allows transforming ts and tsx files (i.e. to transform node_modules/visyn_core)
        ...rule,
        test: /\.(ts|tsx)$/,
        exclude: [],
      },
    ] : [rule]));

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Add visyn_pro/dist as alias, as we have scss/code imports like visyn_pro/dist/assets/...
      [`${name}/dist`]: path.resolve(dirname, '../src'),
      [`${name}/src`]: path.resolve(dirname, '../src'),
      [name]: path.resolve(dirname, '../src'),
    };
    return config;
  },
  docs: {
    autodocs: true,
  },
});
