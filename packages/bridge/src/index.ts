// WebSocket communication layer for figma-story-plugin

import type { SyncMessage, isValidSyncMessage } from '@figma-story-plugin/shared';
import { WebSocketServer, WebSocket } from 'ws';
import { createHash, randomBytes } from 'crypto';

export interface BridgeOptions {
  port?: number;
  host?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  authToken?: string;
  rateLimit?: {
    maxMessages: number;
    windowMs: number;
  };
}

export interface BridgeConnection {
  id: string;
  type: 'storybook' | 'figma';
  ws: WebSocket;
  authenticated: boolean;
  send: (message: SyncMessage) => void;
  messageCount: number;
  windowStart: number;
}

export class SyncBridge {
  private connections = new Map<string, BridgeConnection>();
  private server?: WebSocketServer;
  private authToken: string;

  constructor(private options: BridgeOptions = {}) {
    // Generate secure auth token if not provided
    this.authToken = options.authToken || this.generateAuthToken();
  }

  private generateAuthToken(): string {
    return createHash('sha256').update(randomBytes(32)).digest('hex');
  }

  private isRateLimited(connection: BridgeConnection): boolean {
    const { rateLimit } = this.options;
    if (!rateLimit) return false;

    const now = Date.now();
    
    // Reset window if needed
    if (now - connection.windowStart > rateLimit.windowMs) {
      connection.messageCount = 0;
      connection.windowStart = now;
    }

    return connection.messageCount >= rateLimit.maxMessages;
  }

  private validateAndSanitizeMessage(data: unknown): SyncMessage | null {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      // Validate message structure using shared validation
      if (!isValidSyncMessage(data)) {
        return null;
      }

      return data as SyncMessage;
    } catch {
      return null;
    }
  }

  async start(): Promise<void> {
    const port = this.options.port || 8080;
    const host = this.options.host || 'localhost';

    this.server = new WebSocketServer({ 
      port, 
      host,
      verifyClient: (info) => {
        // Basic origin validation
        const origin = info.origin;
        return !origin || 
               origin.includes('localhost') || 
               origin.includes('127.0.0.1') ||
               origin.includes('storybook');
      }
    });

    this.server.on('connection', (ws, request) => {
      const connectionId = randomBytes(16).toString('hex');
      
      const connection: BridgeConnection = {
        id: connectionId,
        type: 'storybook', // Default, will be updated during auth
        ws,
        authenticated: false,
        messageCount: 0,
        windowStart: Date.now(),
        send: (message: SyncMessage) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        }
      };

      this.connections.set(connectionId, connection);

      // Set up message handler
      ws.on('message', (data) => {
        // Rate limiting check
        if (this.isRateLimited(connection)) {
          connection.send({
            type: 'error',
            payload: { error: { message: 'Rate limit exceeded' } },
            timestamp: Date.now()
          });
          return;
        }

        connection.messageCount++;

        const message = this.validateAndSanitizeMessage(data);
        if (!message) {
          connection.send({
            type: 'error',
            payload: { error: { message: 'Invalid message format' } },
            timestamp: Date.now()
          });
          return;
        }

        this.handleMessage(connectionId, message);
      });

      ws.on('close', () => {
        this.connections.delete(connectionId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connections.delete(connectionId);
      });

      // Request authentication
      connection.send({
        type: 'error', // Using error type for auth request
        payload: { 
          error: { 
            message: 'Authentication required',
            code: 'AUTH_REQUIRED' 
          }
        },
        timestamp: Date.now()
      });
    });

    console.log(`Bridge server started on ${host}:${port}`);
    console.log(`Auth token: ${this.authToken}`);
  }

  private handleMessage(connectionId: string, message: SyncMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Handle authentication
    if (!connection.authenticated) {
      if (message.type === 'error' && 
          message.payload.error?.code === 'AUTH' &&
          message.payload.error?.details?.token === this.authToken) {
        connection.authenticated = true;
        connection.type = (message.payload.error?.details?.type as 'storybook' | 'figma') || 'storybook';
        
        connection.send({
          type: 'sync_complete',
          payload: { status: 'authenticated' },
          timestamp: Date.now()
        });
        return;
      } else {
        connection.send({
          type: 'error',
          payload: { error: { message: 'Authentication failed' } },
          timestamp: Date.now()
        });
        connection.ws.close();
        return;
      }
    }

    // Handle authenticated messages
    this.broadcast(message, connectionId);
  }

  async stop(): Promise<void> {
    if (this.server) {
      // Close all connections
      for (const connection of this.connections.values()) {
        connection.ws.close();
      }
      
      this.connections.clear();
      
      // Close server
      return new Promise((resolve, reject) => {
        this.server!.close((error) => {
          if (error) {
            reject(error);
          } else {
            console.log('Bridge server stopped');
            resolve();
          }
        });
      });
    }
  }

  getAuthToken(): string {
    return this.authToken;
  }

  addConnection(connection: BridgeConnection): void {
    this.connections.set(connection.id, connection);
  }

  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.ws.close();
      this.connections.delete(id);
    }
  }

  broadcast(message: SyncMessage, excludeId?: string): void {
    for (const [id, connection] of this.connections) {
      if (id !== excludeId && connection.authenticated) {
        connection.send(message);
      }
    }
  }

  sendToTarget(targetId: string, message: SyncMessage): boolean {
    const connection = this.connections.get(targetId);
    if (connection && connection.authenticated) {
      connection.send(message);
      return true;
    }
    return false;
  }

  getConnectedClients(): Array<{id: string, type: 'storybook' | 'figma', authenticated: boolean}> {
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      type: conn.type,
      authenticated: conn.authenticated
    }));
  }
}

export const createBridge = (options?: BridgeOptions): SyncBridge => {
  return new SyncBridge(options);
};