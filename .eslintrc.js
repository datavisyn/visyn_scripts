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
  rules: {
    'max-len': 'off',
  },
  overrides: [
    {
      files: ['tests/**/*.test.js'],
      env: {
        jest: true,
      },
    },
  ],
};
