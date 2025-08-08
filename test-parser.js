#!/usr/bin/env node

/**
 * Quick test script to validate parser works with demo design system
 */

import { readFileSync } from 'fs';
import { TokenParser } from './packages/parser/src/index.ts';

const designSystemCSS = readFileSync('./examples/demo/storybook/src/design-system.css', 'utf8');
const parser = new TokenParser({ colorFormats: ['hex', 'rgb', 'hsl', 'named'] });

console.log('🧪 Testing parser with demo design system...\n');

try {
  const result = await parser.parseCSS(designSystemCSS, 'design-system.css');
  
  console.log(`✅ Found ${result.tokens.length} color tokens`);
  console.log(`❌ Errors: ${result.errors.length}\n`);

  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach(error => console.log(`  - ${error.message}`));
  }

  console.log('Color tokens found:');
  result.tokens
    .filter(token => token.type === 'color')
    .slice(0, 10) // Show first 10
    .forEach(token => {
      console.log(`  🎨 ${token.name}: ${token.value}`);
    });
    
  if (result.tokens.length > 10) {
    console.log(`  ... and ${result.tokens.length - 10} more`);
  }
  
  console.log(`\n🎯 Next: Map these ${result.tokens.length} tokens to Figma variables`);
  
} catch (error) {
  console.error('❌ Parser test failed:', error.message);
  process.exit(1);
}