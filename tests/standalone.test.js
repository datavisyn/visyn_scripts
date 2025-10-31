const fs = require('fs');
const { resolve } = require('path');
const { execSync } = require('child_process');
const fse = require('fs-extra');

// Mock setup of yargs inspired by https://www.kgajera.com/blog/how-to-test-yargs-cli-with-jest/
describe('standalone', () => {
  const templateDir = resolve(__dirname, '../tests_fixtures/standalone_template');
  const testDir = resolve(__dirname, '../tests_fixtures/standalone_test');

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
      // Clear the yarn.lock to ensure it is found as module, but completely reinstalls.
      fs.writeFileSync(resolve(templateDir, 'yarn.lock'), '');
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

  it('builds the repository', () => {
    // Execute the build script of the repository
    execSync('yarn run build', {
      cwd: testDir,
      stdio: 'inherit',
    });
    // Expect some dist files to exist after the build
    expect(fs.existsSync(resolve(testDir, 'dist/src/index.js'))).toBe(true);
    expect(fs.existsSync(resolve(testDir, 'dist/index.template.ejs'))).toBe(true);
  });

  it('builds storybook', () => {
    // Execute the build script of the repository
    execSync('yarn run storybook:build', {
      cwd: testDir,
      stdio: 'inherit',
    });
    // Expect some dist files to exist after the build
    expect(fs.existsSync(resolve(testDir, 'storybook-static/index.html'))).toBe(true);
  });

  describe('production build', () => {
    it('builds the production build', () => {
      // Execute the build script of the workspace
      execSync('yarn run bundle:prod', {
        cwd: testDir,
        stdio: 'inherit',
      });
      // Expect some bundle files to exist after the build
      expect(fs.existsSync(resolve(testDir, 'bundles/index.html'))).toBe(true);
    });
  });
});
