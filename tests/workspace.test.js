const fse = require('fs-extra');
const fs = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');
const { setup: setupDevServer, teardown: teardownDevServer } = require('jest-dev-server');

// Mock setup of yargs inspired by https://www.kgajera.com/blog/how-to-test-yargs-cli-with-jest/
describe('workspace', () => {
  const templateDir = resolve(__dirname, '../tests_fixtures/workspace_template');
  const testDir = resolve(__dirname, '../tests_fixtures/workspace_test');

  const clearTestDir = () => {
    // Remove any existing test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  };

  const copyTestDir = () => {
    // Copy the template workspace to the test workspace
    fse.copySync(templateDir, testDir);
  };

  beforeAll(() => {
    // Install dependencies
    if (!fs.existsSync(resolve(templateDir, 'node_modules'))) {
      console.log('Installing local dependencies in the template folder');
      execSync('yarn install --no-immutable --inline-builds', {
        cwd: templateDir,
        stdio: 'inherit',
      });
    } else {
      console.log('Skipping install of local dependencies as node_modules already exists, remove it to force reinstall.');
    }
  });

  beforeAll(() => {
    clearTestDir();
    copyTestDir();
  });

  afterAll(() => {
    clearTestDir();
  });

  it('builds the demo repository', () => {
    // Execute the build script of the repository
    execSync('npm run build:demo', {
      cwd: testDir,
      stdio: 'inherit',
    });
    // Expect some dist files to exist after the build
    expect(fs.existsSync(resolve(testDir, 'demo/dist/index.js'))).toBe(true);
    expect(fs.existsSync(resolve(testDir, 'demo/dist/index.template.ejs'))).toBe(true);
  });

  it('builds the production build', () => {
    // Execute the build script of the workspace
    execSync('npm run build', {
      cwd: testDir,
      stdio: 'inherit',
    });
    // Expect some bundle files to exist after the build
    expect(fs.existsSync(resolve(testDir, 'bundles/phoveaMetaData.json'))).toBe(true);
  });

  it('runs cypress on the production build', async () => {
    await setupDevServer({
      command: `http-server ${testDir}/bundles --port 8090`,
      port: 8090,
    });

    try {
      // Execute the cypress script of the repository
      execSync('npm run cy:run:demo', {
        cwd: testDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          CYPRESS_BASE_URL: 'http://localhost:8090',
        },
      });
    } finally {
      // Stop the server afterwards
      teardownDevServer();
    }
  });
});
