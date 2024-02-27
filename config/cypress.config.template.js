const { devServer } = require('cypress-rspack-dev-server');
const rspackConfig = require('./rspack.config');

module.exports = {
  viewportHeight: 1080,
  viewportWidth: 1920,
  defaultCommandTimeout: 10000,
  e2e: {
    baseUrl: 'http://localhost:8080',
    setupNodeEvents() {},
  },
  component: {
    devServer(devServerConfig) {
      return devServer({
        ...devServerConfig,
        framework: 'react',
        rspackConfig: rspackConfig({ workspace_mode: 'single' }, { mode: 'production' }),
      });
    },
  },
};
