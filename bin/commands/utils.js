const { execSync } = require('child_process');

const call = (command, options = {}) => {
  try {
    execSync(command, {
      ...options,
      stdio: 'inherit',
      env: {
        // TODO: Avoid out of memory errors when building
        // NODE_OPTIONS: '--max_old_space_size=4096',
        ...(options.env || {}),
        ...process.env,
      },
      // TODO: How should we handle if webpack 4 is on top-level, and webpack 5 is locally scoped within visyn_scripts?
      // cwd: resolve(__dirname, '../../'),
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
