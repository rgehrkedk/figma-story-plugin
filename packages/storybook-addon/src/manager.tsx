// Storybook addon manager for figma-story-plugin

import React, { useState, useEffect, useCallback } from 'react';
import { addons, types } from '@storybook/manager-api';
import { AddonPanel } from '@storybook/components';
import type { DesignToken, SyncMessage } from '@figma-story-plugin/shared';
import { createParser } from '@figma-story-plugin/parser';

const ADDON_ID = 'figma-story-plugin';
const PANEL_ID = `${ADDON_ID}/panel`;

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected';
  url: string;
  authToken: string;
  ws: WebSocket | null;
}

interface SyncState {
  tokens: DesignToken[];
  isExtracting: boolean;
  lastSync: number | null;
  errors: string[];
}

const FigmaPanel: React.FC<{ active: boolean }> = ({ active }) => {
  const [connection, setConnection] = useState<ConnectionState>({
    status: 'disconnected',
    url: 'ws://localhost:8080',
    authToken: '',
    ws: null
  });

  const [sync, setSync] = useState<SyncState>({
    tokens: [],
    isExtracting: false,
    lastSync: null,
    errors: []
  });

  const [logs, setLogs] = useState<string[]>(['Ready to connect...']);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `[${timestamp}] ${message}`]);
  }, []);

  const connectToBridge = useCallback(async () => {
    if (!connection.url || !connection.authToken) {
      addLog('Error: Bridge URL and auth token are required');
      return;
    }

    setConnection(prev => ({ ...prev, status: 'connecting' }));
    addLog(`Connecting to ${connection.url}...`);

    try {
      const ws = new WebSocket(connection.url);
      
      ws.onopen = () => {
        addLog('WebSocket connected, authenticating...');
        
        const authMessage: SyncMessage = {
          type: 'error',
          payload: {
            error: {
              code: 'AUTH',
              details: {
                token: connection.authToken,
                type: 'storybook'
              }
            }
          },
          timestamp: Date.now()
        };
        
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message: SyncMessage = JSON.parse(event.data);
          
          if (message.type === 'sync_complete' && message.payload.status === 'authenticated') {
            setConnection(prev => ({ ...prev, status: 'connected', ws }));
            addLog('Authentication successful - connected to bridge');
          } else if (message.type === 'error') {
            addLog(`Bridge error: ${message.payload.error?.message || 'Unknown error'}`);
            if (message.payload.error?.message === 'Authentication failed') {
              ws.close();
            }
          }
        } catch (error) {
          addLog(`Message parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      ws.onclose = () => {
        addLog('WebSocket connection closed');
        setConnection(prev => ({ ...prev, status: 'disconnected', ws: null }));
      };

      ws.onerror = () => {
        addLog('WebSocket connection error');
        setConnection(prev => ({ ...prev, status: 'disconnected' }));
      };

    } catch (error) {
      addLog(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnection(prev => ({ ...prev, status: 'disconnected' }));
    }
  }, [connection.url, connection.authToken, addLog]);

  const disconnect = useCallback(() => {
    if (connection.ws) {
      connection.ws.close();
    }
    setConnection(prev => ({ ...prev, status: 'disconnected', ws: null }));
    addLog('Disconnected from bridge');
  }, [connection.ws, addLog]);

  const extractTokens = useCallback(async () => {
    if (!active) return;

    setSync(prev => ({ ...prev, isExtracting: true, errors: [] }));
    addLog('Extracting design tokens from current story...');

    try {
      const parser = createParser({ 
        includeCSSVariables: true, 
        colorFormats: ['hex', 'rgb', 'hsl', 'named'] 
      });

      // Extract tokens from document styles
      const styleSheets = Array.from(document.styleSheets);
      const allTokens: DesignToken[] = [];
      const errors: string[] = [];

      for (const styleSheet of styleSheets) {
        try {
          if (styleSheet.href && styleSheet.href.includes('localhost')) {
            // Skip external stylesheets for security
            continue;
          }
          
          const rules = Array.from(styleSheet.cssRules || []);
          
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              const cssText = rule.cssText;
              const result = await parser.parseCSS(cssText, styleSheet.href || 'inline');
              
              allTokens.push(...result.tokens);
              if (result.errors.length > 0) {
                errors.push(...result.errors.map(e => e.message));
              }
            }
          }
        } catch (error) {
          errors.push(`Failed to process stylesheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Deduplicate tokens by name
      const uniqueTokens = allTokens.reduce((acc, token) => {
        const existing = acc.find(t => t.name === token.name);
        if (!existing) {
          acc.push(token);
        }
        return acc;
      }, [] as DesignToken[]);

      setSync(prev => ({ 
        ...prev, 
        tokens: uniqueTokens, 
        isExtracting: false, 
        lastSync: Date.now(),
        errors 
      }));

      addLog(`Extracted ${uniqueTokens.length} unique color tokens`);

      // Send tokens to bridge if connected
      if (connection.status === 'connected' && connection.ws) {
        const message: SyncMessage = {
          type: 'token_update',
          payload: { tokens: uniqueTokens },
          timestamp: Date.now()
        };
        
        connection.ws.send(JSON.stringify(message));
        addLog(`Sent ${uniqueTokens.length} tokens to Figma via bridge`);
      } else {
        addLog('Not connected to bridge - tokens extracted but not sent');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSync(prev => ({ ...prev, isExtracting: false, errors: [errorMessage] }));
      addLog(`Token extraction failed: ${errorMessage}`);
    }
  }, [active, connection.status, connection.ws, addLog]);

  // Auto-extract tokens when story changes
  useEffect(() => {
    if (active && connection.status === 'connected') {
      const timer = setTimeout(extractTokens, 1000);
      return () => clearTimeout(timer);
    }
  }, [active, connection.status, extractTokens]);

  const panelStyle: React.CSSProperties = {
    padding: '16px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    height: '100%',
    overflow: 'auto'
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0'
  };

  const statusStyle = (status: ConnectionState['status']): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '12px',
    backgroundColor: status === 'connected' ? '#e8f5e8' : status === 'connecting' ? '#fff3e0' : '#ffebee',
    color: status === 'connected' ? '#2e7d2e' : status === 'connecting' ? '#ef6c00' : '#c62828'
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '8px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    marginRight: '8px',
    marginBottom: '8px'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#1EA7FD',
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f0f0f0',
    color: '#333'
  };

  const logStyle: React.CSSProperties = {
    backgroundColor: '#f8f8f8',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
    height: '120px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap'
  };

  return (
    <div style={panelStyle}>
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Figma Variables Sync</h3>
        
        <div style={statusStyle(connection.status)}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            marginRight: '8px'
          }} />
          {connection.status === 'connected' ? 'Connected to bridge' :
           connection.status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
            Bridge URL:
          </label>
          <input
            type="text"
            value={connection.url}
            onChange={(e) => setConnection(prev => ({ ...prev, url: e.target.value }))}
            placeholder="ws://localhost:8080"
            style={inputStyle}
            disabled={connection.status === 'connected'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: '500' }}>
            Auth Token:
          </label>
          <input
            type="password"
            value={connection.authToken}
            onChange={(e) => setConnection(prev => ({ ...prev, authToken: e.target.value }))}
            placeholder="Enter bridge auth token"
            style={inputStyle}
            disabled={connection.status === 'connected'}
          />
        </div>

        {connection.status === 'connected' ? (
          <button onClick={disconnect} style={secondaryButtonStyle}>
            Disconnect
          </button>
        ) : (
          <button 
            onClick={connectToBridge} 
            style={primaryButtonStyle}
            disabled={connection.status === 'connecting'}
          >
            {connection.status === 'connecting' ? 'Connecting...' : 'Connect to Bridge'}
          </button>
        )}
      </div>

      <div style={sectionStyle}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Token Extraction</h4>
        
        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
          Tokens found: {sync.tokens.length}
          {sync.lastSync && (
            <span style={{ marginLeft: '12px' }}>
              Last sync: {new Date(sync.lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>

        <button 
          onClick={extractTokens} 
          style={primaryButtonStyle}
          disabled={sync.isExtracting}
        >
          {sync.isExtracting ? 'Extracting...' : 'Extract Tokens'}
        </button>

        {sync.tokens.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>Extracted Tokens:</h5>
            <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '11px' }}>
              {sync.tokens.map((token, index) => (
                <div key={index} style={{ 
                  padding: '4px 8px', 
                  marginBottom: '2px', 
                  backgroundColor: '#f5f5f5',
                  borderRadius: '2px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: '500' }}>{token.name}</span>
                  <span style={{ color: '#666' }}>{token.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sync.errors.length > 0 && (
          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
            <h5 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#c62828' }}>Errors:</h5>
            {sync.errors.map((error, index) => (
              <div key={index} style={{ fontSize: '11px', color: '#c62828' }}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Connection Log</h4>
        <div style={logStyle}>
          {logs.join('\n')}
        </div>
      </div>
    </div>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Figma Sync',
    render: ({ active }) => <FigmaPanel active={active} />,
  });
});