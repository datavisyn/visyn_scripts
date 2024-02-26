/**
 * @type {import('@storybook/react-webpack5').StorybookConfig}
 */
module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-styling',
      options: {
        // This is our best guess to replicate the style config we are using in the rspack.config.js
        scssBuildRule: {
          test: /\.scss$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { importLoaders: 1 },
            },
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
      },
    },
    'storybook-addon-swc',
  ],
  framework: {
    // TODO: as soon as rspack storybook integration is ready, use that: https://www.rspack.dev/guide/migrate-storybook
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  webpackFinal: async (config) => {
    // eslint-disable-next-line no-param-reassign
    config.module.rules = config.module.rules.flatMap((rule) => (rule.loader?.includes('swc-loader')
      ? [
        rule,
        {
          // In addition to the swc-loader rule from storybook, add a rule which allows transforming ts and tsx files (i.e. to transform node_modules/visyn_core)
          ...rule,
          test: /\.(ts|tsx)$/,
          exclude: [],
        },
      ]
      : [rule]));

    return config;
  },
  docs: {
    autodocs: true,
  },
};
