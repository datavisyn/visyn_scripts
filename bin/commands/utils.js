const { execSync } = require('child_process');

const call = (command) => {
  try {
    execSync(command, {
      stdio: 'inherit',
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
