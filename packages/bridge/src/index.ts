// WebSocket communication layer for figma-story-plugin

import type { SyncMessage } from '@figma-story-plugin/shared';

export interface BridgeOptions {
  port?: number;
  host?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface BridgeConnection {
  id: string;
  type: 'storybook' | 'figma';
  send: (message: SyncMessage) => void;
}

export class SyncBridge {
  private connections = new Map<string, BridgeConnection>();
  private server?: any; // WebSocket server

  constructor(private options: BridgeOptions = {}) {}

  async start(): Promise<void> {
    // TODO: Initialize WebSocket server
    console.log('Bridge server starting...');
  }

  async stop(): Promise<void> {
    // TODO: Close WebSocket server and connections
    console.log('Bridge server stopping...');
  }

  addConnection(connection: BridgeConnection): void {
    this.connections.set(connection.id, connection);
  }

  removeConnection(id: string): void {
    this.connections.delete(id);
  }

  broadcast(message: SyncMessage, excludeId?: string): void {
    for (const [id, connection] of this.connections) {
      if (id !== excludeId) {
        connection.send(message);
      }
    }
  }

  sendToTarget(targetId: string, message: SyncMessage): boolean {
    const connection = this.connections.get(targetId);
    if (connection) {
      connection.send(message);
      return true;
    }
    return false;
  }
}

export const createBridge = (options?: BridgeOptions): SyncBridge => {
  return new SyncBridge(options);
};