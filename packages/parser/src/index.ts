// Token parsing and analysis for figma-story-plugin

import type { DesignToken } from '@figma-story-plugin/shared';

export interface ParseOptions {
  includeCSSVariables?: boolean;
  includeJSTokens?: boolean;
  tokenPaths?: string[];
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
  constructor(private options: ParseOptions = {}) {}

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

      // Basic CSS custom properties regex (safer than eval)
      const cssVariableRegex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
      let match;

      while ((match = cssVariableRegex.exec(css)) !== null) {
        const [, name, value] = match;
        
        if (!name || !value) continue;

        // Sanitize and validate
        const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
        const sanitizedValue = value.trim().replace(/[<>'"]/g, '');
        
        if (sanitizedName.length === 0 || sanitizedValue.length === 0) continue;

        // Infer token type from value
        let tokenType: DesignToken['type'] = 'spacing';
        
        if (sanitizedValue.match(/^#[0-9a-fA-F]{3,8}$/) || 
            sanitizedValue.match(/^rgb/) || 
            sanitizedValue.match(/^hsl/) ||
            sanitizedValue.match(/^(red|blue|green|white|black|gray|transparent)$/i)) {
          tokenType = 'color';
        } else if (sanitizedValue.match(/^\d+(\.\d+)?(px|rem|em|pt)$/) ||
                   sanitizedValue.match(/^bold|normal|italic$/i) ||
                   sanitizedValue.match(/^['"]/)) {
          tokenType = 'typography';
        } else if (sanitizedValue.match(/shadow|blur|opacity/i)) {
          tokenType = 'effect';
        }

        tokens.push({
          name: `--${sanitizedName}`,
          value: sanitizedValue,
          type: tokenType,
          path: ['css', 'custom-properties', sanitizedName]
        });
      }

    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parsing error',
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