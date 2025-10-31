const { defineConfig } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');
const importPlugin = require('eslint-plugin-import');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactCompiler = require('eslint-plugin-react-compiler');
const unusedImports = require('eslint-plugin-unused-imports');
const pluginJest = require('eslint-plugin-jest');
const playwright = require('eslint-plugin-playwright');
const airbnb = require('eslint-config-airbnb-extended/legacy');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

// Helper to disable jsx-a11y rules
const jsxA11yOffRules = Object.keys(jsxA11y.rules).reduce((acc, rule) => {
  acc[`jsx-a11y/${rule}`] = 'off';
  return acc;
}, {});

module.exports = ({ tsconfigRootDir }) =>
  defineConfig(
    js.configs.recommended,
    ...airbnb.configs.react.typescript,
    importPlugin.flatConfigs.recommended,
    react.configs.flat.recommended,
    reactHooks.configs.flat.recommended,
    reactCompiler.configs.recommended,
    prettierRecommended,

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
        'import/no-extraneous-dependencies': 'off',
        'import/no-webpack-loader-syntax': 'off',
        'import/no-unresolved': 'off',
        'import/prefer-default-export': 'off',
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
            ignoreDeclarationSort: true,
            ignoreMemberSort: false,
            memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
            allowSeparatedGroups: true,
          },
        ],
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': 'off',
        'prefer-destructuring': ['warn', { object: true, array: false }],
        'prefer-promise-reject-errors': 'warn',
        'prefer-spread': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        'react/react-in-jsx-scope': 'off',
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

    {
      files: ['{src|tests}/**/*.{test|spec}.ts'],
      plugins: { jest: pluginJest },
      languageOptions: {
        globals: pluginJest.environments.globals.globals,
      },
    },

    {
      ...playwright.configs['flat/recommended'],
      files: ['playwright/**/*.{test|spec}.ts'],
    },
  );
