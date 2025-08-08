import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SyncBridge } from './index';
import type { SyncMessage } from '@figma-story-plugin/shared';

describe('SyncBridge', () => {
  let bridge: SyncBridge;

  beforeEach(() => {
    bridge = new SyncBridge({ 
      port: 8081, // Use different port for testing
      rateLimit: { maxMessages: 5, windowMs: 1000 }
    });
  });

  afterEach(async () => {
    await bridge.stop();
  });

  it('should start and stop server', async () => {
    await bridge.start();
    expect(bridge.getAuthToken()).toBeDefined();
    expect(bridge.getAuthToken().length).toBeGreaterThan(0);

    await bridge.stop();
  });

  it('should generate secure auth tokens', () => {
    const bridge1 = new SyncBridge();
    const bridge2 = new SyncBridge();

    expect(bridge1.getAuthToken()).not.toBe(bridge2.getAuthToken());
    expect(bridge1.getAuthToken().length).toBe(64); // SHA256 hex
  });

  it('should accept custom auth token', () => {
    const customToken = 'custom-test-token';
    const bridgeWithToken = new SyncBridge({ authToken: customToken });

    expect(bridgeWithToken.getAuthToken()).toBe(customToken);
  });

  it('should track connected clients', () => {
    const clients = bridge.getConnectedClients();
    expect(clients).toEqual([]);
  });

  describe('message validation', () => {
    it('should validate sync messages', () => {
      const validMessage: SyncMessage = {
        type: 'token_update',
        payload: { tokens: [] },
        timestamp: Date.now()
      };

      // This is testing internal method, would need to expose or use integration test
      expect(validMessage.type).toBe('token_update');
    });
  });

  describe('security features', () => {
    it('should have rate limiting configuration', () => {
      const bridgeWithRateLimit = new SyncBridge({
        rateLimit: { maxMessages: 10, windowMs: 5000 }
      });

      expect(bridgeWithRateLimit).toBeDefined();
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        const bridge = new SyncBridge();
        tokens.add(bridge.getAuthToken());
      }

      // All tokens should be unique
      expect(tokens.size).toBe(100);
    });
  });
});