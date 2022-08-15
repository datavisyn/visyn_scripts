const { execSync } = require('child_process');
const { resolve } = require('path');

const call = (command, options = {}) => {
  try {
    console.log(`Calling '${command}' with options'`, options);

    // Resolve the node_path relative to the installed script,
    // as otherwise "local" scripts (installed in node_modules/visyn_scripts/node_modules) can't be resolved.
    const nodePath = resolve(__dirname, '../../node_modules');

    execSync(command, {
      ...options,
      stdio: 'inherit',
      env: {
        // TODO: Avoid out of memory errors when building
        // NODE_OPTIONS: '--max_old_space_size=4096',
        NODE_PATH: nodePath,
        ...(options.env || {}),
        ...process.env,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
};

module.exports = {
  call,
};
