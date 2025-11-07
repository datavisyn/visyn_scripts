const { execSync } = require('child_process');
const fs = require('fs');
const { resolve, join } = require('path');

/**
 * Wraps `execSync` with options and error handling.
 *
 * @param {string} command Executable .bin script usually localed in `node_modules/.bin`
 * @param {string} args Arbitrary arguments to the bin script, or if command is empty a normal shell command
 * @param {object} options
 */
const call = (command, args, options = {}) => {
  try {
    console.log(`Calling '${command}' with args and options`, args, options);

    // Resolve the node_path relative to the installed script,
    // as otherwise "local" scripts (installed in node_modules/visyn_scripts/node_modules) can't be resolved.
    const nodePath = resolve(__dirname, '../../node_modules');

    // yarn v2 has started to limit the acess to bin scripts, as only bin scripts are available from packages which are also in the package.json.
    // This however breaks the purpose of this repository (defining deps only at one place), such that we need to call the bin dir directly.
    let commandPath = command ? join('./node_modules/.bin/', command) : '';

    if (!fs.existsSync(commandPath)) {
      console.warn(`The command '${command}' does not exist in the .bin directory '${commandPath}'. Falling back to calling '${command}' instead.`);
      commandPath = command;
    }

    execSync(`${commandPath} ${args}`.trim(), {
      ...options,
      stdio: 'inherit',
      env: {
        NODE_PATH: nodePath,
        // Increase memory limits for node all processes
        NODE_OPTIONS: '--max-old-space-size=8192 --max-semi-space-size=512',
        // Enable the faster prettier CLI: https://www.solberg.is/prettier-is-fast
        PRETTIER_EXPERIMENTAL_CLI: 1,
        ...(options.env || {}),
        ...process.env,
      },
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

const isFormatSeparate = () => {
  return ['true', '1'].includes(process.env.VISYN_SCRIPTS_FORMAT_SEPARATE?.toLocaleLowerCase());
};

module.exports = {
  call,
  isFormatSeparate,
};
