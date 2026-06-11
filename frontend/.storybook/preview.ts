import type { Preview } from '@storybook/react';
import '../src/index.css';
import '../src/components/App/App.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
  },
};

export default preview;
