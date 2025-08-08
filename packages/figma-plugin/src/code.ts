// Main Figma plugin code

import type { SyncMessage, DesignToken } from '@figma-story-plugin/shared';

console.log('Figma Story Plugin loaded');

// Show the plugin UI
figma.showUI(__html__, {
  width: 300,
  height: 400,
  title: 'Figma Story Sync'
});

// Handle messages from UI
figma.ui.onmessage = (msg: SyncMessage) => {
  console.log('Received message:', msg);
  
  switch (msg.type) {
    case 'token_update':
      handleTokenUpdate(msg.payload as DesignToken[]);
      break;
    case 'sync_complete':
      console.log('Sync completed successfully');
      break;
    default:
      console.log('Unknown message type:', msg.type);
  }
};

function handleTokenUpdate(tokens: DesignToken[]) {
  console.log('Processing tokens:', tokens.length);
  
  // TODO: Implement token to variable conversion
  tokens.forEach(token => {
    console.log(`Token: ${token.name} = ${token.value} (${token.type})`);
    
    // Basic variable creation logic (placeholder)
    if (token.type === 'color') {
      try {
        const variable = figma.variables.createVariable(token.name, 'LOCAL', 'COLOR');
        console.log(`Created variable: ${variable.name}`);
      } catch (error) {
        console.error('Failed to create variable:', error);
      }
    }
  });
}

// Handle plugin closure
figma.on('close', () => {
  console.log('Figma plugin closed');
});