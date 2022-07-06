const { execSync } = require('child_process');

const call = (command) => {
  try {
    execSync(command, {
      stdio: 'inherit',
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
