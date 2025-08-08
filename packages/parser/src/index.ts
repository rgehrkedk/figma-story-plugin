// Token parsing and analysis for figma-story-plugin

import type { DesignToken } from '@figma-story-plugin/shared';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

export interface ParseOptions {
  includeCSSVariables?: boolean;
  includeJSTokens?: boolean;
  tokenPaths?: string[];
  colorFormats?: ('hex' | 'rgb' | 'hsl' | 'named')[];
}

export interface ParseResult {
  tokens: DesignToken[];
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  file?: string;
}

export class TokenParser {
  constructor(private options: ParseOptions = {}) {
    // Default to all color formats if none specified
    if (!this.options.colorFormats) {
      this.options.colorFormats = ['hex', 'rgb', 'hsl', 'named'];
    }
  }

  private isColorValue(value: string): boolean {
    const formats = this.options.colorFormats || ['hex', 'rgb', 'hsl', 'named'];
    const trimmedValue = value.trim().toLowerCase();

    // Hex colors
    if (formats.includes('hex') && trimmedValue.match(/^#[0-9a-f]{3,8}$/i)) {
      return true;
    }

    // RGB/RGBA colors
    if (formats.includes('rgb') && trimmedValue.match(/^rgba?\s*\(/)) {
      return true;
    }

    // HSL/HSLA colors
    if (formats.includes('hsl') && trimmedValue.match(/^hsla?\s*\(/)) {
      return true;
    }

    // Named colors
    if (formats.includes('named')) {
      const namedColors = [
        'transparent', 'currentcolor', 'inherit', 'initial', 'unset',
        'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige',
        'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
        'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
        'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
        'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki',
        'darkmagenta', 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred',
        'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
        'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
        'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick',
        'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
        'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey',
        'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki',
        'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
        'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
        'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen',
        'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
        'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
        'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
        'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
        'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
        'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive',
        'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod',
        'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip',
        'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'red',
        'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
        'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
        'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan',
        'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white',
        'whitesmoke', 'yellow', 'yellowgreen'
      ];
      
      return namedColors.includes(trimmedValue);
    }

    return false;
  }

  private containsColorReference(value: string): boolean {
    // Check if value contains var() references to other color variables
    const varMatch = value.match(/var\(--([^)]+)\)/g);
    if (varMatch) {
      // For now, consider any var() reference as potentially color-related
      // In a more sophisticated implementation, we'd track color variables
      return true;
    }
    return false;
  }

  async parseCSS(css: string, filename?: string): Promise<ParseResult> {
    const tokens: DesignToken[] = [];
    const errors: ParseError[] = [];

    try {
      // Input validation and sanitization
      if (typeof css !== 'string') {
        throw new Error('CSS input must be a string');
      }
      
      if (css.length > 10_000_000) { // 10MB limit
        throw new Error('CSS input too large (max 10MB)');
      }

      // Use PostCSS for proper parsing
      const root = postcss.parse(css, { from: filename });

      root.walkDecls((decl) => {
        // Only process CSS custom properties (variables)
        if (!decl.prop.startsWith('--')) return;

        const name = decl.prop.substring(2); // Remove --
        const value = decl.value.trim();

        // Sanitize and validate
        const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
        if (sanitizedName.length === 0 || value.length === 0) return;

        // Focus on color tokens for this iteration
        if (this.isColorValue(value) || this.containsColorReference(value)) {
          // Use PostCSS value parser for complex values
          const parsedValue = valueParser(value);
          let resolvedValue = value;

          // Handle var() references
          parsedValue.walk((node) => {
            if (node.type === 'function' && node.value === 'var') {
              const varName = node.nodes[0]?.value;
              if (varName) {
                // For now, keep the var() reference as-is
                // In a full implementation, we'd resolve these references
                resolvedValue = value;
              }
            }
          });

          tokens.push({
            name: sanitizedName, // Remove the -- prefix since it's already stored in the name
            value: resolvedValue,
            type: 'color',
            path: ['css', 'custom-properties', sanitizedName]
          });
        }
      });

    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        line: error instanceof Error && 'line' in error ? (error as any).line : undefined,
        column: error instanceof Error && 'column' in error ? (error as any).column : undefined,
        file: filename
      });
    }

    return { tokens, errors };
  }

  async parseJS(code: string, filename?: string): Promise<ParseResult> {
    const tokens: DesignToken[] = [];
    const errors: ParseError[] = [];

    try {
      // Input validation and sanitization
      if (typeof code !== 'string') {
        throw new Error('Code input must be a string');
      }
      
      if (code.length > 5_000_000) { // 5MB limit for JS files
        throw new Error('Code input too large (max 5MB)');
      }

      // For security, we'll use regex-based parsing instead of AST for now
      // This avoids potential code injection through malicious AST
      
      // Match token objects: const tokens = { ... }
      const tokenObjectRegex = /(?:const|let|var)\s+(\w+)\s*=\s*\{([^}]+)\}/g;
      let match;

      while ((match = tokenObjectRegex.exec(code)) !== null) {
        const [, objectName, content] = match;
        
        if (!objectName || !content) continue;

        // Parse key-value pairs within the object
        const keyValueRegex = /['"`]?([^'"`:\s]+)['"`]?\s*:\s*['"`]?([^'"`\n,}]+)['"`]?/g;
        let kvMatch;

        while ((kvMatch = keyValueRegex.exec(content)) !== null) {
          const [, key, value] = kvMatch;
          
          if (!key || !value) continue;

          // Sanitize inputs
          const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, '');
          const sanitizedValue = value.trim().replace(/[<>'"]/g, '');
          
          if (sanitizedKey.length === 0 || sanitizedValue.length === 0) continue;

          // Infer token type
          let tokenType: DesignToken['type'] = 'spacing';
          
          if (sanitizedValue.match(/^#[0-9a-fA-F]{3,8}$/) || 
              sanitizedValue.match(/^rgb/) || 
              sanitizedValue.match(/^hsl/)) {
            tokenType = 'color';
          } else if (sanitizedKey.toLowerCase().includes('font') || 
                     sanitizedKey.toLowerCase().includes('text')) {
            tokenType = 'typography';
          } else if (sanitizedKey.toLowerCase().includes('shadow') || 
                     sanitizedKey.toLowerCase().includes('blur')) {
            tokenType = 'effect';
          }

          tokens.push({
            name: sanitizedKey,
            value: sanitizedValue,
            type: tokenType,
            path: ['js', objectName, sanitizedKey]
          });
        }
      }

    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        file: filename
      });
    }

    return { tokens, errors };
  }

  async parseFile(content: string, filename: string): Promise<ParseResult> {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return this.parseCSS(content, filename);
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return this.parseJS(content, filename);
      default:
        return {
          tokens: [],
          errors: [{
            message: `Unsupported file type: ${extension}`,
            file: filename
          }]
        };
    }
  }
}

export const createParser = (options?: ParseOptions): TokenParser => {
  return new TokenParser(options);
};