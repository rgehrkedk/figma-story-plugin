import '../src/design-system.css';

/** @type { import('@storybook/html').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      description: {
        component: 'Demo components showcasing design token synchronization between Storybook and Figma.',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#333333',
        },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', left: '🌞' },
          { value: 'dark', title: 'Dark', left: '🌚' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      return `
        <div class="storybook-decorator" data-theme="${theme}" style="
          padding: 1rem;
          background: ${theme === 'dark' ? 'var(--color-gray-800)' : 'var(--color-surface-primary)'};
          color: ${theme === 'dark' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)'};
          min-height: 200px;
        ">
          ${Story()}
        </div>
      `;
    },
  ],
};

export default preview;