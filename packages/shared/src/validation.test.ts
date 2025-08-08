import { describe, it, expect } from 'vitest';
import { isValidToken, isValidSyncMessage, sanitizeString, sanitizeToken } from './index';
import type { DesignToken, SyncMessage } from './index';

describe('Validation Functions', () => {
  describe('isValidToken', () => {
    it('should validate correct token structure', () => {
      const validToken: DesignToken = {
        name: 'primary-color',
        value: '#007bff',
        type: 'color',
        path: ['colors', 'primary']
      };

      expect(isValidToken(validToken)).toBe(true);
    });

    it('should reject invalid token structures', () => {
      expect(isValidToken(null)).toBe(false);
      expect(isValidToken(undefined)).toBe(false);
      expect(isValidToken({})).toBe(false);
      expect(isValidToken({ name: 'test' })).toBe(false);
      expect(isValidToken({ name: 123, value: 'test', type: 'color', path: [] })).toBe(false);
      expect(isValidToken({ name: 'test', value: 'test', type: 'invalid', path: [] })).toBe(false);
      expect(isValidToken({ name: 'test', value: 'test', type: 'color', path: [123] })).toBe(false);
    });
  });

  describe('isValidSyncMessage', () => {
    it('should validate correct message structure', () => {
      const validMessage: SyncMessage = {
        type: 'token_update',
        payload: { tokens: [] },
        timestamp: Date.now()
      };

      expect(isValidSyncMessage(validMessage)).toBe(true);
    });

    it('should reject invalid message structures', () => {
      expect(isValidSyncMessage(null)).toBe(false);
      expect(isValidSyncMessage({})).toBe(false);
      expect(isValidSyncMessage({ type: 'invalid' })).toBe(false);
      expect(isValidSyncMessage({ type: 'token_update' })).toBe(false);
      expect(isValidSyncMessage({ 
        type: 'token_update', 
        payload: {}, 
        timestamp: -1 
      })).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeString('data:text/html,<h1>test</h1>')).toBe('text/html,h1testh1');
    });

    it('should trim and limit length', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('a'.repeat(2000))).toHaveLength(1000);
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123 as any)).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('sanitizeToken', () => {
    it('should sanitize valid tokens', () => {
      const token = {
        name: '  <script>primary</script>  ',
        value: 'javascript:#007bff',
        type: 'color' as const,
        path: ['<colors>', 'primary', '']
      };

      const sanitized = sanitizeToken(token);

      expect(sanitized).not.toBeNull();
      expect(sanitized!.name).toBe('scriptprimary/script');
      expect(sanitized!.value).toBe('#007bff');
      expect(sanitized!.path).toEqual(['colors', 'primary']); // Empty strings filtered out
    });

    it('should return null for invalid tokens', () => {
      expect(sanitizeToken(null)).toBeNull();
      expect(sanitizeToken({ invalid: 'structure' })).toBeNull();
    });
  });
});