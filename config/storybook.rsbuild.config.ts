
import { defineConfig } from '@rspack/cli'
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill'

export default defineConfig({
  plugins: [pluginNodePolyfill()],
})