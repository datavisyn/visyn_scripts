module.exports = ({ tsconfigRootDir, optimizeImports = true }) => ({
  root: true,
  extends: [
    'airbnb',
    '@kesills/airbnb-typescript',
    'airbnb/hooks',
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended-legacy',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    // 'plugin:lodash/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'react-compiler', ...(optimizeImports ? ['unused-imports'] : [])],
  ignorePatterns: ['*.js'],
  env: {
    browser: true,
    es6: true,
    jest: true,
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
    '@typescript-eslint/class-methods-use-this': 'off',
    curly: [2, 'all'],
    'linebreak-style': 'off',
    'no-console': 'off',
    'no-continue': 'off',
    'no-multi-assign': 'warn',
    'no-nested-ternary': 'off',
    'no-return-assign': 'warn',
    'no-restricted-exports': 'off',
    'no-restricted-syntax': [
      'warn',
      {
        selector: "MemberExpression[object.name='React'][property.name='useEffect']",
        message: 'You Might Not Need an Effect\nhttps://react.dev/learn/you-might-not-need-an-effect',
      },
    ],
    'no-plusplus': 'off',
    'no-prototype-builtins': 'warn',
    'no-minusminus': 'off',
    'no-underscore-dangle': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [{
          name: 'lodash',
          message: 'Please import specific methods from lodash/<util> instead.',
        },
        {
          name: '@fortawesome/free-solid-svg-icons',
          message: 'Please import specific icons from @fortawesome/free-solid-svg-icons/<icon> instead.',
        },
        {
          name: '@fortawesome/free-regular-svg-icons',
          message: 'Please import specific icons from @fortawesome/free-regular-svg-icons/<icon> instead.',
        }],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'max-classes-per-file': 'off',
    'no-param-reassign': ['warn', { props: true, ignorePropertyModificationsFor: ['state'] }], // Exclude state as required by redux-toolkit: https://redux-toolkit.js.org/usage/immer-reducers#linting-state-mutations
    'import/no-extraneous-dependencies': 'off',
    'import/no-webpack-loader-syntax': 'off', // Disable to allow webpack file-loaders syntax
    'import/no-unresolved': 'off', // Disable to allow webpack file-loaders syntax
    'import/prefer-default-export': 'off',
    ...(optimizeImports ? {
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['sibling', 'parent']],
          pathGroups: [
            {
              pattern: 'react*',
              group: 'external',
              position: 'before',
            },
            { pattern: 'src/**', group: 'internal', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['internal', 'react'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true, // don't want to sort import lines, use eslint-plugin-import instead
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off', // https://github.com/sweepline/eslint-plugin-unused-imports/blob/master/docs/rules/no-unused-vars.md
    } : {
      'import/order': 'error',
    }),
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
    'react-hooks/exhaustive-deps': ['error', {
      additionalHooks: '(useTriggerFrame|useDeepEffect|useDeepMemo|useDeepCallback|useDeepCompareEffect)',
    }],
    /*
    The fork of the eslint-config-airbnb-typescript package has added ESLint Stylistic plugin
    to the config. see:https://github.com/Kenneth-Sills/eslint-config-airbnb-typescript/pull/3
    Some of the stylistic rules are not compatible with our current prettier config so we disable them.
    */
    '@stylistic/indent': 'off',
    '@stylistic/comma-dangle': 'off',
  },
  overrides: [
    {
      files: ['{src|tests}/**/*.{test|spec}.ts'],
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
    },
    {
      files: 'playwright/**/*.{test|spec}.ts',
      extends: 'plugin:playwright/recommended',
    },
  ],
});
