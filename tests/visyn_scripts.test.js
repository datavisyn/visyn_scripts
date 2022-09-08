/**
 * Programmatically set arguments and execute the CLI script
 *
 * @param {...string} args - positional and option arguments for the command to run
 */
async function runCommand(...args) {
  process.argv = [
    'node', // Not used but a value is required at this index in the array
    'cli.js', // Not used but a value is required at this index in the array
    ...args,
  ];

  // Require the yargs CLI script
  // eslint-disable-next-line global-require
  return require('../bin/visyn_scripts');
}

// Mock setup of yargs inspired by https://www.kgajera.com/blog/how-to-test-yargs-cli-with-jest/
describe('cli', () => {
  let call;
  let originalArgv;

  beforeEach(() => {
    jest.resetModules();

    // After resetting the modules, we need to reinitialize the mocks
    jest.mock('../bin/commands/utils');
    // eslint-disable-next-line global-require
    call = require('../bin/commands/utils').call;

    // Each test overwrites process arguments so store the original arguments
    originalArgv = process.argv;
  });

  afterEach(() => {
    jest.resetAllMocks();

    // Set process arguments back to the original value
    process.argv = originalArgv;
  });

  it('shows help', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await runCommand('help');
    // Use lookahead to confirm that all of these words exist in any order
    expect(consoleSpy).toBeCalledWith(expect.stringMatching(/(?=(.|\n)*build)(?=(.|\n)*copy)(?=(.|\n)*compile)(?=(.|\n)*docs)(?=(.|\n)*lint)(?=(.|\n)*test)/));
    // Confirm that it would have exited
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('runs the build script in production mode', async () => {
    // const callSpy = jest.spyOn(utils, "call");
    await runCommand('build');
    expect(call).toHaveBeenCalledWith(expect.stringMatching(/(?=.*webpack)/), expect.stringMatching(/(?=.*webpack\.config\.js)/), expect.anything());
  });

  it('runs the build script in development mode', async () => {
    // const callSpy = jest.spyOn(utils, "call");
    await runCommand('build', '--mode', 'development');
    expect(call).toHaveBeenCalledWith(
      expect.stringMatching(/(?=.*webpack)/),
      expect.stringMatching(/(?=.*--mode development)(?=.*webpack\.config\.js)/),
      expect.anything(),
    );
  });
});
