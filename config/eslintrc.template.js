module.exports = ({ tsconfigRootDir }) => ({
  root: true,
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'react-compiler'],
  ignorePatterns: ['*.js'],
  env: {
    browser: true,
    es6: true,
    jest: true,
    'cypress/globals': true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Make sure eslint and VS Code use the same path for the tsconfig.json:
    // https://github.com/typescript-eslint/typescript-eslint/issues/251
    tsconfigRootDir,
    project: './tsconfig.eslint.json',
  },
  rules: {
    // Disables jsx-a11y https://github.com/import-js/eslint-plugin-import/blob/v2.25.4/docs/rules/no-webpack-loader-syntax.md
    // eslint-disable-next-line global-require
    ...Object.keys(require('eslint-plugin-jsx-a11y').rules).reduce((acc, rule) => {
      acc[`jsx-a11y/${rule}`] = 'off';
      return acc;
    }, {}),
    'class-methods-use-this': 'off',
    curly: [2, 'all'],
    'linebreak-style': 'off',
    'no-console': 'off',
    'no-continue': 'off',
    'no-multi-assign': 'warn',
    'no-nested-ternary': 'off',
    'no-return-assign': 'warn',
    'no-restricted-exports': 'off',
    'no-restricted-syntax': 'off',
    'no-plusplus': 'off',
    'no-prototype-builtins': 'warn',
    'no-minusminus': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': 'warn',
    'max-classes-per-file': 'off',
    'no-param-reassign': ['warn', { props: true, ignorePropertyModificationsFor: ['state'] }], // Exclude state as required by redux-toolkit: https://redux-toolkit.js.org/usage/immer-reducers#linting-state-mutations
    'cypress/unsafe-to-chain-command': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-webpack-loader-syntax': 'off', // Disable to allow webpack file-loaders syntax
    'import/no-unresolved': 'off', // Disable to allow webpack file-loaders syntax
    'import/prefer-default-export': 'off',
    'import/order': 'error',
    'prefer-destructuring': ['warn', { object: true, array: false }],
    'prefer-promise-reject-errors': 'warn',
    'prefer-spread': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react/destructuring-assignment': 'off',
    'react/jsx-curly-brace-presence': 'warn',
    'react/jsx-props-no-spreading': 'off',
    'react/no-unused-class-component-methods': 'warn',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/static-property-placement': [
      'warn',
      'property assignment',
      {
        childContextTypes: 'static getter',
        contextTypes: 'static public field',
        contextType: 'static public field',
        displayName: 'static public field',
      },
    ],
    'react-compiler/react-compiler': 'warn',
  },
  overrides: [
    {
      files: ['cypress/**/*'],
      extends: ['plugin:cypress/recommended', 'plugin:chai-friendly/recommended'],
      rules: {
        'cypress/unsafe-to-chain-command': 'warn',
      },
      plugins: ['cypress', 'chai-friendly'],
    },
    {
      files: ['{src|tests}/**/*.{test|spec}.ts'],
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
    },
  ],
});
