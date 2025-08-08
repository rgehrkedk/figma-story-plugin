# Demo: End-to-End Color Token Synchronization

This demo demonstrates the complete workflow for synchronizing color tokens from Storybook to Figma using the figma-story-plugin system.

## Demo Overview

This example shows how to:
1. Extract CSS color variables from Storybook stories
2. Send tokens through the WebSocket bridge
3. Create corresponding Figma variables in a collection
4. Establish a live connection between Storybook and Figma

## Components Demonstrated

### 1. CSS Color Variables
The demo includes a sample design system with CSS custom properties:
- Primary colors (brand, accent, etc.)
- Semantic colors (success, warning, error)
- Neutral colors (grays, backgrounds)
- Different color formats (hex, rgb, hsl, named)

### 2. Storybook Stories
Sample components that use the design tokens:
- Button components with various color variants
- Card components with themed backgrounds
- Alert components with semantic colors

### 3. Bridge Server
WebSocket server that handles:
- Authentication between Storybook and Figma
- Real-time token synchronization
- Error handling and connection management

### 4. Figma Plugin
Plugin that creates and manages:
- Variable collections for design tokens
- Color variables with proper RGB values
- Integration with Figma's Variables API

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Figma desktop app (for plugin testing)

### Setup
1. Install dependencies:
   ```bash
   cd examples/demo
   pnpm install
   ```

2. Start the bridge server:
   ```bash
   pnpm bridge:start
   ```
   Note the auth token displayed in the console.

3. Start Storybook:
   ```bash
   pnpm storybook
   ```

4. Load the Figma plugin:
   - Open Figma desktop app
   - Go to Plugins → Development → Import plugin from manifest
   - Select `examples/demo/figma-plugin/manifest.json`

### Usage

1. **Connect Storybook to Bridge:**
   - Open Storybook at http://localhost:6006
   - Go to the "Figma Sync" addon panel
   - Enter bridge URL: `ws://localhost:8080`
   - Enter the auth token from step 2
   - Click "Connect to Bridge"

2. **Connect Figma to Bridge:**
   - In Figma, run the "Demo: Figma Story Sync" plugin
   - Enter the same bridge URL and auth token
   - Click "Connect to Bridge"

3. **Extract and Sync Tokens:**
   - In Storybook, navigate to any story with design tokens
   - The addon will automatically extract color variables
   - Tokens will be sent to Figma via the bridge
   - Check Figma for the "Storybook Design Tokens" variable collection

## Demo Files Structure

```
examples/demo/
├── README.md                    # This file
├── package.json                 # Demo dependencies
├── bridge-server.js             # Standalone bridge server
├── storybook/                   # Storybook configuration
│   ├── .storybook/
│   │   ├── main.js              # Storybook config with addon
│   │   └── preview.js           # Global styles and parameters
│   ├── src/
│   │   ├── design-system.css    # CSS variables for demo
│   │   ├── Button.stories.js    # Button component stories
│   │   ├── Card.stories.js      # Card component stories
│   │   └── Alert.stories.js     # Alert component stories
│   └── package.json
├── figma-plugin/                # Figma plugin for demo
│   ├── manifest.json            # Plugin manifest
│   ├── code.js                  # Plugin code (built)
│   └── ui.html                  # Plugin UI (built)
└── scripts/
    ├── build.js                 # Build all components
    └── test-e2e.js              # End-to-end test script
```

## Expected Results

After running the complete demo, you should see:

### In Storybook:
- Figma Sync addon panel showing connection status
- Extracted color tokens listed in the panel
- Real-time sync status and logs

### In Figma:
- New variable collection: "Storybook Design Tokens"
- Color variables matching your CSS custom properties
- Variables with proper RGB values converted from CSS
- Connection status in the plugin UI

### In Bridge Console:
- WebSocket connections from both Storybook and Figma
- Authentication success messages
- Token synchronization events
- Error handling demonstrations

## Demo Scenarios

### Scenario 1: Basic Color Sync
1. Load the Button stories in Storybook
2. Extract tokens containing primary, secondary colors
3. Verify variables are created in Figma

### Scenario 2: Multiple Color Formats
1. Load stories with various color formats (hex, rgb, hsl)
2. Confirm all formats are properly parsed
3. Check that Figma variables show correct RGB values

### Scenario 3: Real-time Updates
1. Modify CSS variables in design-system.css
2. Refresh Storybook story
3. Re-extract tokens and observe updates in Figma

### Scenario 4: Error Handling
1. Disconnect bridge server
2. Observe connection error handling in both UIs
3. Restart bridge and verify auto-reconnection

## Troubleshooting

### Common Issues

**Bridge Connection Failed:**
- Check that bridge server is running on port 8080
- Verify auth token matches between applications
- Ensure no firewall blocking WebSocket connections

**No Tokens Extracted:**
- Verify CSS custom properties are valid color values
- Check browser console for parsing errors
- Ensure stylesheets are accessible to the parser

**Figma Variables Not Created:**
- Check that plugin has permission to create variables
- Verify color values are in supported formats
- Look for error messages in Figma plugin console

**Performance Issues:**
- Large CSS files may take time to parse
- Rate limiting may delay high-frequency updates
- Check browser memory usage with many tokens

### Debug Mode

Enable verbose logging by setting environment variable:
```bash
DEBUG=figma-story-plugin:* pnpm bridge:start
```

### Testing Without Figma

You can test the Storybook ↔ Bridge connection without Figma:
```bash
# Terminal 1: Start bridge
pnpm bridge:start

# Terminal 2: Run test client
pnpm test:bridge-client
```

## Performance Expectations

This demo is optimized for development and testing. For production use:

- Bridge server can handle ~100 concurrent connections
- Token extraction processes ~1000 CSS variables per second  
- WebSocket messages are limited to prevent spam
- Memory usage scales with number of active connections

## Next Steps

After running the demo successfully:

1. **Extend Token Support**: Add typography, spacing, and effect tokens
2. **Theme Management**: Implement multiple modes/themes
3. **Batch Operations**: Optimize for large design systems
4. **Visual Feedback**: Add progress indicators and previews
5. **Production Setup**: Configure for team collaboration

## Support

For issues with the demo:
1. Check the troubleshooting section above
2. Review logs from bridge server and browser console
3. Verify all prerequisites are met
4. Test individual components in isolation