// Token to Figma variable mapping utilities

import type { DesignToken, FigmaVariable, TokenMapping, VariableResolvedDataType } from './index.js';

export interface TokenToVariableOptions {
  collectionName?: string;
  modeNames?: string[];
}

/**
 * Maps a design token to a Figma variable structure
 */
export const mapTokenToVariable = (
  token: DesignToken, 
  options: TokenToVariableOptions = {}
): FigmaVariable => {
  const { collectionName = 'Design Tokens', modeNames = ['Mode 1'] } = options;

  // Convert token type to Figma variable type
  const resolvedType = getVariableType(token);
  
  // Create variable name (clean format for Figma)
  const variableName = formatVariableName(token.name, token.path);
  
  // Create values by mode - for now, same value for all modes
  const valuesByMode: Record<string, string> = {};
  modeNames.forEach(modeName => {
    valuesByMode[modeName] = formatValueForFigma(token.value, token.type);
  });

  return {
    id: generateVariableId(token),
    name: variableName,
    valuesByMode,
    resolvedType
  };
};

/**
 * Convert token type to Figma variable type
 */
const getVariableType = (token: DesignToken): VariableResolvedDataType => {
  switch (token.type) {
    case 'color':
      return 'COLOR';
    case 'spacing':
    case 'typography':
      return 'FLOAT'; // For numeric values like font-size, spacing
    case 'effect':
      return 'STRING'; // For complex values like box-shadow
    default:
      return 'STRING';
  }
};

/**
 * Format token name for Figma (remove CSS -- prefix, use path for hierarchy)
 */
const formatVariableName = (name: string, path: string[]): string => {
  // Remove -- prefix if present
  let cleanName = name.startsWith('--') ? name.substring(2) : name;
  
  // Convert kebab-case to Title Case with slashes for hierarchy
  const parts = cleanName.split('-');
  const formattedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  );
  
  // Create hierarchical name: Color/Brand/Primary instead of color-brand-primary
  if (cleanName.startsWith('color-')) {
    const colorParts = cleanName.replace('color-', '').split('-');
    return 'Color/' + colorParts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('/');
  }
  
  return formattedParts.join('/');
};

/**
 * Format value for Figma variables
 */
const formatValueForFigma = (value: string, type: DesignToken['type']): string => {
  if (type === 'color') {
    // Figma expects color values in specific formats
    // For now, return the value as-is, but in production we'd convert
    // RGB, HSL, named colors to hex format
    return value;
  }
  
  return value;
};

/**
 * Generate a deterministic ID for the variable
 */
const generateVariableId = (token: DesignToken): string => {
  // Generate a stable ID based on token name and path
  const key = token.name + '|' + token.path.join('/');
  
  // Simple hash function for demo purposes
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `var_${Math.abs(hash).toString(36)}`;
};

/**
 * Create token mappings from a list of design tokens
 */
export const createTokenMappings = (
  tokens: DesignToken[], 
  options: TokenToVariableOptions = {}
): TokenMapping[] => {
  return tokens.map(token => ({
    token,
    variable: mapTokenToVariable(token, options),
    status: 'pending' as const
  }));
};

/**
 * Filter tokens to only include color tokens for current iteration
 */
export const filterColorTokens = (tokens: DesignToken[]): DesignToken[] => {
  return tokens.filter(token => token.type === 'color');
};

/**
 * Organize tokens by semantic groups
 */
export const organizeTokensByGroup = (tokens: DesignToken[]): Record<string, DesignToken[]> => {
  const groups: Record<string, DesignToken[]> = {
    brand: [],
    semantic: [],
    neutral: [],
    interactive: [],
    surface: [],
    text: [],
    border: [],
    other: []
  };

  tokens.forEach(token => {
    const name = token.name.toLowerCase();
    
    if (name.includes('brand') || name.includes('primary') || name.includes('secondary')) {
      groups.brand.push(token);
    } else if (name.includes('success') || name.includes('error') || name.includes('warning') || name.includes('info')) {
      groups.semantic.push(token);
    } else if (name.includes('gray') || name.includes('grey') || name.includes('neutral')) {
      groups.neutral.push(token);
    } else if (name.includes('interactive') || name.includes('hover') || name.includes('focus')) {
      groups.interactive.push(token);
    } else if (name.includes('surface') || name.includes('background') || name.includes('bg')) {
      groups.surface.push(token);
    } else if (name.includes('text') || name.includes('foreground') || name.includes('fg')) {
      groups.text.push(token);
    } else if (name.includes('border') || name.includes('outline')) {
      groups.border.push(token);
    } else {
      groups.other.push(token);
    }
  });

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([, tokens]) => tokens.length > 0)
  );
};