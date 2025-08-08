export default {
  title: 'Demo/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'warning', 'danger'],
      description: 'Button variant using design tokens',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    label: {
      control: 'text',
      description: 'Button text',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
Button component demonstrating design token usage. This component uses CSS custom properties
that will be extracted and synchronized to Figma as variables.

**Design Tokens Used:**
- Primary colors: \`--color-brand-primary\`, \`--color-brand-secondary\`
- Semantic colors: \`--color-success\`, \`--color-warning\`, \`--color-error\`
- Text colors: \`--color-named-white\`, \`--color-text-primary\`
        `,
      },
    },
  },
};

// Button CSS that uses design tokens
const buttonStyles = `
  <style>
    .demo-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border: 1px solid;
      border-radius: var(--border-radius-md);
      font-family: var(--font-family-primary);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      background-color: var(--btn-bg);
      color: var(--btn-text);
      border-color: var(--btn-border);
    }
    
    .demo-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
      opacity: 0.9;
    }
    
    .demo-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .demo-button--sm {
      padding: 0.375rem 0.75rem;
      font-size: var(--font-size-sm);
    }
    
    .demo-button--md {
      padding: 0.5rem 1rem;
      font-size: var(--font-size-base);
    }
    
    .demo-button--lg {
      padding: 0.75rem 1.5rem;
      font-size: var(--font-size-lg);
    }
  </style>
`;

const createButton = ({ variant = 'primary', size = 'md', disabled = false, label = 'Button' }) => {
  return `
    ${buttonStyles}
    <button 
      class="demo-button demo-button--${size} btn-${variant}" 
      ${disabled ? 'disabled' : ''}
      type="button"
    >
      ${label}
    </button>
  `;
};

export const Primary = {
  args: {
    variant: 'primary',
    label: 'Primary Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Primary button using `--color-brand-primary` design token.',
      },
    },
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
    label: 'Secondary Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary button using `--color-interactive-secondary` and `--color-text-primary` tokens.',
      },
    },
  },
};

export const Success = {
  args: {
    variant: 'success',
    label: 'Success Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Success button using `--color-success` semantic color token.',
      },
    },
  },
};

export const Warning = {
  args: {
    variant: 'warning',
    label: 'Warning Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning button using `--color-warning` semantic color token.',
      },
    },
  },
};

export const Danger = {
  args: {
    variant: 'danger',
    label: 'Danger Button',
  },
  parameters: {
    docs: {
      description: {
        story: 'Danger button using `--color-error` semantic color token.',
      },
    },
  },
};

export const AllVariants = {
  render: () => `
    ${buttonStyles}
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      ${createButton({ variant: 'primary', label: 'Primary' })}
      ${createButton({ variant: 'secondary', label: 'Secondary' })}
      ${createButton({ variant: 'success', label: 'Success' })}
      ${createButton({ variant: 'warning', label: 'Warning' })}
      ${createButton({ variant: 'danger', label: 'Danger' })}
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'All button variants showing different design tokens in use. This story demonstrates the full range of semantic colors available.',
      },
    },
  },
};

export const AllSizes = {
  render: () => `
    ${buttonStyles}
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      ${createButton({ size: 'sm', label: 'Small' })}
      ${createButton({ size: 'md', label: 'Medium' })}
      ${createButton({ size: 'lg', label: 'Large' })}
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Buttons in different sizes, all using the same color tokens.',
      },
    },
  },
};

export const DisabledStates = {
  render: () => `
    ${buttonStyles}
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      ${createButton({ variant: 'primary', disabled: true, label: 'Disabled Primary' })}
      ${createButton({ variant: 'secondary', disabled: true, label: 'Disabled Secondary' })}
      ${createButton({ variant: 'success', disabled: true, label: 'Disabled Success' })}
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Disabled button states showing how opacity affects the design tokens.',
      },
    },
  },
};

// Apply the render function to all stories that need it
Primary.render = createButton;
Secondary.render = createButton;
Success.render = createButton;
Warning.render = createButton;
Danger.render = createButton;