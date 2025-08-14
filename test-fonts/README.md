# Test Fonts for font-metrics.js

This directory contains free, open-source fonts for testing all supported formats in the font-metrics tool.

## Font Files and Sources

### TTF (TrueType Font) Format
- **Roboto-Regular.ttf** - Google Fonts
  - Source: https://github.com/google/fonts/tree/main/apache/roboto
  - License: Apache License 2.0
  - Tests: Basic TTF processing

- **OpenSans-Regular.ttf** - Google Fonts  
  - Source: https://github.com/google/fonts/tree/main/apache/opensans
  - License: SIL Open Font License 1.1
  - Tests: Alternative TTF processing

- **Lato-Regular.ttf** - Google Fonts
  - Source: https://github.com/google/fonts/tree/main/ofl/lato  
  - License: SIL Open Font License 1.1
  - Tests: Additional TTF processing

### OTF (OpenType Font) Format
- **SourceSansPro-Regular.otf** - Adobe Fonts
  - Source: https://github.com/adobe-fonts/source-sans-pro
  - License: SIL Open Font License 1.1
  - Tests: OpenType font processing

### WOFF (Web Open Font Format) Format  
- **OpenSans-Regular.woff** - Google Fonts
  - Source: Google Fonts CDN
  - License: SIL Open Font License 1.1
  - Tests: WOFF format processing

### WOFF2 (Web Open Font Format 2) Format
- **Roboto-Regular.woff2** - Google Fonts
  - Source: Google Fonts CDN  
  - License: Apache License 2.0
  - Tests: WOFF2 decompression and processing

## Running Tests

To test all formats:
```bash
node test-formats.js
```

To test individual fonts:
```bash
# TTF format
node font-metrics.js test-fonts/Roboto-Regular.ttf --list

# OTF format  
node font-metrics.js test-fonts/SourceSansPro-Regular.otf --list

# WOFF format
node font-metrics.js test-fonts/OpenSans-Regular.woff --list

# WOFF2 format
node font-metrics.js test-fonts/Roboto-Regular.woff2 --list
```

## Expected Behavior

All fonts should:
1. Load successfully and display current metrics with `--list`
2. Allow metric modification with `-a`, `-d`, `-l` parameters
3. Generate valid output fonts that can be re-read
4. Preserve glyph data while updating vertical metrics

## Font Licenses

All fonts in this directory are distributed under open-source licenses:
- **Apache License 2.0**: Roboto fonts
- **SIL Open Font License 1.1**: Source Sans Pro, Open Sans, Lato

These licenses permit modification, redistribution, and use in both personal and commercial projects.