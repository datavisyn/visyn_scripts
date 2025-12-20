import '../workspace.scss';

/**
 * @type {import('@storybook/react').Preview}
 */
export default {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};
