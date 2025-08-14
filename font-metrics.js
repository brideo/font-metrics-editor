#!/usr/bin/env node

/**
 * Font Metrics Modifier Script
 * Modifies vertical metrics in font files to fix Safari compatibility issues
 * with ascent-override and descent-override CSS properties.
 * 
 * Installation:
 *   npm install fontkit opentype.js commander
 * 
 * Usage:
 *   node font-metrics.js input.woff2 -o output.woff2 -a 90 -d 22
 */

import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';
import * as fontkit from 'fontkit';
import { program } from 'commander';
import { decompress } from 'woff2-encoder';

// Parse command line arguments
program
  .name('font-metrics')
  .description('Modify font vertical metrics for Safari compatibility')
  .argument('<input>', 'Input font file path')
  .option('-o, --output <path>', 'Output font file path (defaults to input-fixed.ext)')
  .option('-a, --ascent <percent>', 'Ascent as percentage of em size', parseFloat, 90)
  .option('-d, --descent <percent>', 'Descent as percentage of em size', parseFloat, 22)
  .option('-l, --line-gap <units>', 'Line gap in font units', parseFloat, 0)
  .option('-v, --verbose', 'Show detailed output')
  .option('--list', 'List current metrics without modifying')
  .parse();

const options = program.opts();
const inputPath = program.args[0];

// Validate input file exists
if (!fs.existsSync(inputPath)) {
  console.error(`✗ Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

// Generate output path if not specified
const outputPath = options.output || generateOutputPath(inputPath);

function generateOutputPath(inputPath) {
  const parsed = path.parse(inputPath);
  // For WOFF2 input, default to TTF output since opentype.js doesn't generate WOFF2
  const ext = parsed.ext.toLowerCase() === '.woff2' ? '.ttf' : parsed.ext;
  return path.join(parsed.dir, `${parsed.name}-fixed${ext}`);
}

// Load and modify the font
async function modifyFont() {
  try {
    let font;
    
    // Check if this is a WOFF2 file
    const isWoff2 = path.extname(inputPath).toLowerCase() === '.woff2';
    
    if (isWoff2) {
      // For WOFF2 files, use fontkit to read metrics and display info
      const fontkitFont = await fontkit.open(inputPath);
      
      if (options.verbose || options.list) {
        console.log(`✓ Loaded WOFF2 font: ${inputPath}`);
        console.log(`  Font family: ${fontkitFont.familyName}`);
        console.log(`  Units per em: ${fontkitFont.unitsPerEm}`);
        console.log('\nCurrent metrics:');
        
        // Access tables directly from fontkit
        const os2 = fontkitFont['OS/2'];
        const hhea = fontkitFont.hhea;
        
        if (os2) {
          console.log(`  OS/2 Ascender: ${os2.typoAscender}`);
          console.log(`  OS/2 Descender: ${os2.typoDescender}`);
          console.log(`  OS/2 Line Gap: ${os2.typoLineGap}`);
          console.log(`  Win Ascent: ${os2.winAscent}`);
          console.log(`  Win Descent: ${os2.winDescent}`);
        }
        
        if (hhea) {
          console.log(`  hhea Ascent: ${hhea.ascent}`);
          console.log(`  hhea Descent: ${hhea.descent}`);
          console.log(`  hhea Line Gap: ${hhea.lineGap}`);
        }
      }
      
      if (options.list) {
        return; // Exit if only listing metrics
      }
      
      // Use woff2-encoder to decompress WOFF2 to TTF
      try {
        const woff2Buffer = fs.readFileSync(inputPath);
        const ttfBuffer = await decompress(woff2Buffer);
        
        if (options.verbose) {
          console.log(`Decompressed WOFF2 to TTF: ${ttfBuffer.length || ttfBuffer.byteLength} bytes`);
          console.log(`First 4 bytes: ${Array.from(new Uint8Array(ttfBuffer, 0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        }
        
        // Parse the decompressed TTF with opentype.js using .buffer as shown in docs
        font = opentype.parse(ttfBuffer.buffer);
        
      } catch (woff2Error) {
        throw new Error(`WOFF2 decompression failed: ${woff2Error.message}`);
      }
    } else {
      // Read font file normally for TTF/OTF/WOFF
      const fontBuffer = fs.readFileSync(inputPath);
      font = opentype.parse(fontBuffer.buffer ? fontBuffer.buffer : fontBuffer);
    }
    
    if (options.verbose || options.list) {
      console.log(`✓ Loaded font: ${inputPath}`);
      console.log(`  Font family: ${font.names.fontFamily.en || 'Unknown'}`);
      console.log(`  Units per em: ${font.unitsPerEm}`);
      console.log('\nCurrent metrics:');
      console.log(`  OS/2 Ascender: ${font.tables.os2?.sTypoAscender}`);
      console.log(`  OS/2 Descender: ${font.tables.os2?.sTypoDescender}`);
      console.log(`  OS/2 Line Gap: ${font.tables.os2?.sTypoLineGap}`);
      console.log(`  hhea Ascent: ${font.tables.hhea?.ascender}`);
      console.log(`  hhea Descent: ${font.tables.hhea?.descender}`);
      console.log(`  hhea Line Gap: ${font.tables.hhea?.lineGap}`);
      console.log(`  Win Ascent: ${font.tables.os2?.usWinAscent}`);
      console.log(`  Win Descent: ${font.tables.os2?.usWinDescent}`);
    }
    
    if (options.list) {
      return; // Exit if only listing metrics
    }
    
    // Calculate new metrics
    const unitsPerEm = font.unitsPerEm;
    const newAscent = Math.round(unitsPerEm * (options.ascent / 100));
    const newDescent = -Math.round(unitsPerEm * (options.descent / 100));
    const newLineGap = Math.round(options.lineGap);
    
    if (options.verbose) {
      console.log('\nNew metrics to apply:');
      console.log(`  Ascent: ${newAscent} (${options.ascent}% of ${unitsPerEm})`);
      console.log(`  Descent: ${newDescent} (${options.descent}% of ${unitsPerEm})`);
      console.log(`  Line Gap: ${newLineGap}`);
    }
    
    // Modify OS/2 table (Windows/cross-platform metrics)
    if (font.tables.os2) {
      font.tables.os2.sTypoAscender = newAscent;
      font.tables.os2.sTypoDescender = newDescent;
      font.tables.os2.sTypoLineGap = newLineGap;
      
      // Update Windows-specific metrics
      font.tables.os2.usWinAscent = Math.abs(newAscent);
      font.tables.os2.usWinDescent = Math.abs(newDescent);
      
      // Set USE_TYPO_METRICS flag (bit 7) to ensure typo metrics are used
      font.tables.os2.fsSelection = font.tables.os2.fsSelection | 0x80;
      
      if (options.verbose) {
        console.log('✓ Updated OS/2 table metrics');
      }
    } else {
      console.warn('⚠ Warning: Font has no OS/2 table');
    }
    
    // Modify hhea table (Mac metrics) - CRITICAL for Safari compatibility
    if (font.tables.hhea) {
      // WORKAROUND: opentype.js doesn't properly save hhea modifications
      // So we create a new hhea table from scratch
      const originalHhea = font.tables.hhea;
      
      // Create new hhea table with our modified values
      font.tables.hhea = {
        version: originalHhea.version || 0x00010000,
        ascender: newAscent,           // ← Critical for Safari
        descender: newDescent,         // ← Critical for Safari  
        lineGap: newLineGap,
        advanceWidthMax: originalHhea.advanceWidthMax,
        minLeftSideBearing: originalHhea.minLeftSideBearing,
        minRightSideBearing: originalHhea.minRightSideBearing,
        xMaxExtent: originalHhea.xMaxExtent,
        caretSlopeRise: originalHhea.caretSlopeRise,
        caretSlopeRun: originalHhea.caretSlopeRun,
        caretOffset: originalHhea.caretOffset,
        reserved1: originalHhea.reserved1 || 0,
        reserved2: originalHhea.reserved2 || 0,
        reserved3: originalHhea.reserved3 || 0,
        reserved4: originalHhea.reserved4 || 0,
        metricDataFormat: originalHhea.metricDataFormat || 0,
        numberOfHMetrics: originalHhea.numberOfHMetrics
      };
      
      if (options.verbose) {
        console.log('✓ Recreated hhea table with new metrics');
        console.log(`  New hhea Ascent: ${newAscent}`);
        console.log(`  New hhea Descent: ${newDescent}`);
        console.log(`  New hhea Line Gap: ${newLineGap}`);
      }
    } else {
      console.warn('⚠ Warning: Font has no hhea table');
    }
    
    // WORKAROUND: Since opentype.js can't properly save hhea modifications,
    // we'll use a binary patch approach to directly modify the TTF bytes
    try {
      // First save with opentype.js (this handles OS/2 and other tables)
      const outputBuffer = Buffer.from(font.toArrayBuffer());
      
      // Now manually patch the hhea table bytes
      const patchedBuffer = patchHheaTable(outputBuffer, newAscent, newDescent, newLineGap);
      
      fs.writeFileSync(outputPath, patchedBuffer);
      console.log(`\n✓ Font saved to: ${outputPath}`);
      
      // Verify the changes were actually saved
      if (options.verbose) {
        console.log('\nVerifying saved font metrics...');
        try {
          const verifyFont = opentype.loadSync(outputPath);
          console.log(`Verification - hhea Ascent: ${verifyFont.tables.hhea?.ascender || 'undefined'}`);
          console.log(`Verification - hhea Descent: ${verifyFont.tables.hhea?.descender || 'undefined'}`);
          console.log(`Verification - OS/2 Ascent: ${verifyFont.tables.os2?.sTypoAscender || 'undefined'}`);
        } catch (verifyError) {
          console.warn('⚠ Could not verify saved font metrics');
        }
      }
    } catch (saveError) {
      throw new Error(`Failed to save font: ${saveError.message}`);
    }
    
    // Inform user about format change if needed
    if (isWoff2 && !options.output) {
      console.log(`ℹ  Note: WOFF2 input converted to TTF output (opentype.js limitation)`);
      console.log(`   To convert back to WOFF2, use: woff2_compress ${path.basename(outputPath)}`);
    }
    
    // Generate CSS example
    generateCSSExample();
    
  } catch (error) {
    console.error(`✗ Error processing font: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function generateCSSExample() {
  const fontName = path.basename(outputPath, path.extname(outputPath));
  const ext = path.extname(outputPath).slice(1);
  
  console.log('\n📝 CSS Usage:');
  console.log('```css');
  console.log('@font-face {');
  console.log(`  font-family: '${fontName}';`);
  console.log(`  src: url('${path.basename(outputPath)}') format('${getFormat(ext)}');`);
  console.log('  font-weight: normal;');
  console.log('  font-style: normal;');
  console.log('  /* Metrics are now baked into the font file */');
  console.log('  /* No need for ascent-override or descent-override! */');
  console.log('}');
  console.log('```');
}

function getFormat(ext) {
  const formats = {
    'woff2': 'woff2',
    'woff': 'woff',
    'ttf': 'truetype',
    'otf': 'opentype'
  };
  return formats[ext.toLowerCase()] || ext.toLowerCase();
}

/**
 * Binary patch the hhea table in a TTF buffer
 * This is a workaround for opentype.js not properly saving hhea table modifications
 */
function patchHheaTable(buffer, ascent, descent, lineGap) {
  try {
    // Create a copy of the buffer
    const patchedBuffer = Buffer.from(buffer);
    
    // Find the hhea table in the TTF
    const hheaTag = Buffer.from('hhea');
    let hheaOffset = -1;
    
    // Look for 'hhea' tag in the font directory (starts at offset 12)
    for (let i = 12; i < buffer.length - 16; i += 16) {
      if (buffer.subarray(i, i + 4).equals(hheaTag)) {
        // Found hhea table directory entry
        // Offset is at bytes 8-11 of the directory entry (big-endian)
        hheaOffset = buffer.readUInt32BE(i + 8);
        break;
      }
    }
    
    if (hheaOffset === -1) {
      console.warn('⚠ Could not find hhea table for binary patching');
      return patchedBuffer;
    }
    
    if (options.verbose) {
      console.log(`Found hhea table at offset: 0x${hheaOffset.toString(16)}`);
    }
    
    // hhea table structure (all values are signed 16-bit big-endian):
    // 0x00: version (4 bytes)
    // 0x04: ascender (2 bytes) ← PATCH THIS
    // 0x06: descender (2 bytes) ← PATCH THIS  
    // 0x08: lineGap (2 bytes) ← PATCH THIS
    // ... other fields follow
    
    // Patch ascender at offset + 4
    patchedBuffer.writeInt16BE(ascent, hheaOffset + 4);
    
    // Patch descender at offset + 6
    patchedBuffer.writeInt16BE(descent, hheaOffset + 6);
    
    // Patch lineGap at offset + 8
    patchedBuffer.writeInt16BE(lineGap, hheaOffset + 8);
    
    if (options.verbose) {
      console.log(`✓ Binary patched hhea table:`);
      console.log(`  Ascent: ${ascent} at offset 0x${(hheaOffset + 4).toString(16)}`);
      console.log(`  Descent: ${descent} at offset 0x${(hheaOffset + 6).toString(16)}`);
      console.log(`  LineGap: ${lineGap} at offset 0x${(hheaOffset + 8).toString(16)}`);
    }
    
    return patchedBuffer;
  } catch (error) {
    console.warn(`⚠ Binary patching failed: ${error.message}`);
    return buffer; // Return original buffer if patching fails
  }
}

// Run the script
modifyFont().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

/**
 * Alternative implementation using fontkit (more robust for reading metrics)
 * Uncomment this section if you prefer fontkit over opentype.js
 */

/*
const fontkit = require('fontkit');

async function modifyFontWithFontkit() {
  try {
    // Read font with fontkit (better for reading)
    const font = await fontkit.open(inputPath);
    
    if (options.verbose || options.list) {
      console.log(`✓ Loaded font: ${inputPath}`);
      console.log(`  Font family: ${font.familyName}`);
      console.log(`  Units per em: ${font.unitsPerEm}`);
      console.log('\nCurrent metrics:');
      console.log(`  OS/2 Ascender: ${font['OS/2']?.typoAscender}`);
      console.log(`  OS/2 Descender: ${font['OS/2']?.typoDescender}`);
      console.log(`  OS/2 Line Gap: ${font['OS/2']?.typoLineGap}`);
      console.log(`  hhea Ascent: ${font.hhea?.ascent}`);
      console.log(`  hhea Descent: ${font.hhea?.descent}`);
      console.log(`  hhea Line Gap: ${font.hhea?.lineGap}`);
    }
    
    if (options.list) {
      return;
    }
    
    // Note: fontkit is read-only, so we need to use opentype.js or another tool
    // to actually modify and save the font. This is just for better reading.
    console.log('⚠ Note: fontkit is read-only. Use opentype.js implementation above.');
    
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
  }
}
*/
