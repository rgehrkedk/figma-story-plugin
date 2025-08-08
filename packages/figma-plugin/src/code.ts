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

function hexToRgb(hex: string): RGB | null {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  
  // Handle 6-digit hex
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  
  return null;
}

function parseColorValue(colorValue: string): RGB | null {
  const value = colorValue.trim().toLowerCase();
  
  // Handle hex colors
  if (value.startsWith('#')) {
    return hexToRgb(value);
  }
  
  // Handle rgb/rgba colors
  const rgbMatch = value.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]) / 255;
    const g = parseInt(rgbMatch[2]) / 255;
    const b = parseInt(rgbMatch[3]) / 255;
    return { r, g, b };
  }
  
  // Handle named colors (basic set)
  const namedColors: Record<string, RGB> = {
    'transparent': { r: 0, g: 0, b: 0 },
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 1, g: 1, b: 1 },
    'red': { r: 1, g: 0, b: 0 },
    'green': { r: 0, g: 1, b: 0 },
    'blue': { r: 0, g: 0, b: 1 },
    'yellow': { r: 1, g: 1, b: 0 },
    'magenta': { r: 1, g: 0, b: 1 },
    'cyan': { r: 0, g: 1, b: 1 },
    'gray': { r: 0.5, g: 0.5, b: 0.5 },
    'grey': { r: 0.5, g: 0.5, b: 0.5 }
  };
  
  if (value in namedColors) {
    return namedColors[value];
  }
  
  return null;
}

async function ensureVariableCollection(): Promise<VariableCollection> {
  const collectionName = 'Storybook Design Tokens';
  
  // Check if collection already exists
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const existingCollection = collections.find(c => c.name === collectionName);
  
  if (existingCollection) {
    return existingCollection;
  }
  
  // Create new collection
  const collection = figma.variables.createVariableCollection(collectionName);
  
  // Rename default mode to 'Default'
  const defaultMode = collection.modes[0];
  collection.renameMode(defaultMode.modeId, 'Default');
  
  return collection;
}

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

  // Process tokens asynchronously
  (async () => {
    try {
      // Ensure we have a collection for design tokens
      const collection = await ensureVariableCollection();
      const defaultModeId = collection.modes[0].modeId;

      for (const [index, token] of tokens.entries()) {
        try {
          // Sanitize token before processing
          const sanitizedToken = sanitizeToken(token);
          if (!sanitizedToken) {
            results.failed++;
            results.errors.push(`Token ${index}: Invalid token structure`);
            continue;
          }

          console.log(`Processing token: ${sanitizedToken.name} = ${sanitizedToken.value} (${sanitizedToken.type})`);
          
          // Only process color tokens for this iteration
          if (sanitizedToken.type === 'color') {
            const variableName = sanitizedToken.name.startsWith('--') ? 
              sanitizedToken.name.substring(2) : sanitizedToken.name;
              
            // Parse color value to RGB
            const rgbValue = parseColorValue(sanitizedToken.value);
            if (!rgbValue) {
              results.failed++;
              results.errors.push(`Token ${sanitizedToken.name}: Could not parse color value '${sanitizedToken.value}'`);
              continue;
            }
              
            // Check if variable already exists in this collection
            const existingVariable = collection.variableIds
              .map(id => figma.variables.getVariableById(id))
              .find(v => v && v.name === variableName);
            
            let variable: Variable;
            
            if (existingVariable) {
              console.log(`Variable ${variableName} already exists, updating value`);
              variable = existingVariable;
              results.updated++;
            } else {
              variable = figma.variables.createVariable(variableName, collection.id, 'COLOR');
              console.log(`Created variable: ${variable.name}`);
              results.created++;
            }
            
            // Set the color value for the default mode
            variable.setValueForMode(defaultModeId, rgbValue);
            
          } else {
            console.log(`Skipping non-color token: ${sanitizedToken.name} (${sanitizedToken.type})`);
          }
        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Token ${token.name}: ${errorMessage}`);
          console.error(`Failed to process token ${token.name}:`, error);
        }
      }

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
      
    } catch (error) {
      handleError(error, 'TOKEN_PROCESSING');
    }
  })();
}

// Handle plugin closure
figma.on('close', () => {
  console.log('Figma plugin closed');
});