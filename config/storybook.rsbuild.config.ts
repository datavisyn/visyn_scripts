import { defineConfig } from '@rsbuild/core';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

// This is the rsbuild configuration used by storybook, it is not the same as the rspack config!
/**
 * @deprecated Upgrade to Storybook 10+ and use `storybook10.main.template.js` instead.
 */
export default defineConfig({
  plugins: [pluginReact(), pluginSass(), pluginNodePolyfill()],
});
