#!/usr/bin/env node

/**
 * Standalone bridge server for the figma-story-plugin demo
 * 
 * This creates a WebSocket server that facilitates communication
 * between Storybook and Figma for design token synchronization.
 */

import { createBridge } from '@figma-story-plugin/bridge';

// Configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
const RATE_LIMIT = {
  maxMessages: 50,
  windowMs: 60000 // 1 minute
};

// Create and start bridge server
const bridge = createBridge({
  port: PORT,
  host: HOST,
  rateLimit: RATE_LIMIT
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down bridge server...');
  try {
    await bridge.stop();
    console.log('✅ Bridge server stopped gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  try {
    await bridge.stop();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

// Start the server
async function startServer() {
  try {
    console.log('🚀 Starting Figma Story Plugin Bridge Server...');
    console.log(`📡 Server configuration:`);
    console.log(`   - Host: ${HOST}`);
    console.log(`   - Port: ${PORT}`);
    console.log(`   - Rate limit: ${RATE_LIMIT.maxMessages} messages per ${RATE_LIMIT.windowMs}ms`);
    console.log('');

    await bridge.start();

    const authToken = bridge.getAuthToken();
    console.log('🔐 Authentication token:');
    console.log(`   ${authToken}`);
    console.log('');
    console.log('📋 Copy this token to connect Storybook and Figma!');
    console.log('');
    console.log('🔗 WebSocket URL: ws://' + HOST + ':' + PORT);
    console.log('');
    console.log('📊 Connection status:');
    
    // Monitor connections
    setInterval(() => {
      const clients = bridge.getConnectedClients();
      const authenticated = clients.filter(c => c.authenticated);
      const storybookClients = authenticated.filter(c => c.type === 'storybook');
      const figmaClients = authenticated.filter(c => c.type === 'figma');
      
      process.stdout.write(`\r   Connected: ${authenticated.length} total (${storybookClients.length} Storybook, ${figmaClients.length} Figma)`);
    }, 2000);

  } catch (error) {
    console.error('❌ Failed to start bridge server:', error.message);
    
    if (error.code === 'EADDRINUSE') {
      console.error(`   Port ${PORT} is already in use. Try a different port with:`);
      console.error(`   PORT=${PORT + 1} node bridge-server.js`);
    }
    
    process.exit(1);
  }
}

// Additional debugging if enabled
if (process.env.DEBUG) {
  console.log('🐛 Debug mode enabled');
  
  // Log all WebSocket events
  const originalBroadcast = bridge.broadcast;
  bridge.broadcast = function(message, excludeId) {
    console.log(`📤 Broadcasting ${message.type}:`, {
      timestamp: new Date(message.timestamp).toISOString(),
      payloadSize: JSON.stringify(message.payload).length,
      excludeId
    });
    return originalBroadcast.call(this, message, excludeId);
  };
}

// Health check endpoint (if needed for monitoring)
if (process.env.HEALTH_CHECK_PORT) {
  const http = require('http');
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      const clients = bridge.getConnectedClients();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        uptime: process.uptime(),
        connections: clients.length,
        authenticated: clients.filter(c => c.authenticated).length
      }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  healthServer.listen(process.env.HEALTH_CHECK_PORT, () => {
    console.log(`🏥 Health check available at http://localhost:${process.env.HEALTH_CHECK_PORT}/health`);
  });
}

// Start the server
startServer();