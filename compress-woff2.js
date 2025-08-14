#!/usr/bin/env node

/**
 * TTF to WOFF2 Compression Script
 * Compresses TTF/OTF font files to WOFF2 format for web usage
 * 
 * Usage:
 *   node compress-woff2.js input.ttf -o output.woff2
 *   npm run compress input.ttf -o output.woff2
 */

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import wawoff2 from 'wawoff2';

// Parse command line arguments
program
  .name('compress-woff2')
  .description('Compress TTF/OTF fonts to WOFF2 format')
  .argument('<input>', 'Input font file path (TTF/OTF)')
  .option('-o, --output <path>', 'Output WOFF2 file path (defaults to input.woff2)')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();
const inputPath = program.args[0];

// Validate input file exists
if (!fs.existsSync(inputPath)) {
  console.error(`✗ Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

// Validate input file format
const inputExt = path.extname(inputPath).toLowerCase();
if (!['.ttf', '.otf'].includes(inputExt)) {
  console.error(`✗ Error: Unsupported input format: ${inputExt}. Use TTF or OTF files.`);
  process.exit(1);
}

// Generate output path if not specified
const outputPath = options.output || generateOutputPath(inputPath);

function generateOutputPath(inputPath) {
  const parsed = path.parse(inputPath);
  return path.join(parsed.dir, `${parsed.name}.woff2`);
}

// Compress the font
async function compressFont() {
  try {
    if (options.verbose) {
      console.log(`📝 Reading input file: ${inputPath}`);
    }
    
    // Read the input TTF/OTF file
    const inputBuffer = fs.readFileSync(inputPath);
    
    if (options.verbose) {
      console.log(`📦 Input file size: ${inputBuffer.length} bytes`);
      console.log(`🔄 Compressing to WOFF2...`);
    }
    
    // Compress to WOFF2
    const woff2Buffer = await wawoff2.compress(inputBuffer);
    
    // Write the compressed file
    fs.writeFileSync(outputPath, woff2Buffer);
    
    const compressionRatio = ((1 - woff2Buffer.length / inputBuffer.length) * 100).toFixed(1);
    
    console.log(`✓ Compressed ${path.basename(inputPath)} to ${path.basename(outputPath)}`);
    console.log(`📊 Size: ${inputBuffer.length} → ${woff2Buffer.length} bytes (${compressionRatio}% smaller)`);
    
    if (options.verbose) {
      console.log(`💾 Saved to: ${outputPath}`);
      generateCSSExample();
    }
    
  } catch (error) {
    console.error(`✗ Error compressing font: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function generateCSSExample() {
  const fontName = path.basename(outputPath, '.woff2');
  
  console.log('\n📝 CSS Usage:');
  console.log('```css');
  console.log('@font-face {');
  console.log(`  font-family: '${fontName}';`);
  console.log(`  src: url('${path.basename(outputPath)}') format('woff2');`);
  console.log('  font-weight: normal;');
  console.log('  font-style: normal;');
  console.log('  font-display: swap;');
  console.log('}');
  console.log('```');
}

// Run the script
compressFont().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});