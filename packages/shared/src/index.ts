// Shared types and utilities for figma-story-plugin

export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'typography' | 'spacing' | 'effect';
  path: string[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  valuesByMode: Record<string, string>;
  resolvedType: VariableResolvedDataType;
}

export interface TokenMapping {
  token: DesignToken;
  variable?: FigmaVariable;
  status: 'pending' | 'synced' | 'error';
}

export interface SyncMessage {
  type: 'token_update' | 'variable_update' | 'sync_complete' | 'error';
  payload: SyncMessagePayload;
  timestamp: number;
}

export interface SyncMessagePayload {
  tokens?: DesignToken[];
  variables?: FigmaVariable[];
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  status?: string;
}

export type VariableResolvedDataType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export const isValidToken = (token: unknown): token is DesignToken => {
  return (
    typeof token === 'object' &&
    token !== null &&
    'name' in token &&
    'value' in token &&
    'type' in token &&
    'path' in token &&
    typeof (token as DesignToken).name === 'string' &&
    typeof (token as DesignToken).value === 'string' &&
    ['color', 'typography', 'spacing', 'effect'].includes((token as DesignToken).type) &&
    Array.isArray((token as DesignToken).path) &&
    (token as DesignToken).path.every((p: unknown) => typeof p === 'string')
  );
};

export const isValidSyncMessage = (message: unknown): message is SyncMessage => {
  if (typeof message !== 'object' || message === null) return false;
  
  const msg = message as SyncMessage;
  return (
    typeof msg.type === 'string' &&
    ['token_update', 'variable_update', 'sync_complete', 'error'].includes(msg.type) &&
    typeof msg.timestamp === 'number' &&
    msg.timestamp > 0 &&
    typeof msg.payload === 'object' &&
    msg.payload !== null
  );
};

export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and limit length
  return input
    .replace(/[<>'"&]/g, '') // Remove HTML/XML special characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .slice(0, 1000); // Limit to reasonable length
};

export const sanitizeToken = (token: unknown): DesignToken | null => {
  if (!isValidToken(token)) return null;
  
  return {
    name: sanitizeString(token.name),
    value: sanitizeString(token.value),
    type: token.type,
    path: token.path.map(p => sanitizeString(p)).filter(p => p.length > 0)
  };
};

// Re-export token mapping utilities
export * from './token-mapping.js';