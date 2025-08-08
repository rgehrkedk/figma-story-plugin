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
  payload: unknown;
  timestamp: number;
}

export type VariableResolvedDataType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export const isValidToken = (token: unknown): token is DesignToken => {
  return (
    typeof token === 'object' &&
    token !== null &&
    'name' in token &&
    'value' in token &&
    'type' in token &&
    'path' in token
  );
};