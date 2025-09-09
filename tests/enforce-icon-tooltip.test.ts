// import { RuleTester } from '@typescript-eslint/rule-tester';
// import parser from '@typescript-eslint/parser';
// import rule from '../config/custom-eslint-rules/enforce-icon-tooltip';

const { RuleTester } = require('@typescript-eslint/utils');
const rule = require('./enforce-visyn-icon-tooltip').default;
const parser = require('@typescript-eslint/parser');

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('enforce-icon-tooltip', rule, {
  valid: [
    // Case 1: VisynActionIcon with a valid, non-empty tooltip
    {
      code: '<VisynActionIcon icon={IconLasso} tooltip="Lasso Tool" />;',
    },
    // Case 2: VisynThemeIcon with a valid, non-empty tooltip
    {
      code: '<VisynThemeIcon icon={IconLasso} tooltip="Theme Icon" />;',
    },
    // Case 3: A valid tooltip as a variable
    {
      code: 'const tooltipText = "Hello"; <VisynActionIcon icon={IconLasso} tooltip={tooltipText} />;',
    },
    // Case 4: A valid tooltip with a dynamic expression
    {
      code: '<VisynActionIcon icon={IconLasso} tooltip={`Count: ${items.length}`} />;',
    },
    // Case 5: A valid tooltip as an object with a non-empty label property
    {
      code: '<VisynActionIcon icon={IconLasso} tooltip={{ label: "Lasso Tool", position: "top" }} />;',
    },
  ],

  invalid: [
    // Case 1: VisynActionIcon with no tooltip prop
    {
      code: '<VisynActionIcon icon={IconLasso} />;',
      errors: [{ messageId: 'missingTooltip' }],
    },
    // Case 2: VisynActionIcon with an empty string tooltip
    {
      code: '<VisynActionIcon icon={IconLasso} tooltip="" />;',
      errors: [{ messageId: 'emptyTooltip' }],
    },
    // Case 3: VisynActionIcon with a tooltip prop containing only whitespace
    {
      code: '<VisynActionIcon icon={IconLasso} tooltip="   " />;',
      errors: [{ messageId: 'emptyTooltip' }],
    },
    // Case 4: VisynThemeIcon with no tooltip prop
    {
      code: '<VisynThemeIcon icon={IconLasso} />;',
      errors: [{ messageId: 'missingTooltip' }],
    },
    // Case 5: VisynThemeIcon with an empty string tooltip
    {
      code: '<VisynThemeIcon icon={IconLasso} tooltip="" />;',
      errors: [{ messageId: 'emptyTooltip' }],
    },
    // Case 6: VisynActionIcon with a tooltip as an object with a label property containing only whitespace
    {
      code: '<VisynActionIcon icon={IconLasso} tooltip={{ label: "   ", position: "top" }} />;',
      errors: [{ messageId: 'emptyTooltip' }],
    },
    // Case 7: VisynThemeIcon with a tooltip as an object missing the label property
    {
      code: '<VisynThemeIcon icon={IconLasso} tooltip={{ position: "top" }} />;',
      errors: [{ messageId: 'emptyTooltip' }],
    },
  ],
});