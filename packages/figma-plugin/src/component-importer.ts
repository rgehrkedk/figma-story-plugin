// Component import and variable binding for Figma plugin

import type { DesignToken, TokenMapping } from '@figma-story-plugin/shared';

export interface ComponentImportOptions {
  name: string;
  tokens: DesignToken[];
  mappings: TokenMapping[];
}

export interface FigmaComponentData {
  id: string;
  name: string;
  type: 'COMPONENT';
  children: FigmaNodeData[];
  fills?: Paint[];
  strokes?: Paint[];
}

export interface FigmaNodeData {
  id: string;
  name: string;
  type: string;
  fills?: Paint[];
  strokes?: Paint[];
  characters?: string;
}

export interface Paint {
  type: 'SOLID' | 'GRADIENT' | 'IMAGE';
  color?: RGB;
  boundVariables?: { [key: string]: VariableAlias };
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

/**
 * Create a basic Button component in Figma with variable bindings
 */
export const createButtonComponent = async (
  options: ComponentImportOptions
): Promise<FigmaComponentData> => {
  const { name, tokens, mappings } = options;

  // Find relevant color tokens for button styling
  const primaryColorToken = tokens.find(t => 
    t.name.includes('brand-primary') || t.name.includes('primary')
  );
  
  const textColorToken = tokens.find(t => 
    t.name.includes('named-white') || t.name.includes('text-inverse')
  );

  // Create button component structure
  const buttonComponent: FigmaComponentData = {
    id: `component_${Date.now()}`,
    name: name,
    type: 'COMPONENT',
    children: [
      {
        id: `text_${Date.now()}`,
        name: 'Button Text',
        type: 'TEXT',
        characters: 'Button',
        fills: textColorToken ? [{
          type: 'SOLID',
          boundVariables: {
            color: {
              type: 'VARIABLE_ALIAS',
              id: findVariableId(textColorToken, mappings)
            }
          }
        }] : undefined
      }
    ],
    fills: primaryColorToken ? [{
      type: 'SOLID',
      boundVariables: {
        color: {
          type: 'VARIABLE_ALIAS',
          id: findVariableId(primaryColorToken, mappings)
        }
      }
    }] : undefined
  };

  return buttonComponent;
};

/**
 * Find the corresponding Figma variable ID for a token
 */
const findVariableId = (token: DesignToken, mappings: TokenMapping[]): string => {
  const mapping = mappings.find(m => m.token.name === token.name);
  return mapping?.variable?.id || 'unknown';
};

/**
 * Convert hex color to Figma RGB format
 */
export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  };
};

/**
 * Create component variants for different button states
 */
export const createButtonVariants = async (
  baseComponent: FigmaComponentData,
  tokens: DesignToken[],
  mappings: TokenMapping[]
): Promise<FigmaComponentData[]> => {
  const variants: FigmaComponentData[] = [baseComponent];

  // Create variants for different states: primary, secondary, success, etc.
  const variantConfigs = [
    { name: 'Secondary', tokenName: 'interactive-secondary' },
    { name: 'Success', tokenName: 'success' },
    { name: 'Warning', tokenName: 'warning' },
    { name: 'Danger', tokenName: 'error' }
  ];

  for (const config of variantConfigs) {
    const colorToken = tokens.find(t => t.name.includes(config.tokenName));
    
    if (colorToken) {
      const variant: FigmaComponentData = {
        ...baseComponent,
        id: `component_${config.name.toLowerCase()}_${Date.now()}`,
        name: `${baseComponent.name}/${config.name}`,
        fills: [{
          type: 'SOLID',
          boundVariables: {
            color: {
              type: 'VARIABLE_ALIAS',
              id: findVariableId(colorToken, mappings)
            }
          }
        }]
      };
      
      variants.push(variant);
    }
  }

  return variants;
};

/**
 * Extract component information from Storybook story
 */
export const parseStorybookComponent = (storyContent: string) => {
  // Simple regex-based parsing for demo purposes
  const componentNameMatch = storyContent.match(/title:\s*['"`]([^'"`]+)['"`]/);
  const componentName = componentNameMatch ? componentNameMatch[1] : 'Component';

  // Extract variant configurations
  const variantMatches = storyContent.match(/export const (\w+) = {/g) || [];
  const variants = variantMatches.map(match => {
    const variantName = match.match(/export const (\w+) = {/)?.[1];
    return variantName || 'Unknown';
  }).filter(name => name !== 'Unknown');

  return {
    name: componentName.split('/').pop() || componentName,
    variants,
    hasColorTokens: storyContent.includes('var(--') || storyContent.includes('--color'),
    hasTypographyTokens: storyContent.includes('--font') || storyContent.includes('--text'),
    hasSpacingTokens: storyContent.includes('--spacing') || storyContent.includes('--gap')
  };
};