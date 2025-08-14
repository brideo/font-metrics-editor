# Safari Font Metrics Fix

A tool for modifying font metrics to fix Safari compatibility issues with CSS `ascent-override` and `descent-override` properties.

## Overview

Safari on macOS doesn't respect CSS `ascent-override` and `descent-override` properties, which can cause font alignment issues in web applications. This package solves the problem by directly modifying font files to embed the desired metrics.

```css
/* This doesn't work in Safari */
@font-face {
  font-family: 'MyFont';
  src: url('font.woff2') format('woff2');
  ascent-override: 90%;
  descent-override: 22%;
}
```

## Features

- 📝 Modify font ascent/descent metrics directly in font files
- 🔄 Convert between WOFF2 and TTF formats
- 🎯 Safari-compatible font metric adjustments
- 📊 Font compression with size optimization
- 🛠️ Command-line interface with verbose output

## Installation

```bash
git clone git@github.com:brideo/font-metrics-editor.git
cd font-metrics-editor
npm install
```

## Quick Start

### Complete Workflow: WOFF2 → Modified TTF → WOFF2

```bash
# 1. Modify metrics: WOFF2 → TTF with custom ascent/descent
node font-metrics.js input.woff2 -a 90 -d 22 -o modified.ttf

# 2. Compress back to WOFF2 for web usage
npm run compress modified.ttf -o final.woff2
```

## Usage

### Font Metrics Modification

Decompress WOFF2 files and apply ascent/descent overrides to create TTF files with modified metrics:

#### Basic usage with default values (90% ascent, 22% descent)
```bash
node font-metrics.js your-font.woff2
```

#### Specify custom metrics
```bash
node font-metrics.js your-font.woff2 -a 90 -d 22 -o your-font-fixed.ttf
```

#### List current metrics without modifying
```bash
node font-metrics.js your-font.woff2 --list
```

#### Verbose output
```bash
node font-metrics.js your-font.woff2 -v
```

### TTF to WOFF2 Compression

Convert modified TTF files back to WOFF2 format for web usage:

```bash
# Basic usage
npm run compress your-font.ttf

# Specify output file
npm run compress your-font.ttf -o compressed-font.woff2

# Verbose output with compression stats
npm run compress your-font.ttf -v
```

## Why This Approach?

### Safari Compatibility Issue
Safari on macOS always uses the `hhea` table values for font positioning, regardless of the `USE_TYPO_METRICS` flag. Other browsers typically use the `OS/2` table. CSS `ascent-override` and `descent-override` properties are ignored by Safari.

### Technical Limitations
- `opentype.js` can modify and save fonts, but doesn't properly save `hhea` table changes
- `woff2-encoder` can compress/decompress WOFF2 but can't modify font metrics
- No JavaScript library exists that can both modify font metrics AND output WOFF2

### Our Solution
1. Decompress WOFF2 → TTF using `woff2-encoder`
2. Modify both `OS/2` and `hhea` tables using `opentype.js` + binary patching
3. Output TTF with correct metrics for Safari compatibility
4. Optionally compress back to WOFF2 for web usage

The binary patching ensures Safari gets the correct font ascent/descent values from the `hhea` table.

## Performance

The compression script typically achieves:
- **60-70% size reduction** when converting TTF to WOFF2
- **CSS usage examples** generated automatically
- **Compression statistics** shown with verbose output

## Dependencies

- `commander` - Command-line interface
- `fontkit` - Font reading and analysis
- `opentype.js` - Font modification
- `woff2-encoder` - WOFF2 compression/decompression
- `wawoff2` - Alternative WOFF2 compression

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]
