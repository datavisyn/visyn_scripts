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

  addons: ['@chromatic-com/storybook', '@storybook/addon-docs', '@storybook/addon-links'],

  framework: {
    name: 'storybook-react-rsbuild',
  },

  rsbuildFinal: async (config, { configType }) => {
    const merged = mergeRsbuildConfig(config, {
      // Add additional plugins, i.e. to support SASS
      plugins: [pluginSass(), pluginNodePolyfill()],
      tools: {
        // Same configuration as in rspack.config.js, to ensure that storybook behaves the same way.
        swc: {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
              decorators: true,
              // TODO: Check what other settings should be supported: https://swc.rs/docs/configuration/swcrc#compilation
            },
            externalHelpers: true,
            transform: {
              react: {
                runtime: 'automatic',
              },
            },
          },
        },
      },
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
    // console.log('Final rsbuild config for Storybook:', JSON.stringify(merged, null, 2));
    return merged;
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};
