import { mergeRsbuildConfig } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginSass } from '@rsbuild/plugin-sass';

/**
 * @type {import('storybook-react-rsbuild').StorybookConfig}
 */
export default {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

  core: {
    disableTelemetry: true,
  },

  addons: ['@chromatic-com/storybook', '@storybook/addon-docs', '@storybook/addon-links', '@storybook/addon-vitest'],

  framework: {
    name: 'storybook-react-rsbuild',
  },

  rsbuildFinal: async (config, { configType }) => {
    const merged = mergeRsbuildConfig(config, {
      // Add additional plugins, i.e. to support SASS
      plugins: [pluginSass(), pluginNodePolyfill()],
      performance:
        // Without this, HMR is broken: https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/394#issuecomment-1463926441
        configType === 'DEVELOPMENT'
          ? {
              chunkSplit: {
                strategy: 'all-in-one',
                splitChunks: false,
              },
            }
          : undefined,
    });
    console.log('Final rsbuild config for Storybook:', JSON.stringify(merged, null, 2));
    return merged;
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};
