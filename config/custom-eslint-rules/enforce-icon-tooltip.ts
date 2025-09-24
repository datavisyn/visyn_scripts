import { TSESLint, type TSESTree} from '@typescript-eslint/utils';

type MessageIds = 'missingTooltip' | 'emptyTooltip';

const EnforceVisynIconTooltip: TSESLint.RuleModule<MessageIds> = {
  defaultOptions: [],
  meta: {
    type: 'problem',
    messages: {
      missingTooltip: 'Your icon component is missing a tooltip property.',
      emptyTooltip: 'Your icon component has an empty tooltip property.',
    },
    fixable: 'code', // TODO
    schema: [], // no options TODO
  },
  create: context => ({
    JSXOpeningElement(node) {
      if (isVisynIcon(node)) {
        if (!hasTooltipProp(node)) {
          context.report({ node, messageId: 'missingTooltip' });
        } else if (isTooltipEmpty(node)) {
          context.report({ node, messageId: 'emptyTooltip' });
        }
      }
    },
  })
}

export default EnforceVisynIconTooltip;

function isVisynIcon(node: TSESTree.JSXOpeningElement): boolean {
  // Check if the component name matches a known icon component
  if (node.name.type === 'JSXIdentifier' && ['VisynThemeIcon', 'VisynActionIcon'].includes(node.name.name)) {
    return true;
  }
  return false;
}

function hasTooltipProp(node: TSESTree.JSXOpeningElement): boolean {
  return node.attributes.some(attr => {
    return attr.type === 'JSXAttribute' && attr.name.name === 'tooltip';
  });
}

function isTooltipEmpty(node: TSESTree.JSXOpeningElement): boolean {
  const tooltipAttr = node.attributes.find(attr => {
    return attr.type === 'JSXAttribute' && attr.name.name === 'tooltip';
  }) as TSESTree.JSXAttribute | undefined;

  if (tooltipAttr && tooltipAttr.value) {
    // tooltip as string
    if (tooltipAttr.value.type === 'Literal' && typeof tooltipAttr.value.value === 'string') {
      return tooltipAttr.value.value.trim() === '';
    }

    // tooltip as object with label property
    if (tooltipAttr.value.type === 'JSXExpressionContainer') {
      if (tooltipAttr.value.expression.type === 'ObjectExpression') {
        const labelProp = tooltipAttr.value.expression.properties.find(prop => {
          return prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'label';
        }) as TSESTree.Property | undefined;
        if (labelProp && labelProp.value.type === 'Literal' && typeof labelProp.value.value === 'string') {
          return labelProp.value.value.trim() === '';
        }
      }
    }
    return false; // If tooltip value exists and is not empty
  }
  return true; // Consider empty if no value or unhandled type
}
