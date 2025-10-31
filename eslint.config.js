const path = require('node:path');

const globals = require('globals');
const { includeIgnoreFile } = require('@eslint/compat');
const js = require('@eslint/js');
const { configs, plugins } = require('eslint-config-airbnb-extended');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const gitignorePath = path.resolve('.', '.gitignore');

/**
 * @type {import('eslint').Linter.Config[]}
 */
const jsConfig = [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
    },
  },
  // ESLint Recommended Rules
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  // Stylistic Plugin
  plugins.stylistic,
  // Import X Plugin
  plugins.importX,
  // Airbnb Base Recommended Config
  ...configs.base.recommended,
];

/**
 * @type {import('eslint').Linter.Config[]}
 */
const typescriptConfig = [
  // TypeScript ESLint Plugin
  plugins.typescriptEslint,
  // Airbnb Base TypeScript Config
  ...configs.base.typescript,
];

module.exports = [
  // Ignore .gitignore files/folder in eslint
  includeIgnoreFile(gitignorePath),
  // Javascript Config
  ...jsConfig,
  // TypeScript Config
  ...typescriptConfig,
  // Prettier Config
  eslintPluginPrettierRecommended,
  {
    rules: {
      'no-console': 'off',
      'max-len': 'off',
    },
  },
];
