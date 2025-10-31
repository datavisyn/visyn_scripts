const { defineConfig } = require('eslint/config');
const { includeIgnoreFile } = require('@eslint/compat');
const { rules: prettierConfigRules } = require('eslint-config-prettier');
const airbnb = require('eslint-config-airbnb-extended');
const globals = require('globals');
const jest = require('eslint-plugin-jest');
const js = require('@eslint/js');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const path = require('node:path');
const playwright = require('eslint-plugin-playwright');
const prettierPlugin = require('eslint-plugin-prettier');
const reactCompiler = require('eslint-plugin-react-compiler');
const unusedImports = require('eslint-plugin-unused-imports');

const jsConfig = [
  {
    name: 'js/config',
    ...js.configs.recommended,
  },
  airbnb.plugins.stylistic,
  airbnb.plugins.importX,
  ...airbnb.configs.base.recommended,
];

const reactConfig = [
  reactCompiler.configs.recommended,
  airbnb.plugins.react,
  airbnb.plugins.reactHooks,
  airbnb.plugins.reactA11y,
  ...airbnb.configs.react.recommended,
];

const typescriptConfig = [
  // TypeScript ESLint Plugin
  airbnb.plugins.typescriptEslint,
  // Airbnb Base TypeScript Config
  ...airbnb.configs.base.typescript,
  // Airbnb React TypeScript Config
  ...airbnb.configs.react.typescript,
];

const prettierConfig = [
  {
    name: 'prettier/plugin/config',
    plugins: {
      prettier: prettierPlugin,
    },
  },
  {
    name: 'prettier/config',
    rules: {
      ...prettierConfigRules,
      'prettier/prettier': 'error',
    },
  },
];

const jestConfig = [
  {
    files: ['{src|tests}/**/*.{test|spec}.ts'],
    plugins: { jest },
    languageOptions: {
      globals: jest.environments.globals.globals,
    },
  },
];

const playwrightConfig = [
  {
    ...playwright.configs['flat/recommended'],
    files: ['playwright/**/*.{test|spec}.ts'],
  },
];

// Helper to disable jsx-a11y rules
const jsxA11yOffRules = Object.keys(jsxA11y.rules).reduce((acc, rule) => {
  acc[`jsx-a11y/${rule}`] = 'off';
  return acc;
}, {});

module.exports = ({ tsconfigRootDir }) =>
  defineConfig(
    includeIgnoreFile(path.resolve('.', '.gitignore')),
    ...jsConfig,
    ...reactConfig,
    ...typescriptConfig,
    ...prettierConfig,
    ...jestConfig,
    ...playwrightConfig,
    {
      files: ['**/*.{ts,tsx,cts,mts}'],
      plugins: {
        'unused-imports': unusedImports,
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      languageOptions: {
        parserOptions: {
          // Make sure eslint and VS Code use the same path for the tsconfig.json:
          // https://github.com/typescript-eslint/typescript-eslint/issues/251
          tsconfigRootDir,
          project: `./tsconfig.eslint.json`,
        },
        globals: {
          ...globals.node,
          ...globals.browser,
          ...globals.es6,
          Atomics: 'readonly',
          SharedArrayBuffer: 'readonly',
        },
      },

      rules: {
        ...jsxA11yOffRules,
        'arrow-body-style': 'off',
        'class-methods-use-this': 'off',
        curly: [2, 'all'],
        'linebreak-style': 'off',
        'no-promise-executor-return': 'warn',
        'no-await-in-loop': 'warn',
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
        'no-void': 'warn',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
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
              },
            ],
          },
        ],
        'prefer-arrow-callback': 'warn',
        '@typescript-eslint/no-require-imports': 'warn',
        '@typescript-eslint/consistent-indexed-object-style': 'off',
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/class-methods-use-this': 'off',
        '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
        '@typescript-eslint/no-empty-object-type': 'warn',
        '@typescript-eslint/prefer-destructuring': 'warn',
        '@typescript-eslint/no-shadow': 'warn',
        '@typescript-eslint/no-use-before-define': 'warn',
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
        'no-param-reassign': ['warn', { props: true, ignorePropertyModificationsFor: ['state'] }],
        'import-x/no-extraneous-dependencies': 'off',
        'import-x/no-webpack-loader-syntax': 'off',
        'import-x/no-unresolved': 'off',
        'import-x/prefer-default-export': 'off',
        'import-x/order': [
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
            ignoreDeclarationSort: true,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
            allowSeparatedGroups: true,
          },
        ],
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': 'off',
        'prefer-destructuring': ['warn', { object: true, array: false }],
        'prefer-rest-params': 'warn',
        'prefer-promise-reject-errors': 'warn',
        'prefer-spread': 'warn',
        // Not required with the new JSX transform
        'react/react-in-jsx-scope': 'off',
        'react/function-component-definition': 'warn',
        'react/no-unstable-nested-components': 'warn',
        'react/no-array-index-key': 'warn',
        'react/jsx-no-useless-fragment': 'warn',
        'react/jsx-pascal-case': 'warn',
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
        'react-hooks/exhaustive-deps': [
          'error',
          {
            additionalHooks: '(useTriggerFrame|useDeepEffect|useDeepMemo|useDeepCallback|useDeepCompareEffect)',
          },
        ],
        'react-hooks/refs': 'warn',
        'react-hooks/purity': 'warn',
        'react-hooks/immutability': 'warn',
        'react-hooks/use-memo': 'warn',
        'react-hooks/preserve-manual-memoization': 'warn',
        'react-hooks/set-state-in-render': 'warn',
        'react-hooks/set-state-in-effect': 'warn',
        'react-hooks/static-components': 'warn',
        '@stylistic/indent': 'off',
        '@stylistic/comma-dangle': 'off',
      },
    },
  );
