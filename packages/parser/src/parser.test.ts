import { describe, it, expect } from 'vitest';
import { TokenParser } from './index';

describe('TokenParser', () => {
  const parser = new TokenParser();

  describe('CSS parsing', () => {
    it('should parse CSS custom properties', async () => {
      const css = `
        :root {
          --primary-color: #007bff;
          --font-size: 16px;
          --spacing-large: 2rem;
        }
      `;

      const result = await parser.parseCSS(css, 'test.css');

      expect(result.errors).toHaveLength(0);
      expect(result.tokens).toHaveLength(3);
      
      const colorToken = result.tokens.find(t => t.name === '--primary-color');
      expect(colorToken).toBeDefined();
      expect(colorToken?.type).toBe('color');
      expect(colorToken?.value).toBe('#007bff');
    });

    it('should handle malformed CSS gracefully', async () => {
      const css = 'invalid css content <<<';

      const result = await parser.parseCSS(css, 'test.css');

      // Should not throw, should handle gracefully
      expect(result.tokens).toHaveLength(0);
    });

    it('should reject overly large CSS input', async () => {
      const largeCss = 'a'.repeat(11_000_000); // 11MB

      const result = await parser.parseCSS(largeCss, 'test.css');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('too large');
    });

    it('should sanitize dangerous content', async () => {
      const css = `
        :root {
          --xss-test: "<script>alert('xss')</script>";
          --data-url: "data:text/html,<script>alert(1)</script>";
        }
      `;

      const result = await parser.parseCSS(css, 'test.css');

      const xssToken = result.tokens.find(t => t.name === '--xss-test');
      expect(xssToken?.value).not.toContain('<script>');
      expect(xssToken?.value).not.toContain('alert');
    });
  });

  describe('JavaScript parsing', () => {
    it('should parse token objects', async () => {
      const js = `
        const colors = {
          primary: "#007bff",
          secondary: "#6c757d"
        };
        
        const spacing = {
          small: "8px",
          medium: "16px"
        };
      `;

      const result = await parser.parseJS(js, 'test.js');

      expect(result.errors).toHaveLength(0);
      expect(result.tokens.length).toBeGreaterThan(0);
      
      const primaryToken = result.tokens.find(t => t.name === 'primary');
      expect(primaryToken).toBeDefined();
      expect(primaryToken?.type).toBe('color');
    });

    it('should reject overly large JS input', async () => {
      const largeJs = 'const x = "' + 'a'.repeat(6_000_000) + '";'; // 6MB+

      const result = await parser.parseJS(largeJs, 'test.js');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('too large');
    });
  });

  describe('File parsing', () => {
    it('should route to correct parser based on extension', async () => {
      const cssResult = await parser.parseFile(':root { --color: red; }', 'test.css');
      expect(cssResult.tokens.length).toBeGreaterThan(0);

      const jsResult = await parser.parseFile('const tokens = { color: "red" };', 'test.js');
      expect(jsResult.tokens.length).toBeGreaterThan(0);
    });

    it('should reject unsupported file types', async () => {
      const result = await parser.parseFile('content', 'test.exe');

      expect(result.tokens).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Unsupported file type');
    });
  });
});