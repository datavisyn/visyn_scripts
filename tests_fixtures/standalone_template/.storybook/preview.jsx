import '../workspace.scss';

/**
 * @type {import('@storybook/react').Parameters}
 */
export const parameters = {
  layout: 'fullscreen',
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
