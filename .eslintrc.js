module.exports = {
  plugins: ['prettier'],
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {},
  overrides: [
    {
      files: ['tests/**/*.test.js'],
      env: {
        jest: true,
      },
    },
  ],
};
