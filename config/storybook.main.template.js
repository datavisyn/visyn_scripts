const { resolve } = require('path');

/**
 * @type {import('storybook-react-rsbuild').StorybookConfig}
 */
module.exports = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: 'storybook-react-rsbuild',
    options: {
      builder: {
        rsbuildConfigPath: resolve(__dirname, './storybook.rsbuild.config.ts'),
      },
    },
  },
  rsbuildFinal: async (config) => {
    const reactDocgenLoaderRule = config.tools.rspack[1].module.rules[0];

    // eslint-disable-next-line no-param-reassign
    config.tools.rspack[1].module.rules = [
      reactDocgenLoaderRule,
      {
        // Copy the rule (found here: https://github.com/rspack-contrib/storybook-rsbuild/blob/c6b92bd1d40b63cebdf78b8bf75594ec0568b972/packages/framework-react/src/react-docs.ts#L27)
        // And modify it to not exclude node_modules
        ...reactDocgenLoaderRule,
        test: /\.(tsx?)$/,
        exclude: /(\.(stories|story)\.(js|jsx|ts|tsx))/,
      },
    ];

    return config;
  },
  docs: {
    autodocs: true,
  },
};
