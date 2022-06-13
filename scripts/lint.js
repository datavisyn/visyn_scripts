const { execSync } = require("child_process");

const [,, ...args] = process.argv;

execSync(`eslint ${args[0] === "fix" ? "--fix" : ""} --cache src/**/*.ts{,x} tests/**/*.ts{,x}`, {
  stdio: "inherit",
});
