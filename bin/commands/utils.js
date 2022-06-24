const { execSync } = require("child_process");

const call = (command) => {
  try {
    execSync(command, {
      stdio: "inherit",
    });
  } catch (e) {
    console.error(e);
    process.exit(1)
    // Ignore error as it is already printed to the console.
  }
};

module.exports = {
  call,
};
