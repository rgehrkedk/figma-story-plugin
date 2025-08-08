// Main Figma plugin code

import type { SyncMessage, DesignToken, isValidSyncMessage, sanitizeToken } from '@figma-story-plugin/shared';

console.log('Figma Story Plugin loaded');

// Error handler
function handleError(error: unknown, context: string): void {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[${context}] Error:`, errorMessage);
  
  figma.ui.postMessage({
    type: 'error',
    payload: { 
      error: { 
        message: errorMessage,
        code: 'PLUGIN_ERROR',
        details: { context }
      }
    },
    timestamp: Date.now()
  } as SyncMessage);
}

// Show the plugin UI with error boundary
try {
  figma.showUI(__html__, {
    width: 300,
    height: 400,
    title: 'Figma Story Sync'
  });
} catch (error) {
  handleError(error, 'UI_INITIALIZATION');
}

// Handle messages from UI with validation
figma.ui.onmessage = (msg: unknown) => {
  try {
    // Validate message structure
    if (!isValidSyncMessage(msg)) {
      throw new Error('Invalid message format received');
    }

    const syncMessage = msg as SyncMessage;
    console.log('Received message:', syncMessage.type);
    
    switch (syncMessage.type) {
      case 'token_update':
        if (syncMessage.payload.tokens) {
          handleTokenUpdate(syncMessage.payload.tokens);
        }
        break;
      case 'sync_complete':
        console.log('Sync completed successfully');
        break;
      case 'error':
        console.error('Received error message:', syncMessage.payload.error);
        break;
      default:
        console.log('Unknown message type:', syncMessage.type);
    }
  } catch (error) {
    handleError(error, 'MESSAGE_HANDLING');
  }
};

function handleTokenUpdate(tokens: DesignToken[]): void {
  if (!Array.isArray(tokens)) {
    handleError(new Error('Invalid tokens array'), 'TOKEN_VALIDATION');
    return;
  }

  console.log('Processing tokens:', tokens.length);
  
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as string[]
  };

  tokens.forEach((token, index) => {
    try {
      // Sanitize token before processing
      const sanitizedToken = sanitizeToken(token);
      if (!sanitizedToken) {
        results.failed++;
        results.errors.push(`Token ${index}: Invalid token structure`);
        return;
      }

      console.log(`Processing token: ${sanitizedToken.name} = ${sanitizedToken.value} (${sanitizedToken.type})`);
      
      // Basic variable creation logic with proper error handling
      if (sanitizedToken.type === 'color') {
        const variableName = sanitizedToken.name.startsWith('--') ? 
          sanitizedToken.name.substring(2) : sanitizedToken.name;
          
        // Check if variable already exists
        const existingVariable = figma.variables.getLocalVariables().find(v => v.name === variableName);
        
        if (existingVariable) {
          console.log(`Variable ${variableName} already exists, skipping`);
          results.updated++;
        } else {
          const variable = figma.variables.createVariable(variableName, 'LOCAL', 'COLOR');
          console.log(`Created variable: ${variable.name}`);
          results.created++;
        }
      } else {
        console.log(`Skipping non-color token: ${sanitizedToken.name} (${sanitizedToken.type})`);
      }
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Token ${token.name}: ${errorMessage}`);
      console.error(`Failed to process token ${token.name}:`, error);
    }
  });

  // Send results back to UI
  figma.ui.postMessage({
    type: 'sync_complete',
    payload: { 
      status: `Processed ${tokens.length} tokens: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      error: results.errors.length > 0 ? {
        message: `${results.failed} tokens failed to process`,
        details: { errors: results.errors }
      } : undefined
    },
    timestamp: Date.now()
  } as SyncMessage);
}

// Handle plugin closure
figma.on('close', () => {
  console.log('Figma plugin closed');
});