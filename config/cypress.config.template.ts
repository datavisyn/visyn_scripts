import { defineConfig } from 'cypress';
import * as rspackConfig from './rspack.config';
import { devServer } from 'cypress-rspack-dev-server';

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  defaultCommandTimeout: 10000,
  e2e: {
    baseUrl: 'http://localhost:8080',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupNodeEvents(on, config) {},
  },
  component: {
    devServer(devServerConfig) {
      return devServer({
        ...devServerConfig,
        framework: 'react',
        // @ts-ignore
        rspackConfig: rspackConfig({ workspace_mode: 'single' }, { mode: 'production' }),
      });
    },
  },
});
